export class BillingError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "BillingError";
    this.status = status;
    this.code = code;
  }
}

export function isBillingError(error: unknown): error is BillingError {
  return error instanceof BillingError;
}
