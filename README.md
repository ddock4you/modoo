# Modoo (모두의 숲) - Plant Care Mobile PWA

`modoo`는 식물 관리에 필요한 기록/일정/날씨를 한 곳에서 다루는 모바일 우선 오프라인 웹앱입니다.  
React + Vite + Tailwind 기반으로, IndexedDB 도메인 저장소와 Blob 미디어 저장소를 분리해 백엔드 없이도 동작하도록 설계되었습니다.

## 주요 기능

- 식물 관리: 식물 목록/상세 조회, 상태(양호/주의/위험) 계산, 물주기 주기 관리
- 3단계 식물 추가 Wizard: 기본 정보 -> 물 준 날짜 선택 -> 사진 업로드/대표 사진 지정
- 물주기 일정: 추천 물주기 타임라인과 일자별 대상 식물 확인
- 날씨 모듈: 현재/시간별/주간 날씨 + 대기질 + 위치 라벨(역지오코딩)
- 오프라인 우선: TanStack Query + IndexedDB 캐시(SWR/TTL) + PWA 런타임 캐싱
- 백업/복원: IndexedDB 도메인/사진 데이터를 파일로 백업 및 복원

## 기술 스택

- **React 19 + Vite 7 + TypeScript**: 모바일 웹 앱 기반 프레임워크
- **React Router 7**: 라우팅 및 페이지 구성 (`/`, `/plants`, `/weather`, `/settings`)
- **Tailwind CSS v4 + Radix UI(shadcn 스타일)**: UI 구성
- **TanStack Query v5**: 서버 상태/캐시 무효화/오프라인 친화 쿼리
- **IndexedDB(idb) + Blob Media Store**: 도메인 데이터와 사진 파일 영속화
- **Weather APIs**: KMA + AirKorea + VWorld (좌표 변환: `proj4`)
- **Vitest + Testing Library + Playwright**: 단위/통합/E2E 테스트

## 개발에 사용된 AI 도구

- cursor, opencode

### 사용한 LLM

- GPT-5.3 Codex (10%), GPT-5.1 Codex Mini (50%), Grok Code Fast 1 (40%)

## `.cursor/rules` 문서 역할

아래 문서들은 코드베이스의 설계 원칙/개발 정책을 정의하는 기준 문서입니다.

- `/.cursor/rules/RULES.mdc`: 규칙 인덱스와 문서 맵(읽는 순서, 업데이트 정책)
- `/.cursor/rules/architecture.mdc`: 폴더 구조, 레이어 경계, 의존성 방향, 테스트 배치 원칙
- `/.cursor/rules/DEVELOPMENT_PLAN.mdc`: 프로젝트 전체 목표/결정사항/마일스톤/현행 구현 요약
- `/.cursor/rules/domain_data_list.mdc`: 식물 도메인 데이터 모델(Plant/TaskRule/TaskEvent/Photo 등)
- `/.cursor/rules/plant-add-wizard-plan.mdc`: 식물 추가 Wizard 스펙 vs 현행 구현 vs Known gaps
- `/.cursor/rules/WEATHER_DEVELOPMENT_PLAN.mdc`: 날씨 모듈 스펙/캐시/테스트/Known gaps
- `/.cursor/rules/react-query-keys.mdc`: Query Key factory 및 invalidate 규칙
- `/.cursor/rules/command/post_process.mdc`: 작업 후 문서 반영/커밋 메시지 가이드
- `/.cursor/rules/history/*.mdc`: 단계별 체크리스트 이력 문서

## `.agents/skills` 폴더 소개

에이전트가 필요 시 로드하는 스킬 문서가 포함되어 있습니다.

- `/.agents/skills/vercel-react-best-practices/SKILL.md`: React/Next 성능 최적화 규칙 개요
- `/.agents/skills/vercel-react-best-practices/AGENTS.md`: 워터폴 제거/번들 최적화/렌더링 등 전체 가이드
- `/.agents/skills/vercel-react-best-practices/rules/*.md`: 개별 성능 규칙 모음
- `/.agents/skills/web-design-guidelines/SKILL.md`: 웹 UI/접근성 점검용 가이드

## 로컬 개발

```bash
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 실행 (기본: http://localhost:5173)
pnpm build            # 프로덕션 빌드
pnpm preview          # 빌드 결과 미리보기
pnpm lint             # ESLint
pnpm test             # Vitest (watch)
pnpm test:run         # Vitest (CI)
pnpm test:coverage    # 테스트 커버리지
pnpm test:e2e         # Playwright E2E
```

## 폴더 구조 요약

- `src/routes/`: 라우터 및 페이지 컨테이너 (`AppRouter`, `pages/*`, `MobileGuard`)
- `src/features/`: 기능 단위 모듈 (plants, weather, add-plant-wizard, backup, debug)
- `src/lib/`: 인프라 계층 (storage, media, weather, query, backup)
- `src/domain/`: 순수 도메인 타입/유스케이스
- `src/components/`: 앱 공통 UI 컴포넌트
- `src/components/ui/`: 저수준 UI primitives
- `public/`: PWA 매니페스트/아이콘 및 정적 리소스
- `e2e/`: Playwright E2E 테스트
- `docs/`: 운영/테스트/전환(하이브리드) 관련 문서

## 참고

- 날씨 모듈 단일 기준: `src/lib/weather/*`, `src/features/weather/*`
- 저장소/스키마 단일 기준: `src/lib/storage/schema.ts`, `src/lib/storage/migrations.ts`, `src/lib/storage/db.ts`
- 도메인 타입 단일 기준: `src/domain/types.ts`

## 환경 변수

프로젝트 루트 `.env` 파일에 다음 값을 설정하세요.

```env
VITE_KMA_SERVICE_KEY=your-kma-service-key
VITE_AIRKOREA_SERVICE_KEY=your-airkorea-service-key
VITE_VWORLD_API_KEY=your-vworld-api-key
```

## 이후 작업

- 일괄 물주기 탭 영역 추가
- 일부 페이지에서 워터폴 현상 수정
- indexedDB 구현 코드 세부 구조화화
