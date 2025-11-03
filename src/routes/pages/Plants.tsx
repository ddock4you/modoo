import { Link } from "react-router-dom";

export function Plants() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Plants</h1>
        <button className="rounded-[var(--radius)] bg-brand text-[--color-brand-foreground] px-3 py-2 text-sm">
          새 식물 추가
        </button>
      </div>
      <div className="text-sm text-neutral-600">샘플 링크:</div>
      <ul className="list-disc pl-5">
        <li>
          <Link className="text-brand" to="/plants/sample-id">
            Sample Plant
          </Link>
        </li>
      </ul>
    </div>
  );
}
