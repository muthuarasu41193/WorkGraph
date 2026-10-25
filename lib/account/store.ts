import type { SupabaseClient } from "@supabase/supabase-js";

import { isOwnedResumeStoragePath } from "@/lib/security/resume-access";

import { accountTable, isAccountStorageBucket, type AccountStorageBucket } from "./data-map";
import { AccountDataError } from "./errors";
import { sanitizeExportValue } from "./sanitize-export";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20_000;
const STORAGE_PAGE = 100;

type QueryError = { code?: string; message?: string; status?: number; statusCode?: string | number } | null;

type QueryResult = { data: unknown; error: QueryError };

type Builder = PromiseLike<QueryResult> & {
  select(columns: string): Builder;
  update(values: Record<string, null>): Builder;
  delete(): Builder;
  eq(column: string, value: string): Builder;
  range(from: number, to: number): Builder;
};

type StorageEntry = { name?: string | null; id?: string | null };

type AccountDatabase = {
  from(table: string): Builder;
  storage: {
    from(bucket: string): {
      list(
        path: string,
        options: { limit: number; offset: number },
      ): Promise<{ data: StorageEntry[] | null; error: QueryError }>;
      remove(paths: string[]): Promise<{ error: QueryError }>;
    };
  };
  auth: {
    admin: {
      getUserById(id: string): Promise<{
        data: { user: { id: string; email?: string | null; phone?: string | null; created_at?: string } | null };
        error: QueryError;
      }>;
      deleteUser(id: string): Promise<{ error: QueryError }>;
    };
  };
};

export type AccountAuthRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
};

export type AccountStore = {
  selectOwned(table: string, ownerColumn: string, userId: string): Promise<Record<string, unknown>[]>;
  anonymiseOwned(table: string, ownerColumn: string, userId: string): Promise<void>;
  deleteOwned(table: string, ownerColumn: string, userId: string): Promise<void>;
  listOwnedObjects(bucket: AccountStorageBucket, userId: string): Promise<string[]>;
  removeOwnedObjects(bucket: AccountStorageBucket, userId: string, paths: string[]): Promise<void>;
  getAuthAccount(userId: string): Promise<AccountAuthRecord | null>;
  deleteAuthUser(userId: string): Promise<void>;
};

function assertUserId(userId: string): void {
  if (!userId || userId.includes("/") || userId.includes("\\") || userId.includes("..")) {
    throw new AccountDataError("account_export_failed");
  }
}

function assertMappedTable(table: string, ownerColumn: string, failure: "account_export_failed" | "account_delete_failed"): void {
  const spec = accountTable(table);
  if (!spec || spec.ownerColumn !== ownerColumn) {
    throw new AccountDataError(failure);
  }
}

function isMissingRelation(error: QueryError): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

function isMissingStorage(error: QueryError): boolean {
  if (!error) return false;
  const status = String(error.status ?? error.statusCode ?? "");
  return status === "404" || /not found/i.test(error.message ?? "");
}

function isMissingAuthUser(error: QueryError): boolean {
  if (!error) return false;
  if (error.status === 404 || String(error.statusCode ?? "") === "404") return true;
  return /not found/i.test(error.message ?? "");
}

function ownedRows(data: unknown, ownerColumn: string, userId: string): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  const rows: Record<string, unknown>[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (row[ownerColumn] !== userId) continue;
    const sanitized = sanitizeExportValue(row, userId);
    if (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)) {
      rows.push(sanitized as Record<string, unknown>);
    }
  }
  return rows;
}

function ownedPaths(paths: readonly string[], userId: string): string[] {
  return paths.filter((path) => isOwnedResumeStoragePath(path, userId));
}

