import { useEffect, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function DevGuard({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isDev = import.meta.env.DEV;
  const hasDevParam = searchParams.get("dev") === "1";

  useEffect(() => {
    if (!isDev || !hasDevParam) {
      navigate("/", { replace: true });
    }
  }, [isDev, hasDevParam, navigate]);

  if (!isDev || !hasDevParam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 거부</h1>
          <p className="text-gray-600">개발 모드에서만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
