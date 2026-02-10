export function defaultIsOnline(): boolean {
  try {
    if (typeof navigator === "undefined") return true;
    // navigator.onLine can be undefined in some environments; treat as online.
    return navigator.onLine !== false;
  } catch {
    return true;
  }
}
