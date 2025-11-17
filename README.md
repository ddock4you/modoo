# 모두 (Modoo) - 식물 관리 모바일 앱

식물을 쉽게 관리할 수 있는 PWA 기반 모바일 앱입니다.

## 🚀 배포하기

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 API 키들을 설정하세요:

```env
# 기상청 단기예보 API 키 (https://www.data.go.kr/)
VITE_KMA_SERVICE_KEY=your-kma-service-key-here

# 에어코리아 대기질 API 키 (https://www.data.go.kr/)
VITE_AIRKOREA_SERVICE_KEY=your-airkorea-service-key-here

# 브이월드 역지오코딩 API 키 (https://www.vworld.kr/)
VITE_VWORLD_API_KEY=your-vworld-api-key-here
```

### 2. 빌드 및 배포

```bash
# 의존성 설치
pnpm install

# 프로덕션 빌드
pnpm build

# 미리보기 (선택사항)
pnpm preview
```

빌드된 파일들은 `dist/` 폴더에 생성됩니다.

### 3. 지원되는 배포 플랫폼

- **Vercel**: 추천 (PWA 최적화)
- **Netlify**: 무료 호스팅
- **Firebase**: Google 서비스 연동
- **GitHub Pages**: 정적 호스팅

## ✨ 주요 기능

- 📱 **모바일 최적화**: 모바일 전용 PWA 앱
- 🌤️ **날씨 정보**: 현재 날씨, 24시간 예보, 7일 예보
- 🗺️ **위치 기반**: GPS를 통한 자동 위치 감지
- 💾 **오프라인 지원**: IndexedDB + Service Worker
- 📊 **대기질 정보**: 미세먼지, 초미세먼지 수치

## 🛠️ 기술 스택

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + Context API
- **Database**: IndexedDB (브라우저 내장)
- **PWA**: Vite PWA Plugin + Workbox
- **Testing**: Vitest + React Testing Library

## 📱 PWA 설치 방법

1. 모바일 브라우저 (Chrome/Safari)에서 앱에 접속
2. 브라우저 메뉴에서 "홈 화면에 추가" 또는 "Add to Home Screen" 선택
3. 앱 아이콘이 홈 화면에 추가됨

## 🔧 개발

```bash
# 개발 서버 실행
pnpm dev

# 테스트 실행
pnpm test

# 빌드
pnpm build
```
