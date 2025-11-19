import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { WaterIcon, FertilizerIcon, Plant, TaskIcon } from "../../components/icons";
import type { IconProps } from "../../components/icons";

// DEV 전용 가드 컴포넌트
function DevGuard({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;
  const hasDevParam = searchParams.get("dev") === "1";

  useEffect(() => {
    if (!isDev || !hasDevParam) {
      navigate("/");
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

// 아이콘 정의
interface IconDefinition {
  name: string;
  component: React.ComponentType<IconProps>;
  description: string;
  usage: string;
}

const iconDefinitions: IconDefinition[] = [
  {
    name: "WaterIcon",
    component: WaterIcon,
    description: "물 주기 작업을 나타내는 아이콘",
    usage: "작업 목록, 물 주기 알림 등",
  },
  {
    name: "FertilizerIcon",
    component: FertilizerIcon,
    description: "비료 주기 작업을 나타내는 아이콘",
    usage: "비료 작업, 영양 공급 관련 UI",
  },
  {
    name: "Plant",
    component: Plant,
    description: "식물을 나타내는 일반 아이콘",
    usage: "식물 목록, 식물 관련 UI",
  },
  {
    name: "TaskIcon",
    component: TaskIcon,
    description: "작업/할일을 나타내는 아이콘",
    usage: "할일 목록, 작업 상태 표시",
  },
];

// 색상 팔레트
const colorVariants = [
  { name: "기본", className: "text-current" },
  { name: "초록", className: "text-green-600" },
  { name: "파랑", className: "text-blue-600" },
  { name: "노랑", className: "text-yellow-600" },
  { name: "빨강", className: "text-red-600" },
  { name: "회색", className: "text-gray-600" },
];

// 크기 변형
const sizeVariants = [16, 20, 24, 32, 48];

export function IconGallery() {
  return (
    <DevGuard>
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-green-600 mb-2">🎨 아이콘 갤러리</h1>
          <p className="text-sm text-gray-600">
            식물 관리 앱의 아이콘 컴포넌트들을 미리보기합니다. 개발 모드에서만 접근할 수 있습니다.
          </p>
        </div>

        {/* 아이콘 개요 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">아이콘 개요</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {iconDefinitions.map((iconDef) => {
              const IconComponent = iconDef.component;
              return (
                <div key={iconDef.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-3">
                    <IconComponent size={48} className="text-green-600" />
                  </div>
                  <h3 className="font-medium text-center mb-2">{iconDef.name}</h3>
                  <p className="text-xs text-gray-600 text-center">{iconDef.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 크기별 미리보기 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">크기별 미리보기</h2>
          <div className="space-y-6">
            {iconDefinitions.map((iconDef) => {
              const IconComponent = iconDef.component;
              return (
                <div key={`size-${iconDef.name}`} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{iconDef.name}</h3>
                  <div className="flex items-end gap-4">
                    {sizeVariants.map((size) => (
                      <div key={size} className="flex flex-col items-center">
                        <IconComponent size={size} className="text-green-600 mb-2" />
                        <span className="text-xs text-gray-500">{size}px</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 색상별 미리보기 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">색상별 미리보기</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {iconDefinitions.map((iconDef) => {
              const IconComponent = iconDef.component;
              return (
                <div key={`color-${iconDef.name}`} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{iconDef.name}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {colorVariants.map((color) => (
                      <div key={color.name} className="flex flex-col items-center">
                        <IconComponent size={32} className={`${color.className} mb-2`} />
                        <span className="text-xs text-gray-500">{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 사용법 가이드 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">사용법</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">기본 사용법</h3>
              <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
                {`import { WaterIcon } from '../components/icons';

<WaterIcon size={24} className="text-green-600" />`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Props</h3>
              <ul className="text-sm space-y-1">
                <li>
                  <code>size?: number</code> - 아이콘 크기 (기본값: 24px)
                </li>
                <li>
                  <code>className?: string</code> - 추가 CSS 클래스
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">모든 아이콘 import</h3>
              <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
                {`import {
  WaterIcon,
  FertilizerIcon,
  Plant,
  TaskIcon
} from '../components/icons';`}
              </pre>
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ 개발용 페이지</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 이 페이지는 개발 모드에서만 접근할 수 있습니다</li>
            <li>• 아이콘 디자인은 변경될 수 있습니다</li>
            <li>• 새로운 아이콘이 추가되면 자동으로 갤러리에 반영됩니다</li>
          </ul>
        </div>
      </div>
    </DevGuard>
  );
}
