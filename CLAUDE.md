# Modoo (모두의 숲)

모바일 우선 오프라인 우선 식물 관리 PWA. React + Vite + TypeScript + Tailwind CSS.

## 명령어

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm test` — Vitest 단위/통합 테스트
- `pnpm test:run` — CI용 테스트 (watch 없음)
- `pnpm test:ui` — Vitest 웹 UI

## 기술 스택

React 19, React Router 7, Vite 7, TailwindCSS 4, TanStack Query 5, React Hook Form + Zod, IndexedDB(idb), Vitest, Playwright, Recharts, Lucide React, vite-plugin-pwa

## 아키텍처 규칙

### 의존성 방향 (단방향, 역참조 금지)

```
src/domain → src/lib → src/features → src/routes/pages
```

- `src/domain/*` — 순수 타입/유스케이스. React/브라우저/스토리지 의존 금지.
- `src/lib/*` — 공유 인프라(IndexedDB, Query, Media, Weather 등). `src/features/*` import 금지.
- `src/features/*` — 기능 단위 캡슐화(components/hooks/api/model/types/utils). **feature 간 상호 import 금지.**
- `src/routes/pages/*` — 페이지 오케스트레이션. feature 조합 및 데이터 로딩.
- `src/components/*` — 앱 공통 UI. props 기반 렌더링. `src/features/*` import 금지.
- `src/components/ui/*` — 저수준 UI primitives (shadcn/radix). 도메인 지식 없음.

### lib vs features 구분

- 외부 API, IndexedDB, 캐시/TTL, 브라우저 API 직접 → `src/lib/*`
- 사용자 플로우, 특정 화면 전용 상태/검증, UI 컴포넌트 → `src/features/*`

### 파일 분리 기준

- 150줄 초과 시 시각적으로 독립된 섹션 단위로 분리
- props가 많으면 객체 props로 묶어 의미 단위를 드러냄

## 폴더 구조

```
src/
├── domain/          순수 도메인 타입/유스케이스
│   ├── types.ts     Plant/TaskRule/TaskEvent/PhotoMeta/PlantStatus 등
│   └── plants/use-cases/  calculateNextDue, calculatePlantStatus
├── lib/
│   ├── storage/     IndexedDB Repository + Provider + migrations
│   ├── media/       IndexedDB Blob 미디어 저장소
│   ├── weather/     KMA/AirKorea/VWorld + IndexedDB 캐시 + Provider
│   ├── query/       TanStack Query 클라이언트 + 공유 Query Keys
│   ├── plants/      전역 Wizard 상태 (Provider/hook)
│   ├── backup/      백업/복원 엔진
│   └── utils/       공용 유틸 (id 생성 등)
├── features/
│   ├── plants/       식물 목록/상세/필터/상태
│   ├── weather/      날씨 UI/차트/위젯
│   ├── add-plant-wizard/  3단계 식물 추가 모달
│   ├── backup/       백업/복원 UI
│   ├── media/        미디어 관련 UI
│   └── debug/        개발 디버그 도구
├── routes/pages/    페이지 컨테이너 (Dashboard, Plants, Weather, Settings 등)
├── components/      앱 공통 UI (Header, Footer, Navigation, dashboard-visual)
└── components/ui/   저수준 UI primitives
```

## 도메인 데이터 (단일 기준)

- 도메인 타입: `src/domain/types.ts`
- IndexedDB 스키마: `src/lib/storage/schema.ts`
- 마이그레이션: `src/lib/storage/migrations.ts`
- DB 초기화: `src/lib/storage/db.ts`
- Repository 인터페이스: `src/lib/storage/StorageRepository.ts`
- Repository 구현: `src/lib/storage/IndexedDbRepository.ts`

스키마에 없는 필드: Plant의 `species`/`location`/`tags`, TaskRule/Event의 `fertilize` 등 다른 작업 타입

## Query Key 규칙

- **문자열 배열을 사용처에서 직접 만들지 않는다.** 반드시 factory를 사용.
- Plants: `PLANTS_QK` (`src/lib/query/plantsQueryKeys.ts`)
- Weather: `WEATHER_QK` (`src/lib/weather/queryKeys.ts`)
- Debug: `DEBUG_QK` (`src/features/debug/api/queryKeys.ts`)
- factory는 항상 `as const` 반환
- invalidate는 prefix 기반 설계 (`PLANTS_QK.all()`, `PLANTS_QK.list()` 등)
- 가능하면 query options 패턴 사용 (queryKey + queryFn 동일 파일에 정의)

## 커밋 메시지 규칙

- 타입: `feat`/`fix`/`refactor`/`chore`/`docs`/`test`
- "무엇"보다 "왜" 중심, 1~2문장
- 영문 + 한글 메시지를 함께 작성:

```
<type>: <English message>
<type>: <Korean message>
```

## 테스트 배치

- Unit (순수 로직): `src/domain/**/**.test.ts`
- Integration (인프라/캐시): `src/lib/**/**.test.ts(x)`
- UI (Component): `src/features/*/components/**/*.test.tsx`
- E2E: `e2e/*`
- 테스트 파일은 같은 폴더에 `*.test.ts(x)` 패턴으로 배치

## 개발 의사결정

1. **모바일 전용**: 모바일 가드로 비모바일 차단. DEV/`?dev=1`만 우회
2. **데이터 저장**: 핵심 도메인 → IndexedDB(idb), 미디어 → IndexedDB Blob, 설정 → localStorage
3. **ORM 미사용**: Repository 패턴 + IndexedDB 버전업 마이그레이션
4. **사진**: 자동 압축 (WebP, max 2MB, 85%), 썸네일 자동 생성 (512px, JPEG)
5. **PWA**: vite-plugin-pwa로 오프라인 프리캐시. 정확한 알림은 하이브리드 단계
6. **날씨**: KMA(기상청) + AirKorea(대기질) + VWorld(역지오코딩). IndexedDB 캐시 + SWR
7. **하이브리드 확장**: Capacitor + 네이티브 SQLite/카메라/알림 (후속)
8. **타입**: `any` 사용 금지. 코드베이스 내 정의된 타입 활용, 없으면 새로 정의

## 환경 변수

- `VITE_KMA_SERVICE_KEY` — 기상청 API 키
- `VITE_AIRKOREA_SERVICE_KEY` — 에어코리아 API 키
- `VITE_VWORLD_API_KEY` — VWorld 역지오코딩 API 키

## Known Gaps

### 식물 추가 Wizard
- 오류 표시가 `alert()` 기반. 인라인 에러 UI로 개선 여지 있음.

### 날씨
- `weather_daily` retention이 locationId 기준 "엔트리 N개"만 남기는 방식이라, mid(4~7일) 캐시가 먼저 제거되어 7일 예보 조합이 불안정해질 수 있음.
  - 코드: `src/lib/weather/indexeddb/retention.ts`
  - 개선 방향: store/type별 retention 정책 분리

## Provider 조립 순서 (src/App.tsx)

QueryProvider → StorageProvider → MediaProvider → WeatherProvider → MobileGuard → AddPlantWizardProvider
