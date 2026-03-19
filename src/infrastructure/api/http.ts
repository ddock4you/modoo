export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = init ? await fetch(url, init) : await fetch(url);

  // Some tests mock fetch with partial Response shape.
  const ok = typeof (response as any).ok === "boolean" ? (response as any).ok : true;
  if (!ok) {
    const status = typeof (response as any).status === "number" ? (response as any).status : 0;
    const statusText = typeof (response as any).statusText === "string" ? (response as any).statusText : "";
    throw new HttpError(
      status,
      url,
      `HTTP ${status} ${statusText}`.trimEnd()
    );
  }

  try {
    return (await (response as any).json()) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${url}`);
  }
}
