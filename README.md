# Compass

자소서에 활용할 경험을 기록하는 경험카드 웹사이트 MVP입니다.

## 기능

- 경험 유형 선택
- 경험 내용 작성
- 경험 저장
- 최근 경험 목록 조회

## 기술 스택

- React
- Vite
- TypeScript
- Tailwind CSS
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

Neon DB에서 `schema.sql`의 SQL을 실행합니다. Neon SQL Editor 또는 PostgreSQL 클라이언트에서 적용할 수 있습니다.

```sql
CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  experience_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

현재 MVP에는 로그인 기능이 없으므로 `user_id` 컬럼은 포함하지 않습니다. 추후 로그인 기능을 붙일 경우 `user_id` 컬럼을 추가해 사용자별 경험 관리로 확장할 수 있습니다.

## 환경변수

`.env.example`을 참고합니다.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/dbname?sslmode=require
```

Cloudflare Pages 배포 시에는 Cloudflare 대시보드의 환경변수에 `DATABASE_URL`을 등록해야 합니다. 필요하면 Production/Preview 환경을 나누어 설정할 수 있습니다.

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
