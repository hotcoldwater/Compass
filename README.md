# Compass

**🔗 배포 링크: [https://compass-bsc.pages.dev](https://compass-bsc.pages.dev)** — 로그인 없이도 `로그인 없이 둘러보기`로 바로 사용해 보실 수 있습니다.

내 경험을 체계적으로 축적하고, 하나의 경험을 여러 자소서 스토리로 발전시키는 **경험 아카이브 기반 자소서 코파일럿**입니다.

## 프로젝트 소개

회계법인 여러 곳에 지원하면서, 같은 경험을 매번 다른 문항·문체로 재구성해서 쓰는 과정이 비효율적이라고 느꼈습니다. 경험 자체는 한 번만 잘 기록해두고, 자소서 문항마다 필요한 근거만 골라 쓰면서 AI가 초안을 도와주는 도구가 있으면 좋겠다는 생각으로 기획·개발했습니다.

단순히 "AI야, 자소서 써줘" 프롬프트 한 번으로 끝나는 도구가 아니라, ①사용자가 기록한 사실만 근거로 쓰게 하고(허위·과장 방지), ②AI가 부족한 정보를 스스로 판단해 되묻고, ③완성된 문장이 아니라 흐름(구조) 단계에서 먼저 사용자 선택을 받는 등 — 실제로 자소서를 여러 번 써본 경험을 바탕으로 AI 활용 흐름 자체를 설계하는 데 공을 들였습니다.

## 핵심 기능

### 경험 아카이브
- 경험을 원문 메모로 자유롭게 기록하고, 상황·과제·행동·결과·배운 점·성과 수치·역량·태그·스토리 각도로 구조화
- **AI 분석**: 저장된 원문을 바탕으로 AI가 스스로 판단한 추가 질문을 하나씩 던지는 적응형 문답. 답변·건너뛰기·중단이 자유롭고, 답변을 종합해 원문을 자동으로 더 풍부하게 보강
- 경험·자소서 모두 완전 삭제 가능 (연결된 하위 데이터까지 cascade 삭제)

### 자소서 작성
- `회사와 문항 → 답변 작성` 두 단계로 안내, 회사명·지원 분야·첫 문항만 입력하면 바로 시작
- 문항마다 핵심·보조 경험카드를 연결해 AI 초안의 근거로 활용 (연결/해제해도 이미 작성한 답변은 바뀌지 않음)
- 문항별 기업 정보(인재상·정책·신년사 등) 입력 → 지원동기형 문항의 AI 초안에 구체적 고유명사로 반영
- 글자 수/byte 제한 설정 및 저장

### AI 자소서 초안 — 단계형 설계
1. **답변 흐름 입력**: 이미 작성해둔 답변이 있으면 자동으로 불러와 그대로 발전시키고, 없으면 개요만 적어도 됨
2. **AI의 충분성 판단**: 근거가 부족하면 AI가 스스로 추가 질문을 생성해 되묻고, 답변은 경험카드 원문으로 승격되어 이후에도 재사용
3. **흐름 3안 제안**: 완성된 문장이 아니라 서로 다른 각도의 불릿 포인트 구성안 3개를 먼저 제시 — 사용자가 방향을 고른 뒤에 전체 문장을 생성해 예측 가능성과 통제권을 확보
4. **문체 벤치마킹**: 실제 우수 합격 자소서 사례를 분석해 일반화한 규칙(소제목, 훅-본론-결론 구조, 기업 고유명사 연계, 소프트스킬에도 수치 근거)을 프롬프트에 반영하고, 글자 수·byte 제한의 90%까지 채우도록 자동 보강
5. 해시태그 형식 문항은 자동 감지해 별도 포맷으로 처리

## 기술적 하이라이트

- **사실 기반 AI 생성**: 모든 AI 호출은 사용자가 입력/확인한 사실(원문 메모, 확인된 성과 수치, 문답 내용)만 근거로 삼도록 프롬프트를 설계하고, 응답을 구조화된 JSON으로 강제해 근거·경고·미확인 주장을 분리 검증
- **다단계 AI 파이프라인**: 단일 프롬프트 호출이 아니라 충분성 판단 → 흐름 제안 → 최종 생성 → (부족 시) 자동 보강까지 이어지는 여러 단계의 AI 호출을 설계하고, 각 단계의 실패를 독립적으로 처리
- **실제 사례 기반 프롬프트 튜닝**: 여러 회계법인 합격 자소서를 분석해 공통 구조를 일반화된 규칙으로 추출, 특정 사례를 그대로 베끼지 않으면서도 문체 품질을 끌어올림
- **서버리스 풀스택**: Cloudflare Pages Functions(엣지 서버리스) + Neon PostgreSQL 조합으로 별도 서버 운영 없이 배포, 외래 키 cascade로 삭제 시 연관 데이터 정합성 보장
- **점진적 온보딩**: 로그인 없이도 기능을 둘러볼 수 있는 게스트 모드와 최초 방문 로그인 게이트를 함께 설계해 가입 장벽을 낮춤

## 기술 스택

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Pages Functions (서버리스), Auth.js (Google OAuth)
- **DB**: Neon (PostgreSQL)
- **AI**: OpenAI 호환 Chat Completions API (GPT-5 계열)

## 아키텍처 개요

```
React(Vite) SPA
   └─ fetch → Cloudflare Pages Functions (/api/*)
                 ├─ Auth.js: Google OAuth, DB 세션
                 ├─ 경험카드 / 자소서 CRUD → Neon PostgreSQL
                 └─ AI 파이프라인 → OpenAI 호환 API
                       (충분성 판단 → 흐름 제안 → 초안 생성 → 자동 보강)
```

## 로컬 실행

```bash
npm install
npm run dev          # 화면만 빠르게 확인 (Vite, 로그인/DB 없음)
```

로그인·DB·AI까지 포함한 전체 통합 실행:

```bash
cp .dev.vars.example .dev.vars   # DATABASE_URL, Google OAuth, AI 키 입력
npm run dev:pages
```

## 환경 변수 / DB 설정

`.env.example`을 참고해 아래 값을 설정합니다 (Cloudflare Pages 배포 시 대시보드 환경변수에도 동일하게 등록).

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/dbname?sslmode=require
AUTH_SECRET=replace-with-a-random-secret
AUTH_GOOGLE_ID=replace-with-google-client-id
AUTH_GOOGLE_SECRET=replace-with-google-client-secret

# AI 기능 (경험 AI 분석, 자소서 AI 초안)
AI_PROVIDER=openai-compatible
AI_API_KEY=
AI_MODEL=
```

DB는 Neon에서 `schema.sql`을 실행하면 됩니다 (Auth.js 테이블 포함, 기존 데이터는 삭제하지 않음). Google OAuth 콘솔에는 `https://compass-bsc.pages.dev`를 Authorized JavaScript origin/redirect URI로 등록합니다.

## 배포

GitHub 레포를 Cloudflare Pages와 연결하면 push 시 자동 배포됩니다. 빌드 명령어는 `npm run build`, 출력 폴더는 `dist`입니다.

## 향후 계획

- 직무 프로필·KPI와 경험 적합도, 문항별 경험 추천
- AI 자소서 품질 피드백과 버전 비교
- 지원 일정과 상태 관리
- 기업 정보 입력을 URL/기사 붙여넣기 기반 AI 분석으로 확장하고, 회사 단위로 저장·재사용

---

개발 과정의 세부 이력과 테스트 체크리스트는 [PROGRESS.md](./PROGRESS.md)에 있습니다.
