export type RetryOptions = {
  attempts?: number;
  backoffMs?: number;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T> {
  const attempts = Math.max(1, opts?.attempts ?? 3);
  const backoffMs = Math.max(0, opts?.backoffMs ?? 40);
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1 && backoffMs > 0) {
        await wait(backoffMs * 2 ** i);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("retry_exhausted");
}

export function publicErrorCode(error: unknown): string {
  if (!error) return "unknown";
  const message = error instanceof Error ? error.message : String(error);
  if (/fetch|network|econnreset|etimedout|429/i.test(message)) return "transient_failure";
  if (/duplicate|unique/i.test(message)) return "conflict";
  if (/permission|rls|not authenticated/i.test(message)) return "not_authorized";
  return "persist_failed";
}
