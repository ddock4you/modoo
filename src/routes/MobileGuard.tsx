import { useMemo, type ReactNode } from "react";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();
  const isUaMobile = /(iphone|ipad|ipod|android|mobile)/.test(ua);
  const prefersCoarse = window.matchMedia("(pointer: coarse)").matches;
  const maxWidthOK = window.matchMedia("(max-width: 1024px)").matches;

  let score = 0;
  if (isUaMobile) score += 1;
  if (prefersCoarse) score += 1;
  if (maxWidthOK) score += 1;
  return score >= 2;
}

export function MobileGuard({ children }: { children: ReactNode }) {
  const allowDevBypass = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("dev") === "1";
  }, []);

  const allowed = allowDevBypass || isMobileDevice();

  if (!allowed) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-6">
        <div className="mx-auto max-w-sm text-center">
          <h1 className="text-xl font-semibold mb-3">모바일 전용 앱</h1>
          <p className="text-sm text-neutral-600 mb-4">
            이 앱은 모바일 환경에서만 접근할 수 있습니다. 개발 중에는 URL에
            <span className="mx-1 rounded-[var(--radius)] bg-neutral-100 px-2 py-0.5 font-mono">
              ?dev=1
            </span>
            를 붙여 임시로 우회할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
