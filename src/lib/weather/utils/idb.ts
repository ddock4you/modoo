export function idbUpperBound(value: IDBValidKey): IDBKeyRange | null {
  if (typeof IDBKeyRange === "undefined") return null;
  return IDBKeyRange.upperBound(value);
}

export function idbOnly(value: IDBValidKey): IDBKeyRange | null {
  if (typeof IDBKeyRange === "undefined") return null;
  return IDBKeyRange.only(value);
}
