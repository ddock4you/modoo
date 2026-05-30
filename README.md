# 모두의 숲 (Modoo)

> 오프라인 우선 식물 관리 PWA MVP

Vite + React 기반으로 백엔드 없이 식물 데이터·사진·날씨 캐시를 클라이언트에 저장하고, Service Worker · TanStack Query · IndexedDB SWR을 조합해 네트워크가 불안정한 환경에서도 사용할 수 있는 식물 관리 PWA 구조를 검증한 프로젝트입니다.

> 현재 상태: **MVP 개발 중 / 핵심 아키텍처 검증 완료**  
> 식물 관리 경험의 핵심 사용자 플로우와 제품 기획 범위를 재정의하기 위해 기능 확장은 잠시 보류 중입니다.

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?logo=reactquery)](https://tanstack.com/query)
[![PWA](https://img.shields.io/badge/PWA-Offline%20First-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Vitest](https://img.shields.io/badge/Vitest-Test-6E9F18?logo=vitest)](https://vitest.dev)

---

## 링크

- **Live Demo**: 아직 없음

### 추천 확인 흐름

1. 식물 목록에서 등록된 식물 상태 확인
2. 식물 상세에서 물주기 주기와 최근 관리 이력 확인
3. 식물 추가 위저드에서 기본 정보 → 물 준 날짜 → 사진 등록 흐름 확인
4. 날씨 화면에서 현재·시간별·주간 예보와 대기질 정보 확인
5. 네트워크 비활성 상태에서 마지막 캐시 데이터가 유지되는지 확인
6. 백업/복원 화면에서 IndexedDB 데이터와 사진 Blob export/import 흐름 확인

---

## 프로젝트 핵심 요약

| 구분            | 내용                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| 목적            | 통신이 불안정한 야외·베란다·정원 환경에서도 사용할 수 있는 오프라인 우선 식물 관리 PWA 구조 검증            |
| 현재 상태       | MVP 개발 중 / 핵심 아키텍처 검증 완료 / 제품 기획 범위 재정의로 기능 확장 보류                              |
| 핵심 설계       | 백엔드 없는 IndexedDB 저장소, 사진 Blob 분리 저장, Service Worker · TanStack Query · IndexedDB SWR 3중 캐싱 |
| 주요 기능       | 식물 목록·상세, 물주기 일정, 3단계 식물 추가 위저드, 날씨·대기질, 백업·복원                                 |
| 프론트엔드 구조 | React 19, TypeScript strict, Vite 7, 5계층 단방향 아키텍처, Repository 패턴                                 |
| 확장 방향       | React-Native 기반 하이브리드 앱 전환 시 infrastructure 구현체 교체를 고려한 구조                            |

---

## 주요 성과

- **오프라인 우선 PWA 구조 설계**  
  Service Worker, TanStack Query, IndexedDB SWR을 역할별로 분리했습니다. 네트워크가 불안정하거나 오프라인 상태여도 마지막 식물·날씨 데이터를 유지할 수 있는 구조를 설계했습니다.

- **백엔드 없는 클라이언트 저장소 구현**  
  식물 데이터, 물주기 이력, 날씨 캐시를 IndexedDB에 저장하고, 사진 원본·썸네일은 Blob Store에 분리 저장했습니다. 메타데이터 조회와 이미지 로딩 비용을 분리해 모바일 환경의 성능 부담을 줄였습니다.

- **날씨·대기질 API 통합 구조 설계**  
  KMA 기상청, AirKorea 대기질, VWorld 역지오코딩 API를 연동했습니다. WGS84 ↔ UTMK ↔ KMA 격자 좌표 변환을 유틸로 분리해 외부 API 요구사항을 앱 도메인에 맞게 정규화했습니다.

- **모바일 이미지 처리 파이프라인 구현**  
  사진 업로드 시 WebP 변환, 최대 크기 제한, EXIF 제거, Web Worker 기반 비동기 압축, 512px 썸네일 생성을 적용했습니다. 일부 사진 처리 실패 시에도 식물 등록 흐름이 중단되지 않도록 부분 실패 허용 정책을 설계했습니다.

- **교체 가능한 레이어드 아키텍처 적용**  
  domain, infrastructure, lib, providers, features, routes/pages 계층을 분리했습니다. UI와 도메인 로직이 IndexedDB 구현 세부사항에 직접 의존하지 않도록 설계해, 향후 SQLite나 Native API 구현체로 교체 가능한 구조를 만들었습니다.

- **테스트 가능한 경계 확보**  
  순수 도메인 로직, IndexedDB 저장소, 외부 API 클라이언트, Provider, UI 컴포넌트, E2E를 계층별로 나눠 Vitest, React Testing Library, fake-indexeddb, Playwright 기반 테스트 전략을 구성했습니다.

---

## 프로젝트 배경

식물 관리 앱은 사진, 물주기 이력, 날씨 정보처럼 사용자의 관리 흐름과 연결되는 데이터가 많기 때문에 단순한 화면 CRUD보다 저장소와 오프라인 UX 설계가 중요하다고 판단했습니다.

이 프로젝트는 다음 문제를 검증하기 위해 시작했습니다.

- 백엔드 없이 브라우저 저장소만으로 식물 관리 앱의 핵심 흐름을 구성할 수 있는가
- 네트워크가 끊겨도 마지막 날씨·식물 데이터를 자연스럽게 보여줄 수 있는가
- 모바일 사진 업로드 환경에서 이미지 용량, EXIF, 썸네일 문제를 프론트엔드에서 처리할 수 있는가
- 향후 하이브리드 앱으로 전환할 때 UI와 도메인 로직을 최대한 유지할 수 있는가

현재는 기술 구조의 핵심 검증을 마친 상태이며, 식물 관리 경험의 주요 사용자 플로우와 기능 범위를 다시 정의하기 위해 기능 확장을 보류하고 있습니다.

---

## 주요 기능

### 식물 목록과 상태 관리

물주기 주기와 마지막 관수일을 기준으로 식물별 상태를 계산합니다. 상태 계산은 UI와 분리된 도메인 로직으로 구성해 테스트 가능성을 확보했습니다.

- 양호 / 주의 / 위험 상태 계산
- 식물 목록, 필터, 페이지네이션 구조
- 다음 물주기 일정 계산

### 물주기 일정

다가오는 물주기 대상과 지난 물주기 이력을 타임라인 형태로 보여주는 구조를 설계했습니다. Query Key factory를 사용해 식물 데이터 변경 후 관련 쿼리를 일관되게 무효화할 수 있도록 했습니다.

### 날씨 · 대기질

현재 날씨, 시간별 예보, 주간 예보, 미세먼지·오존 등 식물 관리에 참고할 수 있는 외부 환경 정보를 표시합니다.

- KMA 단기·중기 예보 연동
- AirKorea 대기질 연동
- VWorld 역지오코딩 연동
- 오프라인 또는 요청 실패 시 마지막 캐시 데이터로 graceful degrade

### 3단계 식물 추가 위저드

식물 등록 과정을 3단계로 나눠 사용자의 입력 부담을 줄이는 구조를 설계했습니다.

1. 기본 정보 입력
2. 마지막으로 물 준 날짜 선택
3. 사진 업로드 및 대표 사진 지정

사진 업로드 과정에서는 모바일 환경을 고려해 압축, 메타데이터 제거, 썸네일 생성을 처리합니다.

### 백업 / 복원

백엔드가 없는 구조의 한계를 보완하기 위해 IndexedDB 도메인 데이터와 사진 Blob을 ZIP으로 내보내고 복원할 수 있는 구조를 설계했습니다.

- 도메인 데이터 export
- 사진 Blob export
- Zod 스키마 기반 복원 데이터 검증
- 복원 시 썸네일 재생성

---

## 기술 스택

### Frontend

- **React 19**: 클라이언트 중심 UI 구성
- **TypeScript strict mode**: 도메인 타입과 저장소 인터페이스 모델링
- **Vite 7**: 빠른 개발 서버와 PWA 빌드 환경
- **TanStack Query v5**: 세션 캐시, refetch 정책, query invalidation 관리
- **React Hook Form + Zod**: 식물 추가 위저드 폼 상태와 유효성 검증
- **shadcn/ui · Radix UI**: 모바일 UI 컴포넌트와 접근성 기반 primitives

### Storage / Offline

- **IndexedDB**: 식물 데이터, 물주기 이력, 날씨 캐시 저장
- **Blob Store**: 사진 원본과 썸네일 분리 저장
- **Service Worker**: 앱 셸과 외부 API 응답 런타임 캐시
- **vite-plugin-pwa / Workbox**: PWA 설정과 runtime caching 전략 구성

### External API

- **KMA 기상청 API**: 초단기·단기·중기 예보
- **AirKorea API**: 미세먼지, 초미세먼지, 오존 등 대기질 정보
- **VWorld API**: 위경도 기반 역지오코딩
- **proj4**: WGS84, UTMK, KMA 격자 좌표 변환

### Quality / Tooling

- **Vitest**: 도메인, lib, infrastructure 단위 테스트
- **React Testing Library**: Provider와 UI 컴포넌트 테스트
- **fake-indexeddb**: IndexedDB 저장소 테스트 격리
- **Playwright**: 주요 사용자 흐름 E2E 테스트
- **ESLint**: 코드 품질 규칙 적용

---

## 아키텍처 하이라이트

### 1. 오프라인 우선 3중 캐싱 구조

**문제**  
식물 관리는 야외나 이동 중에도 확인할 수 있어야 하고, 날씨·대기질 정보는 네트워크 실패 가능성이 높습니다. 단순 fetch 기반 구조만으로는 오프라인 UX를 보장하기 어렵습니다.

**접근**  
캐싱 계층을 세 가지로 분리했습니다.

| 계층                         | 책임                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| Service Worker runtime cache | 네트워크 응답 단위 캐싱, 앱 셸 유지                        |
| TanStack Query               | 세션 내 메모리 캐시, refetch, stale 정책 관리              |
| IndexedDB SWR                | 앱 레벨 영속 캐시, exact/latest 폴백, 오프라인 데이터 제공 |

**결과**  
온라인에서는 최신 데이터를 가져오고, 오프라인이거나 요청이 실패하면 IndexedDB에 저장된 최신 데이터를 반환하는 graceful degrade 흐름을 만들었습니다.

---

### 2. IndexedDB Repository 패턴

**문제**  
백엔드 없이 식물 데이터, 물주기 이력, 사진 메타데이터, 날씨 캐시를 모두 브라우저에 저장해야 했습니다. 동시에 향후 하이브리드 앱 전환 시 저장소 구현을 교체할 가능성도 고려해야 했습니다.

**접근**  
`lib/storage`에는 저장소 인터페이스만 두고, `infrastructure/storage`에 IndexedDB 구현체를 분리했습니다. Provider가 인터페이스와 구현체를 연결하고, feature는 Provider hook을 통해서만 저장소에 접근하도록 구성했습니다.

**결과**  
UI와 도메인 로직은 IndexedDB 구현 세부사항을 알 필요가 없습니다. 저장소를 SQLite나 네이티브 저장소로 교체하더라도 변경 범위를 infrastructure 계층으로 제한할 수 있습니다.

---

### 3. 사진 메타데이터와 Blob 분리 저장

**문제**  
사진을 식물 데이터와 같은 store에 저장하면 목록 조회나 메타데이터 조회 때마다 무거운 Blob까지 함께 로드될 수 있습니다. 모바일 환경에서는 이 비용이 UI 지연으로 이어질 수 있습니다.

**접근**  
사진 데이터를 `photos`와 `photos_blobs` 두 store로 분리했습니다.

| Store          | 역할                                              |
| -------------- | ------------------------------------------------- |
| `photos`       | 사진 ID, 식물 ID, 대표 여부, 생성일 등 메타데이터 |
| `photos_blobs` | 원본 이미지 Blob, 썸네일 Blob                     |

목록과 상세 화면에서는 먼저 가벼운 메타데이터를 조회하고, 실제 렌더링 시점에만 Blob을 로드해 `URL.createObjectURL`로 표시합니다.

**결과**  
메타데이터 조회와 이미지 로딩 비용을 분리해 모바일 환경에서 불필요한 Blob 로드를 줄였습니다.

---

### 4. 공공 API 기반 날씨·대기질 모듈

**문제**  
기상청과 대기질 API는 일반적인 위경도만으로 바로 조회하기 어렵고, API별 좌표계와 응답 형식이 다릅니다. 또한 날씨 데이터는 최신성이 중요하지만 통신 실패에 취약합니다.

**접근**  
KMA, AirKorea, VWorld 클라이언트를 infrastructure 계층에 분리하고, 좌표 변환과 응답 정규화 로직을 lib 계층의 유틸로 분리했습니다. 날씨 데이터는 현재, 시간별, 일별, 대기질, 역지오코딩 캐시 store를 나눠 저장했습니다.

**결과**  
외부 API별 차이를 앱 내부 도메인 모델 뒤로 숨기고, 화면에서는 정규화된 날씨·대기질 데이터를 사용할 수 있도록 구성했습니다. 요청 실패 시에도 최신 캐시로 폴백할 수 있습니다.

---

### 5. 식물 추가 위저드와 이미지 파이프라인

**문제**  
모바일에서 식물을 등록할 때 사진 용량, EXIF 메타데이터, 썸네일 생성, 업로드 실패 가능성을 고려해야 했습니다. 한 장의 사진 처리 실패로 전체 등록 흐름이 중단되면 사용자 경험이 나빠질 수 있습니다.

**접근**  
식물 추가를 기본 정보, 물 준 날짜, 사진 업로드 3단계로 분리했습니다. 사진은 Web Worker에서 WebP로 변환하고, 최장 변 1920px 제한, 2MB 이하 압축, EXIF 제거, 512px 썸네일 생성을 적용했습니다.

**결과**  
사진 처리 비용을 UI 스레드에서 분리하고, 모바일 환경에서도 등록 흐름이 중단되지 않도록 일부 사진 실패를 허용하는 구조를 만들었습니다.

---

### 6. 5계층 단방향 아키텍처

**문제**  
1인 개발 프로젝트라도 기능이 늘어나면 화면, 저장소, 외부 API, 도메인 로직이 쉽게 얽힙니다. 특히 향후 React-Native 전환을 고려하면 UI와 브라우저 구현체의 결합을 줄여야 했습니다.

**접근**  
다음 계층으로 역할을 분리했습니다.

```txt
src/
├── domain/          # 순수 도메인 타입과 유스케이스
├── infrastructure/  # IndexedDB, HTTP, 외부 API 등 구현체
├── lib/             # 인터페이스와 순수 로직
├── providers/       # React Provider / Context / hooks
├── features/        # 기능 단위 UI와 hooks
└── routes/pages/    # 페이지 컨테이너
```

feature는 infrastructure를 직접 import하지 않고, Provider hook을 통해서만 저장소와 외부 API 기능에 접근합니다.

**결과**  
화면과 도메인 로직의 영향 범위를 줄이고, 저장소 구현체 교체 가능성을 확보했습니다.

---

## 구현·검증 범위

### 구현·검증 완료

- 식물 목록 및 상세 화면 구조
- 물주기 주기 기반 식물 상태 계산
- 3단계 식물 추가 위저드 구조
- 사진 업로드, 압축, 썸네일 생성
- IndexedDB 기반 도메인 데이터 저장
- 사진 메타데이터와 Blob 분리 저장
- 날씨·대기질 API 연동 구조
- 오프라인 폴백을 위한 날씨 캐싱 구조
- 압축(zip) 기반 백업 / 복원 구조
- 주요 도메인 로직 및 인프라 테스트

### 보류 중인 영역

- 식물 관리 경험의 핵심 사용자 플로우 재정의
- 일괄 물주기 액션
- 사용자별 관리 루틴 UX 개선
- 인라인 에러 UI 정리
- 일부 페이지의 데이터 워터폴 렌더링 개선
- 배포 데모 구성

---

## 오프라인 데이터 흐름

### 날씨 데이터 SWR 폴백

```txt
exact 캐시 확인
  └─ stale 아님 → 즉시 반환
  └─ stale 또는 없음
       ↓
   오프라인? → latest 캐시 반환 또는 null
       ↓
   온라인 → 위치 확인 → fetch → cache set → 반환
       └─ 실패 → latest 캐시로 graceful degrade
```

### 주요 IndexedDB store

| Store                     | 보관 데이터               |
| ------------------------- | ------------------------- |
| `plants`                  | 식물 기본 정보            |
| `watering_tasks`          | 물주기 일정과 상태        |
| `photos`                  | 사진 메타데이터           |
| `photos_blobs`            | 원본 이미지와 썸네일 Blob |
| `weather_now`             | 현재 날씨                 |
| `weather_hourly`          | 24시간 예보               |
| `weather_daily`           | 단기·중기 예보            |
| `air_quality`             | 대기질                    |
| `weather_geocoding_cache` | 역지오코딩 결과           |

---

## 프론트엔드 구조

단순 폴더 분리가 아니라, 저장소와 외부 API 구현체가 화면 코드에 직접 섞이지 않도록 경계를 나누는 데 초점을 맞췄습니다.

```txt
src/
├── domain/              순수 도메인 타입과 유스케이스
│   └── plants/use-cases/  calculateNextDue, calculatePlantStatus
├── infrastructure/      구현체 — IndexedDB / HTTP / 외부 API
│   ├── storage/         schema, migrations, db, IndexedDbRepository
│   ├── media/           압축, 썸네일, IndexedDbMediaStore
│   ├── weather/         KMA, AirKorea, VWorld clients / cache
│   └── backup/          ZIP 아카이브
├── lib/                 인터페이스와 순수 로직
│   ├── storage/         StorageRepository 인터페이스
│   ├── media/           MediaStore 인터페이스
│   ├── weather/         WeatherRepository, swr, utils
│   └── query/           Query Key factory
├── providers/           React Provider / Context / hooks
├── features/            plants, add-plant-wizard, weather, backup, media, debug
└── routes/pages/        페이지 컨테이너
```

### 의존성 규칙

- `domain`은 React, 브라우저 API, 저장소 구현체에 의존하지 않음
- `features`는 `infrastructure`를 직접 import하지 않음
- 저장소와 외부 API 구현은 `infrastructure`에 격리
- 인터페이스와 순수 로직은 `lib`에 배치
- Provider가 interface와 implementation을 조립해 앱에 주입
- feature 간 직접 import를 피하고, 공통 로직은 lib 또는 shared 성격의 위치로 이동

---

## 테스트와 품질 관리

레이어와 부수효과 경계에 따라 테스트를 배치했습니다.

| 레이어         | 위치                                 | 도구                               |
| -------------- | ------------------------------------ | ---------------------------------- |
| Unit           | `src/domain/**/*.test.ts`            | Vitest                             |
| Infrastructure | `src/infrastructure/**/*.test.ts(x)` | Vitest, fake-indexeddb, fetch mock |
| Integration    | `src/lib/**/*.test.ts(x)`            | Vitest                             |
| Provider       | `src/providers/*.test.ts(x)`         | Vitest, React Testing Library      |
| UI             | `src/features/**/*.test.tsx`         | Vitest, React Testing Library      |
| E2E            | `e2e/*`                              | Playwright                         |

외부 의존은 `src/test/setup.ts`에서 fetch, geolocation, permissions를 mock해 테스트 환경을 격리했습니다.

---

## 로컬 개발

### 전제 조건

- Node.js 20 이상
- pnpm
- 공공 API 키
  - KMA 기상청 단기 예보
  - AirKorea 대기질
  - VWorld 지도 API

### 환경 변수

```env
VITE_KMA_SERVICE_KEY=...
VITE_AIRKOREA_SERVICE_KEY=...
VITE_VWORLD_API_KEY=...
```

### 실행 방법

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm build            # 프로덕션 빌드
pnpm preview          # 빌드 결과 미리보기
pnpm lint             # ESLint
pnpm test:run         # Vitest 1회 실행
pnpm test:e2e         # Playwright E2E
```

### 모바일 가드 우회

데스크톱 브라우저에서는 모바일 가드가 진입을 차단합니다. 개발 빌드는 자동 우회되며, 프로덕션 미리보기에서는 쿼리스트링으로 우회할 수 있습니다.

```txt
http://localhost:4173/?dev=1
```

---

## 알려진 한계와 개선 예정

- **완성 서비스가 아닌 MVP 상태**  
  현재는 핵심 아키텍처와 주요 기술 요소를 검증한 상태입니다. 식물 관리 경험의 핵심 사용자 플로우와 제품 기획 범위를 재정의한 뒤 기능 확장을 이어갈 예정입니다.

- **배포 데모 미구성**  
  현재는 로컬 실행 기준으로 확인합니다. 포트폴리오 공개 전 데모 배포 또는 시연용 영상/GIF 보강이 필요합니다.

- **멀티 디바이스 동기화 부재**  
  백엔드 없는 구조이기 때문에 여러 기기 간 데이터 동기화는 제공하지 않습니다. 현재는 백업/복원으로 보완하고, 향후 옵션 클라우드 동기화 또는 하이브리드 앱 저장소 전략을 검토할 수 있습니다.

- **날씨 daily retention 개선 필요**  
  일별 예보 캐시의 retention이 store 전체 엔트리 기준으로 동작해 단기/중기 예보 조합이 일시적으로 비는 경우가 생길 수 있습니다. short/mid type별 retention 분리를 개선 방향으로 잡고 있습니다.

- **일부 UX 정리 필요**  
  일괄 물주기, 인라인 에러 UI, 관리 루틴 UX, 일부 페이지의 데이터 워터폴 렌더링 개선이 남아 있습니다.
