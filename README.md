# Compass

내 경험을 체계적으로 축적하고, 하나의 경험을 여러 자소서 스토리로 발전시키는 경험 아카이브 기반 자소서 코파일럿입니다.

## 기능

- Google 로그인, 로그인 없이 둘러보기도 가능
- 최초 방문(미로그인) 시 화면 중앙의 로그인 카드로 안내: Google 로그인 또는 `로그인 없이 둘러보기`를 선택하면 앱으로 진입하며, 둘러보기 선택은 브라우저에 저장되어 다음 방문부터는 바로 앱으로 진입
- 경험 아카이브와 구조화된 경험카드
- 상단 `경험 | 자소서`만 남긴 미니멀 작업 흐름
- 첫 화면은 경험 기록으로 시작하고, 자소서는 `회사와 문항 → 답변 작성` 두 단계로 안내
- 새 자소서는 회사명·지원 분야·첫 문항만 입력하면 시작하며, 지원 일정은 선택 입력
- 원문 메모, 상황·과제·행동·결과·배운 점 기록
- 경험카드의 `AI 분석`: 저장된 원문을 바탕으로 AI가 판단한 추가 질문을 모달에서 하나씩 던지고, 답변하거나 건너뛸 수 있으며 언제든 중단 가능. 답변을 종합해 원문 메모를 보강하고 자동 저장
- 성과 수치, 역량, 태그, 여러 스토리 각도
- 자소서 문항별 핵심·보조 경험 수동 연결
- 문항에서는 경험 제목만 간단히 선택하고, 세부 근거는 AI 초안 생성에만 활용
- AI 초안은 결과·적용·확인 사항만 표시하고, 기존 답변은 사용자가 적용하기 전까지 유지
- 연결한 경험카드·스토리·확인된 성과만 활용하는 AI 자소서 초안 및 버전 저장
- `AI 초안 만들기`는 먼저 모달에서 답변 흐름(개요) 또는 이미 작성한 답변을 입력받고, AI가 초안 작성에 충분한지 판단해 부족하면 추가 질문을 던짐. 충분해지면 서로 다른 각도의 흐름 제안 3안(완성 문장이 아닌 불릿 포인트 구성안)을 보여주고, 그중 하나를 고르면 그 흐름대로 전체 초안을 생성. 추가 질문 답변은 연결된 핵심 경험카드의 원문 메모로 승격되어 재사용됨
- AI 초안은 실제 우수 자소서 사례를 벤치마크한 문체로 작성됨: `[소제목]`(짧은 정체성 문구 또는 완결된 주장 문장)으로 시작하고, 단일 주제 문항은 훅(직무·산업 관찰) → 본론(구체 경험·수치·기업 정보 연계) → 결론(단기·장기 다짐) 구조로, 하위 질문이 여러 개 묶인 문항은 일반론 도입 + `[소제목]`을 각각 단 경험 2개 블록(각각 기업·부문명과 연결하는 문장으로 마무리)으로 자동 분기. 소통·협업 같은 소프트스킬 경험에도 구체적 수치를 반영. 설정된 글자 수·byte 제한의 최소 90%까지 채우도록 시도(부족하면 자동으로 한 번 더 보강). 해시태그 형식을 요구하는 문항은 자동으로 감지해 `#키워드` 형식으로만 작성
- 문항별 기업 정보(인재상·정책·신년사 등) 입력란을 제공해 지원동기 등 기업 연계형 문항의 AI 초안에 반영
- 경험카드 활용을 위한 지원 동기·직무 역량·문제 해결·협업·실패와 개선 문항 예시
- 글자 수 또는 byte 제한을 포함한 자소서 저장·수정
- 경험카드·자소서 모두 완전 삭제 가능 (경험은 상세 화면의 `삭제`, 자소서는 목록 카드의 `삭제`, 확인 후 즉시 삭제)
- 파비콘(SVG + PNG 폴백/Apple 터치 아이콘)과 링크 공유 시 노출되는 Open Graph/Twitter 카드 이미지 적용

## 기술 스택

- React
- Vite
- TypeScript
- Tailwind CSS
- Auth.js
- Cloudflare Pages
- Cloudflare Pages Functions
- Neon DB

