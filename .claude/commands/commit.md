커밋 후처리 워크플로우를 실행합니다.

## 단계

1. `git status`와 `git diff --staged`로 변경 사항을 확인합니다.
2. 변경 파일 목록을 출력합니다.
3. 커밋 메시지를 아래 형식으로 작성합니다:
   - "무엇"보다 "왜" 중심, 1~2문장
   - 영문과 한글 메시지를 각각 작성

```
<type>: <English message>
<type>: <Korean message>
```

타입: feat/fix/refactor/chore/docs/test

4. 아래 문서 반영 체크리스트를 확인하고 필요한 경우 업데이트합니다:
   - 레이어/폴더 구조 변경 → CLAUDE.md 아키텍처 섹션
   - 도메인/스키마 변경 → CLAUDE.md 도메인 데이터 섹션
   - Query Key 변경 → CLAUDE.md Query Key 규칙 섹션
   - 새 Known Gap 발견 → CLAUDE.md Known Gaps 섹션

5. 사용자 확인 후 커밋을 실행합니다.
