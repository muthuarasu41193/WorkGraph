import { logErrorCode } from "@/lib/security/log";

import { ACCOUNT_STORAGE_BUCKETS, ACCOUNT_TABLES } from "./data-map";
import { AccountDataError } from "./errors";
import {
  ACCOUNT_DELETE_FAILED,
  ACCOUNT_DELETE_RATE_LIMITED,
  ACCOUNT_DELETED_REDIRECT,
  ACCOUNT_EXPORT_FAILED,
  ACCOUNT_EXPORT_FILENAME,
  ACCOUNT_EXPORT_RATE_LIMITED,
  ACCOUNT_UNAVAILABLE,
  DELETE_CONFIRMATION_REQUIRED,
  SIGN_IN_REQUIRED,
  parseDeleteConfirmation,
} from "./messages";
import { accountDataRights } from "./privacy-copy";
import type { AccountStore } from "./store";

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

export type AccountHttpResult = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

const NO_STORE = { "Cache-Control": "no-store" };

function failureStatus(error: unknown, fallbackCode: "account_export_failed" | "account_delete_failed"): {
  code: string;
  status: number;
} {
  if (error instanceof AccountDataError && error.code === "account_storage_failed") {
    return { code: error.code, status: 500 };
  }
  if (error instanceof AccountDataError && error.code === "account_auth_delete_failed") {
    return { code: error.code, status: 500 };
  }
  if (error instanceof AccountDataError) return { code: error.code, status: 500 };
  return { code: fallbackCode, status: 500 };
}

export async function handleAccountExport(input: {
  userId: string | null;
  store: AccountStore | null;
  rateLimit: (key: string) => RateLimitResult;
  now?: () => Date;
}): Promise<AccountHttpResult> {
  if (!input.userId) {
    return { status: 401, body: { error: SIGN_IN_REQUIRED }, headers: NO_STORE };
  }
  if (!input.store) {
    logErrorCode("account/export", "account_unconfigured");
    return { status: 503, body: { error: ACCOUNT_UNAVAILABLE }, headers: NO_STORE };
  }

  const rate = input.rateLimit(`account-export:${input.userId}`);
  if (!rate.allowed) {
    return {
      status: 429,
      body: { error: ACCOUNT_EXPORT_RATE_LIMITED },
      headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSec) },
    };
  }

  try {
    const tables: Record<string, Record<string, unknown>[]> = {};
    for (const spec of ACCOUNT_TABLES) {
      if (!spec.export) continue;
      tables[spec.table] = await input.store.selectOwned(spec.table, spec.ownerColumn, input.userId);
    }
    const storage: Record<string, string[]> = {};
    for (const bucket of ACCOUNT_STORAGE_BUCKETS) {
      storage[bucket] = await input.store.listOwnedObjects(bucket, input.userId);
    }
    const rights = accountDataRights();
    const body = {
      exportedAt: (input.now ?? (() => new Date()))().toISOString(),
      userId: input.userId,
      account: await input.store.getAuthAccount(input.userId),
      tables,
      storage,
      notes: {
        payments: rights.payments,
        consent: rights.consent,
        backup: rights.backup,
        embeddings:
          "Only embeddings with your user id are included. Catalog rows that have no owner are not yours.",
        files: "Storage entries are file paths in your folder. This file does not contain download links.",
      },
    };
    return {
      status: 200,
      body,
      headers: {
        ...NO_STORE,
        "Content-Disposition": `attachment; filename="${ACCOUNT_EXPORT_FILENAME}"`,
      },
    };
  } catch (error) {
    const failed = failureStatus(error, "account_export_failed");
    logErrorCode("account/export", failed.code);
    return { status: failed.status, body: { error: ACCOUNT_EXPORT_FAILED }, headers: NO_STORE };
  }
}

export async function handleAccountDelete(input: {
  userId: string | null;
  body: unknown;
  store: AccountStore | null;
  rateLimit: (key: string) => RateLimitResult;
}): Promise<AccountHttpResult> {
  if (!input.userId) {
    return { status: 401, body: { error: SIGN_IN_REQUIRED }, headers: NO_STORE };
  }
  if (!parseDeleteConfirmation(input.body)) {
    return { status: 400, body: { error: DELETE_CONFIRMATION_REQUIRED }, headers: NO_STORE };
  }
  if (!input.store) {
    logErrorCode("account/delete", "account_unconfigured");
    return { status: 503, body: { error: ACCOUNT_UNAVAILABLE }, headers: NO_STORE };
  }

  const rate = input.rateLimit(`account-delete:${input.userId}`);
  if (!rate.allowed) {
    return {
      status: 429,
      body: { error: ACCOUNT_DELETE_RATE_LIMITED },
      headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSec) },
    };
  }

  try {
    for (const bucket of ACCOUNT_STORAGE_BUCKETS) {
      const paths = await input.store.listOwnedObjects(bucket, input.userId);
      if (paths.length > 0) {
        await input.store.removeOwnedObjects(bucket, input.userId, paths);
      }
    }
    for (const spec of ACCOUNT_TABLES) {
      if (spec.deleteStrategy === "delete") {
        await input.store.deleteOwned(spec.table, spec.ownerColumn, input.userId);
      } else {
        await input.store.anonymiseOwned(spec.table, spec.ownerColumn, input.userId);
      }
    }
    await input.store.deleteAuthUser(input.userId);
    return {
      status: 200,
      body: { ok: true, redirectTo: ACCOUNT_DELETED_REDIRECT },
      headers: NO_STORE,
    };
  } catch (error) {
    const failed = failureStatus(error, "account_delete_failed");
    logErrorCode("account/delete", failed.code);
    return { status: failed.status, body: { error: ACCOUNT_DELETE_FAILED }, headers: NO_STORE };
  }
}