export function createSupabaseAccountStore(supabase: SupabaseClient): AccountStore {
  const db = supabase as unknown as AccountDatabase;

  return {
    async selectOwned(table, ownerColumn, userId) {
      assertUserId(userId);
      assertMappedTable(table, ownerColumn, "account_export_failed");
      const rows: Record<string, unknown>[] = [];
      for (let start = 0; start < MAX_ROWS; start += PAGE_SIZE) {
        const { data, error } = await db
          .from(table)
          .select("*")
          .eq(ownerColumn, userId)
          .range(start, start + PAGE_SIZE - 1);
        if (isMissingRelation(error)) return rows;
        if (error) throw new AccountDataError("account_export_failed");
        const page = ownedRows(data, ownerColumn, userId);
        rows.push(...page);
        const received = Array.isArray(data) ? data.length : 0;
        if (received < PAGE_SIZE) return rows;
      }
      throw new AccountDataError("account_export_failed");
    },

    async anonymiseOwned(table, ownerColumn, userId) {
      assertUserId(userId);
      assertMappedTable(table, ownerColumn, "account_delete_failed");
      const spec = accountTable(table);
      if (!spec || spec.deleteStrategy === "delete") {
        throw new AccountDataError("account_delete_failed");
      }
      const { error } = await db.from(table).update({ [ownerColumn]: null }).eq(ownerColumn, userId);
      if (isMissingRelation(error)) return;
      if (error) throw new AccountDataError("account_delete_failed");
    },

    async deleteOwned(table, ownerColumn, userId) {
      assertUserId(userId);
      assertMappedTable(table, ownerColumn, "account_delete_failed");
      const spec = accountTable(table);
      if (!spec || spec.deleteStrategy !== "delete") {
        throw new AccountDataError("account_delete_failed");
      }
      const { error } = await db.from(table).delete().eq(ownerColumn, userId);
      if (isMissingRelation(error)) return;
      if (error) throw new AccountDataError("account_delete_failed");
    },

    async listOwnedObjects(bucket, userId) {
      assertUserId(userId);
      if (!isAccountStorageBucket(bucket)) throw new AccountDataError("account_storage_failed");
      return listBucketFiles(db, bucket, userId);
    },

    async removeOwnedObjects(bucket, userId, paths) {
      assertUserId(userId);
      if (!isAccountStorageBucket(bucket)) throw new AccountDataError("account_storage_failed");
      const safe = ownedPaths(paths, userId);
      for (let index = 0; index < safe.length; index += STORAGE_PAGE) {
        const batch = safe.slice(index, index + STORAGE_PAGE);
        const { error } = await db.storage.from(bucket).remove(batch);
        if (error && !isMissingStorage(error)) throw new AccountDataError("account_storage_failed");
      }
    },

    async getAuthAccount(userId) {
      assertUserId(userId);
      const { data, error } = await db.auth.admin.getUserById(userId);
      if (error || !data.user || data.user.id !== userId) return null;
      return {
        id: data.user.id,
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        createdAt: data.user.created_at ?? null,
      };
    },

    async deleteAuthUser(userId) {
      assertUserId(userId);
      const { error } = await db.auth.admin.deleteUser(userId);
      if (error && !isMissingAuthUser(error)) throw new AccountDataError("account_auth_delete_failed");
    },
  };
}

async function listBucketFiles(db: AccountDatabase, bucket: string, userId: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(prefix: string, depth: number): Promise<void> {
    if (depth > 6) throw new AccountDataError("account_storage_failed");
    let offset = 0;
    for (;;) {
      const { data, error } = await db.storage.from(bucket).list(prefix, { limit: STORAGE_PAGE, offset });
      if (isMissingStorage(error)) return;
      if (error) throw new AccountDataError("account_storage_failed");
      const entries = data ?? [];
      for (const entry of entries) {
        const name = entry.name ?? "";
        if (!name || name === "." || name === "..") continue;
        const path = `${prefix}/${name}`;
        if (!isOwnedResumeStoragePath(path, userId)) continue;
        if (entry.id == null) {
          await walk(path, depth + 1);
        } else {
          files.push(path);
        }
        if (files.length > 2000) throw new AccountDataError("account_storage_failed");
      }
      if (entries.length < STORAGE_PAGE) return;
      offset += STORAGE_PAGE;
      if (offset > 5000) throw new AccountDataError("account_storage_failed");
    }
  }

  await walk(userId, 0);
  return files;
}
