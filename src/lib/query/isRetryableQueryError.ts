type StatusCarrier = {
  status?: unknown;
  response?: { status?: unknown };
  cause?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractStatus(error: unknown): number | null {
  if (!isObject(error)) return null;

  const carrier = error as StatusCarrier;
  const direct = asNumber(carrier.status);
  if (direct !== null) return direct;

  if (isObject(carrier.response)) {
    const nested = asNumber((carrier.response as { status?: unknown }).status);
    if (nested !== null) return nested;
  }

  // Some libraries wrap the original error in `cause`
  if (carrier.cause !== undefined) {
    return extractStatus(carrier.cause);
  }

  return null;
}

function extractNameMessage(error: unknown): { name: string | null; message: string | null } {
  if (error instanceof Error) {
    return { name: error.name || null, message: error.message || null };
  }

  if (typeof error === "string") {
    return { name: null, message: error };
  }

  if (isObject(error)) {
    const name = typeof error.name === "string" ? error.name : null;
    const message = typeof error.message === "string" ? error.message : null;
    return { name, message };
  }

  return { name: null, message: null };
}

function extractStatusFromMessage(message: string): number | null {
  // Common patterns:
  // - "... 404 ..."
  // - "VWorld API error: 403 Forbidden"
  const match = message.match(/\b(\d{3})\b/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function isRetryableQueryError(error: unknown): boolean {
  const { name, message } = extractNameMessage(error);
  if (name === "AbortError") return false;

  const status = extractStatus(error) ?? (message ? extractStatusFromMessage(message) : null);

  if (status !== null) {
    // Retry most 5xx and a few commonly-transient 4xx.
    if (status >= 500) return true;
    if (status === 408 || status === 425 || status === 429) return true;
    if (status >= 400 && status < 500) return false;
  }

  // `fetch()` network errors often surface as TypeError in browsers.
  if (error instanceof TypeError) return true;

  // Default: allow retry (bounded by failureCount).
  return true;
}