## 브랜드 자산

`public/favicon.svg`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/apple-touch-icon.png`, `public/favicon-512.png`, `public/og-image.png`은 모두 기존 `compass-logo.svg` 아이콘과 동일한 디자인을 재사용합니다. PNG들은 별도 디자인 툴 없이 SVG를 렌더링해 캡처하는 방식으로 생성했으므로, 로고 디자인을 바꾸면 이 파일들도 함께 다시 만들어야 합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

`npm run dev`는 화면 확인용 Vite 서버입니다. 로그인과 DB를 포함한 통합 테스트는 아래 명령을 사용합니다.

```bash
cp .dev.vars.example .dev.vars
# .dev.vars에 테스트용 DATABASE_URL과 Google OAuth 값을 입력
npm run dev:pages
```

자세한 진행 현황과 테스트 체크리스트는 [PROGRESS.md](./PROGRESS.md)를 참고하세요.

## 문서 운영 원칙

기능을 추가하거나 동작을 변경할 때마다 이 README의 기능·테스트 방법을 갱신하고, [PROGRESS.md](./PROGRESS.md)에 README 기준 Phase 진행 상태와 다음 개발 항목을 반영합니다.

## AI 기능 설정

경험카드의 `AI 분석`(질문-답변으로 원문 보강)과 자소서의 `AI 초안 만들기`는 아래 환경변수가 있어야 동작합니다. Cloudflare Pages 환경변수 또는 로컬 `.dev.vars`에 아래 값을 설정하면 사용할 수 있습니다.

```env
AI_PROVIDER=openai-compatible
AI_API_KEY=
AI_MODEL=
```

AI 호출이 실패하면 화면에 제공자 오류 상태와 메시지를 표시합니다. API 키·모델 ID·OpenAI API 사용 한도를 확인하세요.
GPT-5 계열 모델은 `temperature` 값을 지원하지 않을 수 있으므로, Compass는 기본 설정으로 요청합니다.
`AI_MODEL`은 코드에 고정되어 있지 않고 전적으로 이 환경변수 값을 따르므로, 더 최신·상위 모델을 쓰고 싶다면 Cloudflare Pages 대시보드(또는 `.dev.vars`)에서 이 값만 원하는 모델 ID로 바꾸면 됩니다.

## DB 설정

Neon DB에서 `schema.sql`의 SQL을 실행합니다. Neon SQL Editor 또는 PostgreSQL 클라이언트에서 적용할 수 있습니다. 로그인 기능을 위해 Auth.js용 `users`, `accounts`, `sessions`, `verification_token` 테이블과 `experiences.user_id` 컬럼이 함께 생성됩니다.

```sql
-- schema.sql 전체 실행
```

기존에 로그인 없이 저장한 데이터가 있다면 `user_id`가 비어 있을 수 있습니다. 로그인 기능 이후 저장되는 경험은 로그인한 사용자 기준으로 분리됩니다.

## 환경변수

`.env.example`을 참고합니다.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/dbname?sslmode=require
AUTH_SECRET=replace-with-a-random-secret
AUTH_GOOGLE_ID=replace-with-google-client-id
AUTH_GOOGLE_SECRET=replace-with-google-client-secret
```

Cloudflare Pages 배포 시에는 Cloudflare 대시보드 환경변수에 아래 값을 등록해야 합니다.

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Google OAuth 콘솔에는 아래 주소를 등록합니다.

- Authorized JavaScript origin: `https://compass-bsc.pages.dev`
- Authorized redirect URI: `https://compass-bsc.pages.dev/api/auth/callback/google`

## 배포

GitHub 레포를 Cloudflare Pages와 연결합니다.

빌드 명령어:

```bash
npm run build
```

빌드 출력 폴더:

```text
dist
```

## 추후 확장 예정

- 직무 프로필·KPI와 경험 적합도
- 문항별 경험 추천
- AI 자소서 품질 피드백과 버전 비교
- 지원 일정과 상태 관리
- 기업 정보 입력을 URL 또는 기사·전문 붙여넣기 기반 AI 분석으로 확장하고, 문항별 입력을 회사 단위 저장·재사용 구조로 발전
