# Compass

자소서에 활용할 경험을 기록하는 경험카드 웹사이트 MVP입니다.

## 기능

- Google 로그인
- 경험 유형 선택
- 경험 내용 작성
- 경험 저장
- 로그인 사용자별 최근 경험 목록 조회

## 기술 스택

- React
- Vite
- TypeScript
- Tailwind CSS
- Auth.js
- Cloudflare Pages
- Cloudflare Pages Functions
- Neon DB

## 로컬 실행

```bash
npm install
npm run dev
```

`npm run dev`는 프론트엔드 개발 서버를 실행합니다. Cloudflare Pages Functions까지 함께 검증하려면 Cloudflare 로컬 실행 환경을 추가로 구성해야 할 수 있습니다.

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

- 로그인 기능
- 사용자별 경험 관리
- AI 기반 경험 구조화
- 경험 태그
- 자소서 문항별 경험 추천
- 자소서 초안 생성
