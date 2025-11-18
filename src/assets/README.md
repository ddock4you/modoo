# Assets 폴더 구조

식물 관리 앱의 정적 에셋들을 체계적으로 관리하기 위한 폴더 구조입니다.

## 폴더 구조

### `icons/`

SVG 아이콘 파일들입니다. 컴포넌트에서 직접 import하여 사용하거나, 아이콘 컴포넌트에서 참조할 수 있습니다.

- `water.svg` - 물 주기 아이콘
- `fertilizer.svg` - 비료 아이콘
- `plant.svg` - 식물 아이콘
- `task.svg` - 작업/할일 아이콘

### `images/`

일반 정적 이미지 파일들입니다. PNG, JPG 등의 래스터 이미지를 저장합니다.

### `illustrations/`

큰 일러스트레이션이나 배경 이미지들입니다. 주로 교육용이나 데코레이션용으로 사용됩니다.

## 사용 방법

### React 컴포넌트에서 SVG 아이콘 사용

```tsx
import { ReactComponent as WaterIcon } from "../assets/icons/water.svg";

export const MyComponent = () => <WaterIcon className="w-6 h-6 text-blue-500" />;
```

### 컴포넌트화된 아이콘 사용 (권장)

```tsx
import { WaterIcon } from "../components/icons";

export const MyComponent = () => <WaterIcon className="w-6 h-6 text-blue-500" />;
```

### 일반 이미지 사용

```tsx
import plantImage from "../assets/images/plant.jpg";

export const MyComponent = () => <img src={plantImage} alt="Plant" />;
```
