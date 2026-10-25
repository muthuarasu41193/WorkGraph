export type AccountErrorCode =
  | "account_export_failed"
  | "account_delete_failed"
  | "account_storage_failed"
  | "account_auth_delete_failed"
  | "account_unconfigured";

/** Message is the stable code. Upstream text is never copied onto the error. */
export class AccountDataError extends Error {
  readonly code: AccountErrorCode;

  constructor(code: AccountErrorCode) {
    super(code);
    this.name = "AccountDataError";
    this.code = code;
  }
}
