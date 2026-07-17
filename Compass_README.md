# Compass

> **내 경험을 체계적으로 축적하고, 하나의 경험을 여러 자소서 스토리로 발전시키는 경험 아카이브 기반 자소서 코파일럿**

Compass는 현재 지원 공고별 자소서 초안과 경험 메모를 한곳에서 관리하는 개인 작업공간 MVP입니다.  
다음 개발의 최우선 목표는 AI가 자소서를 바로 대신 작성하게 만드는 것이 아니라, 사용자가 가진 경험을 빠짐없이 기록하고 구조화하여 반복해서 활용할 수 있는 **경험카드 시스템**을 완성하는 것입니다.

경험카드가 충분히 축적된 이후에는 자소서 문항과 지원 직무를 분석하여 적합한 경험을 추천하고, 사용자가 선택한 경험과 스토리를 바탕으로 자소서 초안 작성과 피드백을 지원합니다.

---

## 1. 제품 정의

### 1.1 현재 Compass

현재 Compass는 다음 기능을 제공합니다.

- Google 로그인
- 로그인 사용자별 데이터 분리
- 회사명, 지원 분야, 지원 기간을 포함한 자소서 등록
- 여러 자소서 문항 등록
- 문항별 글자 수 또는 byte 제한 설정
- 문항별 답변 작성, 저장, 수정
- 11개 유형의 경험 자유서술 저장
- 최근 경험 20개 조회
- 월간 캘린더 UI
- 저장한 자소서를 다시 열어 편집하는 최근 기록 영역

현재 데이터는 다음 세 영역으로 분리되어 있습니다.

- `experiences`
- `resumes`
- `resume_questions`

이 구조 덕분에 경험과 자소서를 연결하는 확장이 가능합니다. 다만 현재 `experiences`는 `experience_type`과 `content`만 저장하므로 경험을 검색하거나 비교하고, 문항에 맞게 재사용하기 어렵습니다.

### 1.2 발전 후 Compass

Compass의 최종 흐름은 다음과 같습니다.

```mermaid
flowchart LR
    A[빠른 경험 메모] --> B[경험 구조화]
    B --> C[성과 수치화와 근거 기록]
    C --> D[여러 스토리 각도 생성]
    D --> E[역량·직무 KPI 연결]
    E --> F[자소서 문항별 경험 추천]
    F --> G[경험 기반 자소서 초안]
    G --> H[질문 적합성·구체성 피드백]
    H --> I[수정본과 버전 관리]
```

### 1.3 핵심 제품 원칙

1. **AI보다 경험 데이터가 먼저다.**
   - 경험카드 작성, 수정, 검색, 재사용이 AI 없이도 완전하게 동작해야 합니다.

2. **한 경험은 하나의 자소서 소재가 아니다.**
   - 같은 경험에서도 문제 해결, 협업, 리더십, 실행력, 갈등 관리, 데이터 활용 등 여러 스토리를 만들 수 있어야 합니다.

3. **수치는 생성하지 않고 확인한다.**
   - AI는 수치화할 수 있는 지점을 제안할 수 있지만, 사용자가 제공하지 않은 숫자를 사실처럼 만들어서는 안 됩니다.

4. **경험 원문을 보존한다.**
   - 구조화 과정에서 사용자의 최초 메모를 덮어쓰지 않습니다.

5. **지원 직무에 따른 평가는 고정값이 아니다.**
   - 같은 경험도 지원 직무와 문항에 따라 적합도가 달라지므로 직무 적합도와 우선순위는 별도로 관리합니다.

6. **모든 AI 결과는 제안 상태로 저장한다.**
   - AI가 생성한 구조, 수치 후보, 스토리, 자소서 문장은 사용자 확인 전에는 확정 데이터가 아닙니다.

---

## 2. 첨부 템플릿에서 반영할 핵심 구조

첨부된 3C4P 형태의 경험 정리 자료는 다음 흐름을 사용합니다.

1. 경험을 카테고리별로 나열
2. 경험에서 본인이 한 행동을 정리
3. 행동으로 발생한 결과를 정리
4. 결과를 수치로 표현
5. 지원 직무의 KPI와 연결
6. 직무 유사성과 성과 크기를 기준으로 우선순위 분류

Compass에서는 이 흐름을 그대로 복제하지 않고, 다음과 같이 확장합니다.

| 첨부 템플릿 개념 | Compass 적용 방식 |
|---|---|
| 경험 유형 | 경험카드 카테고리 |
| How | 행동 목록 |
| Result | 결과와 변화 |
| 수치화 | 복수의 성과 지표 |
| KPI 매칭 | 지원 직무별 KPI 연결 |
| 필살기/빌살기/밉살기 | 직무 적합도 × 성과 강도 기반 분류 |
| 하나의 경험 설명 | 하나의 경험에서 복수의 스토리 각도 생성 |
| 경험 우선순위 | 지원 공고와 문항별 동적 우선순위 |

`필살기`, `빌살기`, `밉살기`는 경험 자체의 영구 속성으로 저장하지 않습니다.  
예를 들어 같은 프로젝트 경험이 서비스 기획 직무에서는 필살기일 수 있지만, 회계감사 직무에서는 보조 경험일 수 있습니다. 따라서 해당 분류는 반드시 특정 지원 직무 또는 지원 공고와 연결된 평가 결과로 저장합니다.

---

## 3. 목표 사용자 흐름

### 3.1 경험 기록

```text
경험 기록 진입
→ 사용자가 경험 전체를 자유롭게 작성
→ 카테고리와 기본 정보, 원문 메모 입력
→ 사용자가 원하면 AI가 세부 구조화 초안 추천
→ 상황·목표·행동·결과·배운 점을 사용자 확인 후 반영
→ 수치화 가능한 지점은 AI가 숫자가 아닌 확인 질문으로 제안
→ 사용자가 성과, 역량, 태그, 스토리 각도를 보완
→ 경험카드 저장
```

AI는 빈 경험을 만들어 채우는 도구가 아닙니다. 사용자가 먼저 사실을 넓게 작성한 뒤, **`AI로 세부 내용 추천`**을 실행하면 원문 안의 사실을 바탕으로 구조화 후보와 빠진 정보 질문을 제시합니다. 사용자는 필드별로 적용·수정 후 적용·무시를 선택합니다.

### 3.2 경험 재사용

```text
경험 아카이브 검색
→ 카테고리·역량·태그·성과 유무로 필터링
→ 경험카드 상세 확인
→ 스토리 각도 선택
→ 자소서 문항에 연결
```

### 3.3 자소서 작성

```text
지원처와 문항 등록
→ 문항 의도 분석
→ 적합 경험카드와 스토리 추천
→ 사용자가 경험 선택
→ 사용자가 `AI로 자소서 작성` 실행
→ 선택한 경험카드·스토리·확인된 성과만으로 초안 생성
→ 질문 적합성·구체성·중복·분량 피드백
→ 수정 및 버전 저장
```

자소서 AI는 경험카드를 자동으로 연결하거나 기존 답변을 덮어쓰지 않습니다. 사용자가 문항별 경험카드와 스토리 각도를 선택한 뒤에만 새 초안 버전을 생성합니다.

---

## 4. 기술 스택과 현재 구조

### 4.1 현재 기술 스택

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Auth.js
- Cloudflare Pages
- Cloudflare Pages Functions
- Neon PostgreSQL
- `@neondatabase/serverless`

### 4.2 현재 주요 파일

```text
src/App.tsx
src/lib/api.ts
src/types.ts
functions/api/experiences.ts
functions/api/resumes.ts
functions/_lib/auth.ts
functions/_lib/resumes.ts
schema.sql
```

### 4.3 구조 개선 원칙

현재 `src/App.tsx`에 화면 상태와 기능이 집중되어 있습니다. 경험카드 기능을 추가하기 전에 기능 단위로 분리합니다.

권장 구조는 다음과 같습니다.

```text
src/
├─ app/
│  ├─ AppShell.tsx
│  └─ navigation.ts
├─ features/
│  ├─ experience-cards/
│  │  ├─ api.ts
│  │  ├─ constants.ts
│  │  ├─ types.ts
│  │  ├─ utils.ts
│  │  ├─ hooks/
│  │  │  └─ useExperienceCards.ts
│  │  └─ components/
│  │     ├─ ExperienceArchive.tsx
│  │     ├─ ExperienceCardList.tsx
│  │     ├─ ExperienceCardItem.tsx
│  │     ├─ ExperienceCardEditor.tsx
│  │     ├─ ExperienceBasicForm.tsx
│  │     ├─ ExperienceStructureForm.tsx
│  │     ├─ ExperienceMetricsEditor.tsx
│  │     ├─ ExperienceCompetencyEditor.tsx
│  │     ├─ StoryAngleEditor.tsx
│  │     └─ ExperienceCardDetail.tsx
│  ├─ resumes/
│  │  ├─ api.ts
│  │  ├─ types.ts
│  │  └─ components/
│  └─ schedule/
│     └─ components/
├─ shared/
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/
│  └─ types/
├─ App.tsx
└─ main.tsx

functions/
├─ _lib/
│  ├─ auth.ts
│  ├─ db.ts
│  ├─ validation.ts
│  ├─ experience-cards.ts
│  ├─ resume-links.ts
│  └─ ai/
│     ├─ client.ts
│     ├─ prompts.ts
│     ├─ schemas.ts
│     └─ guardrails.ts
└─ api/
   ├─ experience-cards.ts
   ├─ experience-cards/
   │  └─ [id].ts
   ├─ experience-card-options.ts
   ├─ resume-question-links.ts
   └─ ai/
      ├─ structure-experience.ts
      ├─ suggest-metrics.ts
      ├─ suggest-story-angles.ts
      ├─ recommend-experiences.ts
      ├─ generate-answer.ts
      └─ review-answer.ts

migrations/
├─ 001_experience_cards.sql
├─ 002_experience_metrics.sql
├─ 003_story_angles.sql
├─ 004_job_profiles_and_matches.sql
├─ 005_resume_experience_links.sql
└─ 006_ai_runs.sql
```

초기에는 React Router를 새로 도입하지 않아도 됩니다. 기존 `activeSection` 방식을 유지하면서 컴포넌트만 분리합니다. 경험카드 상세 URL 공유나 새로고침 복원이 필요해지는 시점에 라우팅 도입을 검토합니다.

---

## 5. 데이터 모델

## 5.1 기존 데이터 보존 전략

기존 `experiences` 테이블은 즉시 삭제하거나 컬럼을 대규모 변경하지 않습니다.

다음 순서로 이전합니다.

1. 새 `experience_cards` 테이블 생성
2. 기존 `experiences` 데이터를 `experience_cards.raw_note`로 복사
3. `experience_type`을 `category`로 복사
4. 기존 경험의 앞부분을 임시 제목으로 사용
5. `legacy_experience_id`로 원본 연결
6. 신규 UI가 안정화될 때까지 기존 테이블 유지
7. 검증 완료 후 기존 API를 deprecated 처리
8. 최종 삭제는 별도 Phase로 미룸

이 방식은 기존 사용자의 경험 메모 손실을 방지합니다.

## 5.2 경험카드

```sql
CREATE TABLE IF NOT EXISTS experience_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  legacy_experience_id INTEGER UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,

  category TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT,
  role TEXT,

  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,

  raw_note TEXT NOT NULL DEFAULT '',
  situation TEXT NOT NULL DEFAULT '',
  task TEXT NOT NULL DEFAULT '',
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  result TEXT NOT NULL DEFAULT '',
  learning TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',

  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'memo',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT experience_cards_status_check
    CHECK (status IN ('memo', 'structured', 'ready', 'archived')),

  CONSTRAINT experience_cards_period_check
    CHECK (
      is_ongoing = TRUE
      OR start_date IS NULL
      OR end_date IS NULL
      OR start_date <= end_date
    )
);

CREATE INDEX IF NOT EXISTS experience_cards_user_updated_idx
  ON experience_cards (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS experience_cards_user_category_idx
  ON experience_cards (user_id, category);

CREATE INDEX IF NOT EXISTS experience_cards_tags_gin_idx
  ON experience_cards USING GIN (tags);
```

### 필드 정의

| 필드 | 설명 |
|---|---|
| `raw_note` | 최초 자유 메모. 구조화 후에도 보존 |
| `situation` | 경험이 발생한 배경과 문제 상황 |
| `task` | 본인의 목표, 책임, 해결해야 할 과제 |
| `actions` | 본인이 실제 수행한 행동 목록 |
| `result` | 행동 이후 발생한 변화 |
| `learning` | 배운 점과 이후 행동 변화 |
| `summary` | 카드 목록에서 보여줄 2~3문장 요약 |
| `status` | 메모, 구조화 완료, 자소서 활용 준비, 보관 |
| `tags` | 산업, 도구, 주제, 상황 등 자유 태그 |

`actions`의 기본 JSON 형식은 다음과 같습니다.

```json
[
  {
    "id": "client-generated-id",
    "text": "문제 원인을 확인하기 위해 기존 업무 흐름을 단계별로 정리했다.",
    "sort_order": 0
  }
]
```

## 5.3 성과 지표

한 경험에는 여러 수치가 존재할 수 있습니다.

예시:

- 참여율 50% → 75%
- 업무 시간 10시간 → 7시간
- 2주 동안 3명 채용
- 오류 5건 → 0건
- 계획 대비 195% 달성
- 제안 10개 중 6개 반영

```sql
CREATE TABLE IF NOT EXISTS experience_metrics (
  id SERIAL PRIMARY KEY,
  experience_card_id INTEGER NOT NULL
    REFERENCES experience_cards(id) ON DELETE CASCADE,

  label TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'other',

  before_value NUMERIC,
  after_value NUMERIC,
  absolute_value NUMERIC,
  unit TEXT,

  display_text TEXT NOT NULL,
  calculation_note TEXT,
  evidence_note TEXT,

  verification_status TEXT NOT NULL DEFAULT 'needs_verification',
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT experience_metrics_type_check
    CHECK (
      metric_type IN (
        'count',
        'rate',
        'amount',
        'duration',
        'score',
        'rank',
        'quality',
        'other'
      )
    ),

  CONSTRAINT experience_metrics_verification_check
    CHECK (
      verification_status IN (
        'confirmed',
        'estimated',
        'needs_verification'
      )
    )
);

CREATE INDEX IF NOT EXISTS experience_metrics_card_idx
  ON experience_metrics (experience_card_id, sort_order, id);
```

### 수치 검증 상태

- `confirmed`
  - 사용자가 실제 자료나 기억을 근거로 확인한 수치
- `estimated`
  - 정확한 원자료는 없지만 합리적인 범위를 사용자가 직접 승인한 수치
- `needs_verification`
  - AI 또는 시스템이 수치화 가능성을 제안했으나 아직 확인하지 않은 상태

AI는 절대로 `confirmed` 상태로 저장할 수 없습니다.

## 5.4 역량

```sql
CREATE TABLE IF NOT EXISTS experience_competencies (
  id SERIAL PRIMARY KEY,
  experience_card_id INTEGER NOT NULL
    REFERENCES experience_cards(id) ON DELETE CASCADE,

  competency_name TEXT NOT NULL,
  strength_score INTEGER,
  evidence TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT experience_competencies_score_check
    CHECK (strength_score IS NULL OR strength_score BETWEEN 1 AND 5),

  CONSTRAINT experience_competencies_source_check
    CHECK (source IN ('manual', 'ai_suggested', 'ai_confirmed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS experience_competencies_unique_idx
  ON experience_competencies (experience_card_id, competency_name);
```

초기 기본 역량 예시는 다음과 같습니다.

- 문제 해결
- 실행력
- 주도성
- 협업
- 의사소통
- 리더십
- 분석력
- 데이터 활용
- 고객 중심
- 개선과 혁신
- 책임감
- 적응력
- 갈등 관리
- 윤리의식
- 전문성
- 학습 민첩성

사용자가 직접 역량을 추가할 수 있어야 합니다.

## 5.5 스토리 각도

하나의 경험에서 여러 자소서 스토리를 만들기 위한 핵심 테이블입니다.

```sql
CREATE TABLE IF NOT EXISTS experience_story_angles (
  id SERIAL PRIMARY KEY,
  experience_card_id INTEGER NOT NULL
    REFERENCES experience_cards(id) ON DELETE CASCADE,

  angle_type TEXT NOT NULL,
  title TEXT NOT NULL,
  core_message TEXT NOT NULL DEFAULT '',

  situation TEXT NOT NULL DEFAULT '',
  challenge TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  learning TEXT NOT NULL DEFAULT '',

  competency_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metric_ids INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  suitable_question_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  source TEXT NOT NULL DEFAULT 'manual',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT experience_story_angles_source_check
    CHECK (source IN ('manual', 'ai_suggested', 'ai_confirmed'))
);

CREATE INDEX IF NOT EXISTS experience_story_angles_card_idx
  ON experience_story_angles (experience_card_id, updated_at DESC);
```

### 기본 스토리 각도

- 문제 해결
- 목표 달성
- 도전과 극복
- 실패와 개선
- 협업
- 갈등 해결
- 리더십
- 주도성
- 데이터 기반 의사결정
- 업무 효율화
- 고객 또는 사용자 중심
- 전문성 발휘
- 빠른 학습과 적응
- 윤리와 책임
- 새로운 시도와 혁신

예를 들어 하나의 동아리 운영 경험은 다음처럼 재해석될 수 있습니다.

- 신입 회원 모집 문제를 해결한 **문제 해결 스토리**
- 홍보 체계를 직접 만든 **주도성 스토리**
- 여러 구성원과 역할을 나눈 **협업 스토리**
- 실패한 모집 방식을 수정한 **실패와 개선 스토리**
- 회원 수 증가를 만든 **성과 달성 스토리**

## 5.6 지원 직무와 KPI

```sql
CREATE TABLE IF NOT EXISTS job_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  company_name TEXT,
  job_field TEXT NOT NULL,
  job_description TEXT NOT NULL DEFAULT '',
  recruitment_notice TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_profiles_user_idx
  ON job_profiles (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS job_kpis (
  id SERIAL PRIMARY KEY,
  job_profile_id INTEGER NOT NULL
    REFERENCES job_profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority INTEGER,
  measurement_example TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS experience_job_matches (
  id SERIAL PRIMARY KEY,
  experience_card_id INTEGER NOT NULL
    REFERENCES experience_cards(id) ON DELETE CASCADE,
  job_profile_id INTEGER NOT NULL
    REFERENCES job_profiles(id) ON DELETE CASCADE,

  relevance_score INTEGER NOT NULL DEFAULT 0,
  achievement_score INTEGER NOT NULL DEFAULT 0,
  evidence_score INTEGER NOT NULL DEFAULT 0,
  uniqueness_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,

  classification TEXT,
  rationale TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT experience_job_match_scores_check
    CHECK (
      relevance_score BETWEEN 0 AND 100
      AND achievement_score BETWEEN 0 AND 100
      AND evidence_score BETWEEN 0 AND 100
      AND uniqueness_score BETWEEN 0 AND 100
      AND total_score BETWEEN 0 AND 100
    ),

  CONSTRAINT experience_job_match_classification_check
    CHECK (
      classification IS NULL
      OR classification IN ('primary', 'supporting', 'minor')
    ),

  UNIQUE (experience_card_id, job_profile_id)
);
```

UI에서는 필요할 경우 다음처럼 표현할 수 있습니다.

- `primary` → 필살기
- `supporting` → 빌살기
- `minor` → 밉살기

내부 데이터 이름은 중립적인 용어를 사용합니다.

## 5.7 자소서 문항과 경험 연결

```sql
CREATE TABLE IF NOT EXISTS resume_question_experience_links (
  id SERIAL PRIMARY KEY,
  resume_question_id INTEGER NOT NULL
    REFERENCES resume_questions(id) ON DELETE CASCADE,
  experience_card_id INTEGER NOT NULL
    REFERENCES experience_cards(id) ON DELETE CASCADE,
  story_angle_id INTEGER
    REFERENCES experience_story_angles(id) ON DELETE SET NULL,

  link_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (resume_question_id, experience_card_id, story_angle_id)
);

CREATE INDEX IF NOT EXISTS resume_question_experience_links_question_idx
  ON resume_question_experience_links
  (resume_question_id, link_order, id);
```

한 문항에 여러 경험을 연결할 수 있지만, 초기 MVP에서는 다음 제한을 권장합니다.

- 핵심 경험 1개
- 보조 경험 최대 2개
- 핵심 스토리 각도 1개

## 5.8 AI 실행 기록

```sql
CREATE TABLE IF NOT EXISTS ai_runs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  run_type TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id INTEGER,

  model_name TEXT,
  input_snapshot JSONB NOT NULL,
  output_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ai_runs_status_check
    CHECK (status IN ('completed', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS ai_runs_user_created_idx
  ON ai_runs (user_id, created_at DESC);
```

AI 실행 기록에는 API 키, 세션 토큰 등 비밀정보를 저장하지 않습니다.

---

## 6. 경험카드 상태 규칙

| 상태 | 의미 | 최소 조건 |
|---|---|---|
| `memo` | 빠르게 저장한 원문 메모 | 카테고리, 제목 또는 원문 |
| `structured` | 경험 구조화 완료 | 상황, 과제, 행동, 결과 중 핵심 필드 작성 |
| `ready` | 자소서에 바로 활용 가능 | 구조화 + 역량 1개 이상 + 스토리 각도 1개 이상 |
| `archived` | 현재는 사용하지 않는 경험 | 사용자 수동 변경 |

상태를 AI가 임의로 변경하지 않습니다. 시스템은 조건을 충족했을 때 상태 변경을 제안할 수 있습니다.

---

## 7. 경험카드 완성도

경험카드 상세 화면에서 다음 네 가지 완성도를 표시합니다.

### 7.1 구조 완성도

- 상황
- 과제
- 행동
- 결과
- 배운 점

### 7.2 근거 완성도

- 확인된 수치 존재
- 수치 계산 근거 존재
- 결과를 뒷받침하는 구체적 사실 존재

### 7.3 스토리 활용도

- 스토리 각도 1개 이상
- 서로 다른 질문 유형에 활용 가능
- 핵심 메시지가 명확함

### 7.4 직무 활용도

- 역량 연결
- 직무 프로필 연결
- KPI 연결
- 직무별 적합도 평가

초기에는 완성도를 DB에 저장하지 않고 화면에서 계산합니다.

---

# 8. Phase별 개발 계획

---

## Phase 0. 기존 기능 안정화와 개발 기반 정리

### 목표

경험카드 기능을 추가하기 전에 현재 로그인, 자소서 저장, 경험 저장 기능이 깨지지 않는 기준점을 만듭니다.

### 구현 항목

1. 현재 기능 수동 점검
   - Google 로그인
   - 로그아웃
   - 사용자별 경험 분리
   - 자소서 생성
   - 자소서 수정
   - 문항 추가와 삭제
   - 글자 수와 byte 계산
   - 최근 기록 열기

2. `src/App.tsx` 기능 분리
   - 레이아웃
   - 자소서
   - 경험
   - 일정
   - 최근 기록

3. 공통 API 응답 타입 정리

```ts
export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: string;
  details?: Record<string, string>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

4. 공통 인증 확인 로직 재사용
5. 공통 DB 환경변수 확인 로직 재사용
6. `updated_at` 갱신 규칙 통일
7. `npm run typecheck` 추가
8. 빌드 오류 없이 기존 기능 유지

### 완료 기준

- 기존 기능이 모두 동작합니다.
- `npm run build`가 성공합니다.
- `npm run typecheck`가 성공합니다.
- `App.tsx`가 단순 화면 조합 역할을 합니다.
- 경험카드 기능 없이도 배포 가능한 상태입니다.

### Codex 작업 지침

- UI 디자인을 대규모 변경하지 않습니다.
- 인증 방식을 교체하지 않습니다.
- 기존 DB 테이블을 삭제하지 않습니다.
- 현재 기능과 무관한 라이브러리를 추가하지 않습니다.
- 리팩터링과 기능 추가를 한 커밋에 섞지 않습니다.

---

## Phase 1. 경험 아카이브 정보 구조와 화면 골격

### 목표

기존의 단일 경험 입력 화면을 다음 세 화면으로 확장할 기반을 만듭니다.

- 경험 아카이브
- 경험카드 작성·수정
- 경험카드 상세

### 화면 구조

```text
경험
├─ 경험 아카이브
│  ├─ 검색
│  ├─ 필터
│  ├─ 정렬
│  └─ 카드 목록
├─ 새 경험 기록
└─ 경험 상세
```

### 경험 아카이브 필터

- 카테고리
- 상태
- 기간
- 역량
- 태그
- 수치 존재 여부
- 스토리 각도 존재 여부
- 최근 수정 순
- 오래된 순
- 제목 순

### 카드 목록 최소 표시 정보

- 제목
- 카테고리
- 기관 또는 조직
- 기간
- 2줄 요약
- 대표 역량
- 확인된 성과 수치
- 스토리 각도 개수
- 상태
- 최근 수정일

### 빈 화면

경험이 없을 때 다음 두 행동을 제공합니다.

- `빠르게 메모하기`
- `단계별로 경험 정리하기`

### 완료 기준

- 경험 메뉴 진입 시 아카이브 화면이 표시됩니다.
- 검색과 필터 UI가 존재합니다.
- 아직 새 DB가 없어도 목업 데이터로 화면을 확인할 수 있습니다.
- 모바일과 데스크톱에서 카드 목록이 읽기 쉽습니다.

---

## Phase 2. 경험카드 DB와 기존 경험 마이그레이션

### 목표

자유 메모 중심의 기존 `experiences`를 보존하면서 새 경험카드 구조를 도입합니다.

### 구현 항목

1. `migrations/001_experience_cards.sql` 작성
2. `migrations/002_experience_metrics.sql` 작성
3. `migrations/003_story_angles.sql` 작성
4. 기존 경험 마이그레이션 SQL 작성
5. 사용자별 데이터 접근 검증
6. 새 경험카드 CRUD API 작성

### 기존 경험 이전 예시

```sql
INSERT INTO experience_cards (
  user_id,
  legacy_experience_id,
  category,
  title,
  raw_note,
  status,
  created_at,
  updated_at
)
SELECT
  user_id,
  id,
  experience_type,
  LEFT(
    REGEXP_REPLACE(content, E'[\\n\\r]+', ' ', 'g'),
    60
  ),
  content,
  'memo',
  created_at,
  updated_at
FROM experiences
WHERE user_id IS NOT NULL
ON CONFLICT (legacy_experience_id) DO NOTHING;
```

### API

#### `GET /api/experience-cards`

지원 쿼리:

```text
?q=
&category=
&status=
&hasMetric=
&hasStory=
&sort=updated_desc
&limit=20
&cursor=
```

응답:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "nextCursor": null
  }
}
```

`LIMIT 20` 고정 방식 대신 cursor pagination을 사용합니다.

#### `POST /api/experience-cards`

```json
{
  "category": "프로젝트",
  "title": "재무제표 이상징후 탐지 서비스 개발",
  "organization": "팀 프로젝트",
  "role": "방산 산업 데이터 담당",
  "start_date": "2026-07-01",
  "end_date": null,
  "is_ongoing": true,
  "raw_note": "DART API를 활용해..."
}
```

#### `GET /api/experience-cards/:id`

다음 데이터를 한 번에 반환합니다.

- 경험카드
- 성과 지표
- 역량
- 스토리 각도

#### `PUT /api/experience-cards/:id`

경험카드 기본 정보와 구조화 내용을 수정합니다.

#### `DELETE /api/experience-cards/:id`

초기 구현은 hard delete 대신 다음 중 하나를 사용합니다.

- `status = 'archived'`
- 별도 `deleted_at` 컬럼을 추가한 soft delete

MVP에서는 보관 처리 방식을 권장합니다.

### 보안 기준

모든 상세, 수정, 삭제 쿼리는 반드시 다음 조건을 포함합니다.

```sql
WHERE id = ${cardId}
  AND user_id = ${user.id}
```

카드 ID만으로 조회하거나 수정하면 안 됩니다.

### 완료 기준

- 기존 경험이 새 경험카드 메모로 보입니다.
- 기존 경험 원문이 손실되지 않습니다.
- 다른 사용자의 경험카드에 접근할 수 없습니다.
- 경험카드 생성, 조회, 수정, 보관이 가능합니다.
- 목록에 20개 이상이 있어도 페이지 이동이 가능합니다.

---

## Phase 3. 빠른 메모와 단계별 경험 작성

### 목표

경험 기록의 진입 부담을 낮추면서도 구조화된 경험카드를 만들 수 있게 합니다.

### 작성 모드

#### A. 빠른 메모

최소 입력:

- 카테고리
- 제목
- 자유 메모

저장 결과:

- 상태 `memo`
- 나중에 구조화 가능

#### B. 단계별 작성

4단계로 구성합니다.

### Step 1. 기본 정보

- 카테고리
- 경험 제목
- 기관 또는 조직
- 본인의 역할
- 시작일
- 종료일 또는 진행 중
- 최초 메모

### Step 2. 경험 구조

- 상황
- 목표 또는 과제
- 본인의 행동
- 결과
- 배운 점
- 이후 변화

행동은 하나의 큰 textarea가 아니라 여러 항목으로 추가할 수 있게 합니다.

### Step 3. 수치와 근거

수치 입력 방식:

- 지표 이름
- 이전 값
- 이후 값
- 단일 값
- 단위
- 계산 방식
- 근거 메모
- 검증 상태

빠른 선택 예시:

- 인원
- 비율
- 시간
- 비용
- 건수
- 점수
- 순위
- 오류
- 처리량
- 참여율
- 달성률

### Step 4. 역량과 태그

- 역량 선택
- 역량별 근거
- 자유 태그
- 대표 역량 지정

### 저장 방식

- 각 단계에서 임시 저장 가능
- 이전 단계로 돌아가도 입력 유지
- 브라우저 종료 전 저장되지 않은 변경이 있으면 경고
- 저장 성공과 실패를 명확히 표시
- 중복 제출 방지

### 입력 도움말

추상적인 질문 대신 구체적인 질문을 제공합니다.

나쁜 예:

```text
어떤 경험이었나요?
```

좋은 예:

```text
당시 해결해야 했던 문제는 무엇이었나요?
본인이 직접 결정하거나 바꾼 것은 무엇이었나요?
행동 전과 후에 달라진 점은 무엇이었나요?
결과를 인원, 시간, 비율, 비용, 건수로 표현할 수 있나요?
```

### 완료 기준

- 1분 이내에 빠른 메모를 저장할 수 있습니다.
- 구조화 작성 중 중간 저장이 가능합니다.
- 행동과 성과 수치를 여러 개 추가할 수 있습니다.
- 경험 원문과 구조화 내용이 함께 보존됩니다.
- 모바일에서도 모든 입력 필드를 사용할 수 있습니다.

---

## Phase 4. 경험 상세와 여러 스토리 각도

### 목표

하나의 경험을 여러 자소서 질문에 활용할 수 있도록 스토리 각도를 생성하고 관리합니다.

### 경험 상세 화면

다음 섹션으로 구성합니다.

1. 기본 정보
2. 원문 메모
3. 상황·과제·행동·결과·배운 점
4. 성과 지표
5. 역량
6. 스토리 각도
7. 활용 기록
8. 수정 이력

### 스토리 각도 작성

사용자는 같은 경험에서 여러 스토리를 직접 추가할 수 있습니다.

스토리 각도 필드:

- 각도 유형
- 제목
- 핵심 메시지
- 강조할 상황
- 강조할 문제 또는 도전
- 강조할 행동
- 강조할 결과
- 강조할 배운 점
- 연결할 역량
- 사용할 성과 지표
- 적합한 자소서 문항 유형
- 주의할 점

### 중복 방지

새 스토리 각도를 추가할 때 기존 각도와 핵심 메시지가 지나치게 유사하면 경고합니다.

예시:

```text
기존 스토리와 강조점이 유사합니다.
새 스토리에서는 협업 과정이나 의사결정 근거를 더 강조해보세요.
```

### 활용 기록

경험카드가 실제로 어떤 자소서 문항에 사용됐는지 보여줍니다.

```text
삼정KPMG / 지원동기 / 2026-07-15
삼일PwC / 디지털 역량 / 2026-07-18
```

### 완료 기준

- 한 경험에 여러 스토리 각도를 저장할 수 있습니다.
- 대표 스토리 각도를 지정할 수 있습니다.
- 각 스토리별로 사용할 수치와 역량을 선택할 수 있습니다.
- 경험이 어떤 자소서 문항에 사용됐는지 확인할 수 있습니다.

---

## Phase 5. 경험 검색, 비교, 재사용

### 목표

경험이 많아져도 필요한 경험을 빠르게 찾을 수 있게 합니다.

### 검색 대상

- 제목
- 기관
- 역할
- 원문 메모
- 상황
- 행동
- 결과
- 배운 점
- 태그
- 역량
- 스토리 제목과 핵심 메시지

### 검색 구현 순서

1. PostgreSQL `ILIKE` 기반 검색
2. 태그와 카테고리 필터
3. 역량 필터
4. 성과 수치 존재 여부
5. 추후 필요할 때 PostgreSQL full-text search 도입
6. AI 임베딩 검색은 초기 범위에서 제외

### 경험 비교

2~3개 경험을 선택하여 다음 항목을 비교합니다.

- 직무 유사성
- 결과 강도
- 수치 근거
- 대표 역량
- 스토리 다양성
- 최근 사용 횟수
- 기존 자소서와 중복 가능성

### 중복 경험 감지

제목과 원문이 유사한 경험이 저장될 때 기존 카드를 보여주고 다음을 선택하게 합니다.

- 기존 경험 수정
- 기존 경험에 스토리 추가
- 별도 경험으로 저장

### 완료 기준

- 경험이 100개 이상이어도 검색과 필터로 찾을 수 있습니다.
- 특정 역량이 포함된 경험만 볼 수 있습니다.
- 수치가 없는 경험만 모아 보완할 수 있습니다.
- 유사 경험을 비교할 수 있습니다.

---

## Phase 6. 직무 프로필, KPI 연결, 경험 우선순위

### 목표

첨부 템플릿의 KPI 매칭과 경험 우선순위 개념을 서비스 기능으로 구현합니다.

### 직무 프로필 입력

- 회사명
- 지원 직무
- 공고 원문
- 주요 업무
- 요구 역량
- 우대 사항
- 사용자가 직접 입력한 직무 KPI

AI 기능 이전에는 모두 수동 입력과 편집이 가능해야 합니다.

### 경험 적합도 점수

기본 점수는 다음 항목으로 구성합니다.

| 항목 | 가중치 |
|---|---:|
| 직무·업무 유사성 | 35 |
| 성과 크기 | 25 |
| 수치와 근거의 신뢰성 | 20 |
| 경험의 차별성 | 10 |
| 스토리 완성도 | 10 |
| 합계 | 100 |

점수는 설명 가능한 형태로 표시합니다.

```text
직무 유사성 30/35
성과 크기 18/25
근거 신뢰성 16/20
차별성 7/10
스토리 완성도 8/10
총점 79/100
```

### 분류 기준 예시

- 80점 이상: 핵심 경험
- 60~79점: 보조 경험
- 59점 이하: 보완 필요 경험

점수 기준은 설정값으로 분리하여 나중에 조정할 수 있게 합니다.

### KPI 연결

한 경험에 여러 KPI를 연결할 수 있습니다.

예시:

```text
업무 처리 시간 단축
오류율 감소
참여율 증가
고객 만족도
목표 달성률
프로젝트 일정 준수율
```

### 완료 기준

- 직무 프로필을 생성할 수 있습니다.
- 경험과 직무 KPI를 수동으로 연결할 수 있습니다.
- 경험별 직무 적합도 점수를 입력하거나 계산할 수 있습니다.
- 같은 경험이 직무별로 다른 등급을 가질 수 있습니다.
- 필살기/빌살기/밉살기 표시가 직무 프로필에 종속됩니다.

---

## Phase 7. 자소서 문항과 경험 수동 연결

### 목표

AI 추천 전에도 사용자가 경험카드를 자소서 문항에 직접 연결할 수 있게 합니다.

### 자소서 작성 화면 변경

각 문항 옆에 다음 영역을 추가합니다.

```text
이 문항에 사용할 경험
[경험 찾기]

핵심 경험
- 재무제표 이상징후 탐지 프로젝트

사용할 스토리
- 데이터 기반 문제 해결

보조 경험
- 감사 학습 웹앱 개발
```

### 경험 선택 모달

표시 정보:

- 경험 제목
- 카테고리
- 대표 역량
- 주요 수치
- 직무 적합도
- 적합한 문항 유형
- 최근 사용 여부

### 연결 규칙

- 경험카드를 연결해도 자소서 답변을 자동 변경하지 않습니다.
- 답변이 이미 있는 경우 덮어쓰지 않습니다.
- 연결을 해제해도 경험카드는 삭제되지 않습니다.
- 문항별 사용 메모를 남길 수 있습니다.

### 완료 기준

- 자소서 문항에 경험과 스토리 각도를 연결할 수 있습니다.
- 문항 화면에서 연결된 경험의 핵심 사실을 확인할 수 있습니다.
- 경험 상세 화면에서 사용된 문항을 확인할 수 있습니다.
- AI 없이도 경험 재사용 흐름이 완성됩니다.

---

## Phase 8. AI 기반 경험 구조화

### 목표

사용자가 작성한 전체 경험 메모를 바탕으로 구조화 후보를 제시하되, 사용자가 확인한 내용만 저장합니다.

### 사용자 진입 방식

경험카드 편집 화면에서 사용자는 먼저 원문 메모와 알고 있는 사실을 충분히 작성합니다. 그 뒤 필요할 때만 `AI로 세부 내용 추천`을 실행합니다.

```text
사용자 원문 메모 작성
→ AI로 세부 내용 추천
→ 상황·과제·행동·결과·배운 점 후보와 확인 질문 표시
→ 필드별 적용·수정 후 적용·무시
→ 사용자 저장
```

AI는 카드의 `status`를 바꾸거나 수치·성과를 확정하지 않습니다.

### API

`POST /api/ai/structure-experience`

요청:

```json
{
  "experienceCardId": 12,
  "rawNote": "팀 프로젝트에서 데이터 계정명이 기업마다 달라...",
  "existingFacts": {
    "category": "프로젝트",
    "organization": "팀 프로젝트"
  }
}
```

응답:

```json
{
  "ok": true,
  "data": {
    "title": "DART 재무제표 계정 표준화 구조 설계",
    "summary": "기업별로 다른 계정명을...",
    "situation": "...",
    "task": "...",
    "actions": [
      {
        "text": "...",
        "sourceSentence": "원문에서 사용한 문장"
      }
    ],
    "result": "...",
    "learning": "...",
    "competencyCandidates": [
      {
        "name": "문제 해결",
        "evidence": "...",
        "confidence": 0.89
      }
    ],
    "metricCandidates": [
      {
        "label": "처리 시간 단축",
        "status": "needs_verification",
        "questionToUser": "기존 작업 시간과 개선 후 작업 시간을 기억하시나요?"
      }
    ],
    "missingInformationQuestions": [
      "본인이 직접 담당한 범위는 어디까지였나요?"
    ],
    "unsupportedClaims": []
  }
}
```

### AI 구조화 규칙

1. 원문에 없는 결과를 만들지 않습니다.
2. 원문에 없는 숫자를 생성하지 않습니다.
3. 팀 성과를 개인 성과로 바꾸지 않습니다.
4. 본인의 행동과 팀의 행동을 구분합니다.
5. 불명확한 내용은 질문으로 반환합니다.
6. 입력 원문에서 근거 문장을 함께 반환합니다.
7. 출력은 반드시 JSON Schema로 검증합니다.
8. 검증 실패 시 DB에 저장하지 않습니다.

### UI

AI 결과는 기존 필드와 비교하여 보여줍니다.

```text
현재 내용 | AI 제안
```

사용자는 필드별로 다음을 선택합니다.

- 적용
- 수정 후 적용
- 무시

`전체 적용` 버튼을 제공하더라도 확인 화면을 거칩니다.

### 완료 기준

- 자유 메모에서 구조화 후보를 생성할 수 있습니다.
- AI가 만든 숫자가 자동 저장되지 않습니다.
- 필드별 선택 적용이 가능합니다.
- 사용자가 거절한 제안은 원본을 덮어쓰지 않습니다.
- AI 실패 시 수동 작성 기능은 정상 동작합니다.

---

## Phase 9. AI 기반 수치화와 스토리 확장

### 목표

경험에서 수치화 가능한 지점을 찾고, 서로 다른 스토리 각도를 제안합니다.

### 수치화 제안

AI가 반환해야 할 것은 숫자가 아니라 **수치화 질문**입니다.

예시:

```json
{
  "label": "업무 시간 단축",
  "metricType": "duration",
  "reason": "업무 자동화 전후의 처리 시간을 비교할 수 있습니다.",
  "questions": [
    "기존에는 한 건 처리에 몇 분이 걸렸나요?",
    "개선 후에는 몇 분이 걸렸나요?",
    "한 달 평균 처리 건수는 몇 건이었나요?"
  ]
}
```

사용자가 답한 숫자로 시스템이 변화율을 계산합니다.

```text
변화율 = (이후 값 - 이전 값) / 이전 값 × 100
```

감소가 긍정적인 지표는 표현 방식을 구분합니다.

```text
처리 시간 30% 감소
오류율 5%p 감소
참여율 25%p 증가
```

퍼센트와 퍼센트포인트를 혼동하지 않습니다.

### 스토리 제안 API

`POST /api/ai/suggest-story-angles`

응답 예시:

```json
{
  "ok": true,
  "data": {
    "angles": [
      {
        "angleType": "problem_solving",
        "title": "기업별 계정명 차이를 표준화한 경험",
        "coreMessage": "복잡한 데이터를 공통 기준으로 재설계했다.",
        "selectedFacts": [
          "기업별 계정명이 달랐다.",
          "표준 계정 매핑 구조를 설계했다."
        ],
        "suitableQuestionTypes": [
          "문제 해결",
          "직무 역량",
          "프로젝트 경험"
        ],
        "missingInformation": [
          "표준화 전후 오류율 또는 처리 시간을 확인할 필요가 있다."
        ]
      }
    ]
  }
}
```

### 완료 기준

- AI가 수치 후보를 임의 숫자가 아닌 질문 형태로 제안합니다.
- 사용자가 입력한 값으로 변화율을 계산합니다.
- 하나의 경험에서 3개 이상의 서로 다른 스토리 후보를 제안할 수 있습니다.
- 스토리 후보마다 사용한 사실과 부족한 정보를 표시합니다.
- 사용자 승인 후에만 스토리로 저장합니다.

---

## Phase 10. AI 기반 문항별 경험 추천

### 목표

자소서 문항과 지원 직무를 바탕으로 적합한 경험카드와 스토리 각도를 추천합니다.

### 추천 과정

```text
문항 의도 분류
→ 지원 직무의 핵심 역량과 KPI 확인
→ 규칙 기반 후보 검색
→ 상위 후보만 AI 재평가
→ 경험 3~5개 추천
→ 추천 이유와 부족한 점 표시
```

### 문항 유형

- 지원 동기
- 입사 후 성장
- 직무 역량
- 성취
- 도전
- 실패
- 협업
- 갈등
- 리더십
- 문제 해결
- 의사소통
- 윤리
- 고객 중심
- 창의성과 개선
- 자유 문항

### 추천 점수

| 항목 | 가중치 |
|---|---:|
| 문항 의도와 스토리 각도 일치 | 30 |
| 지원 직무·KPI 적합성 | 25 |
| 구체적 행동과 본인 기여 | 20 |
| 성과 수치와 근거 | 15 |
| 최근 자소서와의 중복 위험 | 10 |

추천 결과:

```json
{
  "experienceCardId": 12,
  "storyAngleId": 31,
  "score": 88,
  "scoreBreakdown": {
    "questionMatch": 28,
    "jobMatch": 23,
    "ownership": 18,
    "evidence": 12,
    "duplication": 7
  },
  "reason": "문항이 요구하는 문제 해결과 데이터 분석을 모두 보여줍니다.",
  "caution": "팀 전체 결과와 본인의 직접 기여를 더 명확히 구분해야 합니다.",
  "missingInformation": [
    "표준화 결과 감소한 오류 건수"
  ]
}
```

### 추천 원칙

- 가장 화려한 경험이 아니라 문항에 가장 적합한 경험을 추천합니다.
- 같은 경험만 모든 문항에 반복 추천하지 않습니다.
- 최근 사용된 경험은 중복 위험을 표시합니다.
- 추천 이유를 사용자가 이해할 수 있어야 합니다.
- AI 점수만으로 자동 연결하지 않습니다.

### 완료 기준

- 문항별 경험 3~5개를 추천합니다.
- 각 추천에 점수와 이유가 표시됩니다.
- 추천된 스토리 각도를 바로 연결할 수 있습니다.
- 추천을 무시하고 다른 경험을 선택할 수 있습니다.
- 동일 자소서 내 경험 중복을 경고합니다.

---

## Phase 11. 경험 기반 자소서 초안 생성

### 목표

사용자가 문항에 직접 선택한 경험카드와 확인된 사실만을 사용하여 문항에 맞는 초안을 생성합니다.

### 사용자 진입 방식

```text
자소서 문항 열기
→ 경험 찾기에서 핵심 경험과 보조 경험 선택
→ 사용할 스토리 각도와 성과 지표 확인
→ 사용자가 강조 메시지·톤·구조 선택
→ AI로 자소서 작성
→ 새 초안 버전으로 확인·적용
```

AI 추천은 경험 선택을 돕는 보조 기능이며, 사용자가 선택하지 않은 경험카드를 자동으로 초안에 사용하지 않습니다.

### 생성 전 필수 입력

- 자소서 문항
- 글자 수 또는 byte 제한
- 회사명
- 지원 직무
- 선택한 경험카드
- 선택한 스토리 각도
- 사용할 성과 지표
- 사용자가 강조하려는 메시지

### 생성 요청

`POST /api/ai/generate-answer`

```json
{
  "resumeQuestionId": 10,
  "experienceCardIds": [12],
  "storyAngleIds": [31],
  "instructions": {
    "tone": "professional",
    "structure": "conclusion_first",
    "emphasis": "문제 정의와 실행력"
  }
}
```

### 생성 응답

```json
{
  "ok": true,
  "data": {
    "answer": "...",
    "charCount": 713,
    "byteCount": 1624,
    "usedFacts": [
      {
        "factType": "action",
        "sourceId": "experience_card:12:action:2"
      }
    ],
    "unsupportedClaims": [],
    "limitStatus": {
      "type": "chars",
      "limit": 800,
      "current": 713,
      "isExceeded": false
    },
    "warnings": [
      "성과 수치가 없어 결과의 구체성이 낮을 수 있습니다."
    ]
  }
}
```

### 생성 안전 규칙

1. 선택된 경험 외의 사용자 경험을 임의로 섞지 않습니다.
2. 제공되지 않은 회사 정보나 직무 내용을 사실처럼 만들지 않습니다.
3. 숫자를 반올림하거나 변경하지 않습니다.
4. 팀 성과를 개인 단독 성과로 표현하지 않습니다.
5. 사실 근거가 부족하면 표현을 약하게 하거나 경고합니다.
6. 글자 제한을 초과하면 자동 축약안과 원문을 함께 제공합니다.
7. 기존 답변이 있으면 자동 덮어쓰기하지 않습니다.
8. 새 초안은 별도 버전으로 저장합니다.

### 완료 기준

- 선택한 경험만으로 초안을 생성합니다.
- 사용된 사실을 추적할 수 있습니다.
- 글자와 byte 제한을 모두 계산합니다.
- 기존 답변을 보존합니다.
- AI가 추가한 근거 없는 문장이 있으면 경고합니다.

---

## Phase 12. 자소서 피드백과 버전 관리

### 목표

생성 또는 직접 작성한 답변을 반복해서 개선할 수 있게 합니다.

### 평가 항목

- 질문에 직접 답했는가
- 결론이 앞부분에 있는가
- 본인의 행동이 구체적인가
- 팀 성과와 개인 기여가 구분되는가
- 결과에 근거가 있는가
- 지원 직무와 연결되는가
- 추상 표현이 반복되는가
- 같은 표현이 중복되는가
- 글자 또는 byte 제한을 지키는가
- 선택한 경험과 모순되는 문장이 있는가

### 버전 테이블

```sql
CREATE TABLE IF NOT EXISTS resume_answer_versions (
  id SERIAL PRIMARY KEY,
  resume_question_id INTEGER NOT NULL
    REFERENCES resume_questions(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  generation_metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (resume_question_id, version_number),
  CONSTRAINT resume_answer_versions_source_check
    CHECK (source IN ('manual', 'ai_generated', 'ai_revised'))
);
```

### 완료 기준

- 이전 답변 버전을 복원할 수 있습니다.
- AI 수정본과 사용자 수정본을 구분합니다.
- 두 버전의 차이를 비교할 수 있습니다.
- 피드백이 문장 단위로 표시됩니다.
- 수정 제안을 개별 적용할 수 있습니다.

---

## Phase 13. 지원 일정과 상태 관리

경험카드와 자소서 작성 기능이 안정화된 이후 구현합니다.

### 지원 상태

- 관심
- 작성 중
- 제출 완료
- 서류 합격
- 서류 불합격
- 면접 예정
- 최종 합격
- 최종 불합격
- 지원 철회

### 캘린더 연결

- 지원 마감일
- 제출 예정일
- 서류 결과 예정일
- 면접 일정
- 후속 준비 일정

### 완료 기준

- 현재 캘린더 UI가 실제 지원 데이터와 연결됩니다.
- 마감이 임박한 자소서를 표시합니다.
- 자소서 상세와 일정 사이를 이동할 수 있습니다.

---

# 9. 경험카드 API 상세 설계

## 9.1 목록 조회

```http
GET /api/experience-cards
```

서버 처리 순서:

1. 인증 사용자 확인
2. 쿼리 파라미터 검증
3. `user_id` 필터 강제
4. 검색어와 필터 적용
5. cursor pagination 적용
6. 카드 요약 데이터 반환

목록 응답에는 긴 원문과 전체 스토리 내용을 포함하지 않습니다.

## 9.2 상세 조회

```http
GET /api/experience-cards/:id
```

반환:

```ts
type ExperienceCardDetail = {
  card: ExperienceCard;
  metrics: ExperienceMetric[];
  competencies: ExperienceCompetency[];
  storyAngles: ExperienceStoryAngle[];
  usageHistory: ExperienceUsage[];
};
```

## 9.3 생성

```http
POST /api/experience-cards
```

서버 검증:

- 허용된 카테고리 또는 사용자 정의 카테고리
- 제목 최대 길이
- 원문 최대 길이
- 시작일과 종료일 관계
- 배열과 JSON 구조
- 빈 action 제거
- 태그 trim과 중복 제거

## 9.4 수정

```http
PUT /api/experience-cards/:id
```

가능하면 카드, 지표, 역량, 스토리 각도를 하나의 거대한 요청으로 매번 교체하지 않습니다.

권장 방식:

- 카드 기본 정보 수정
- 지표 별도 생성·수정·삭제
- 역량 별도 생성·수정·삭제
- 스토리 별도 생성·수정·삭제

다만 초기 UI 개발 속도를 위해 aggregate update를 사용할 경우 서버 트랜잭션과 소유권 검사를 반드시 적용합니다.

## 9.5 보관

```http
PATCH /api/experience-cards/:id/status
```

```json
{
  "status": "archived"
}
```

---

# 10. AI 아키텍처

## 10.1 공급자 추상화

특정 AI 공급자나 모델명이 UI와 비즈니스 로직에 직접 퍼지지 않게 합니다.

```ts
export interface AiClient {
  generateStructured<T>(input: {
    systemPrompt: string;
    userPrompt: string;
    schema: unknown;
  }): Promise<T>;
}
```

환경변수 예시:

```env
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
```

API 키는 브라우저에 노출하지 않고 Cloudflare Pages Functions에서만 사용합니다.

## 10.2 프롬프트 분리

```text
functions/_lib/ai/prompts/
├─ structureExperience.ts
├─ suggestMetrics.ts
├─ suggestStoryAngles.ts
├─ recommendExperiences.ts
├─ generateAnswer.ts
└─ reviewAnswer.ts
```

프롬프트 문자열을 API route 내부에 직접 길게 작성하지 않습니다.

## 10.3 사실 기반 생성

AI에 전달할 입력은 원문 전체를 무작정 합치는 방식보다 정규화된 사실 목록으로 만듭니다.

```ts
type ExperienceFact = {
  id: string;
  type:
    | 'situation'
    | 'task'
    | 'action'
    | 'result'
    | 'learning'
    | 'metric';
  text: string;
  verificationStatus: 'confirmed' | 'estimated' | 'unverified';
};
```

AI 응답은 사용한 `fact.id`를 반환해야 합니다.

## 10.4 개인정보

- 사용자의 경험 원문을 로그에 평문으로 출력하지 않습니다.
- `console.log`에 전체 AI 입력을 남기지 않습니다.
- AI 실행 기록 저장 여부를 설정으로 분리합니다.
- 삭제한 경험은 이후 AI 추천 후보에서 제외합니다.
- 모든 AI API에서도 로그인 사용자 소유권을 다시 확인합니다.

---

# 11. 자소서 문항 추천 로직

AI만으로 전체 경험을 매번 평가하지 않습니다.

### 1차 규칙 기반 후보 검색

- 문항 유형과 스토리 각도 일치
- 역량 태그 일치
- 직무 KPI 일치
- `ready` 상태
- 확인된 수치 존재
- 최근 사용 횟수
- 동일 자소서 내 중복 여부

### 2차 AI 재정렬

규칙 기반 상위 10개만 AI가 평가합니다.

### 3차 사용자 선택

최종 선택은 사용자가 합니다.

이 구조의 장점:

- 비용 절감
- 응답 속도 개선
- 추천 이유 설명 가능
- 사용자 경험이 많아져도 확장 가능
- AI 실패 시 규칙 기반 추천 유지

---

# 12. UX 세부 원칙

## 12.1 입력 부담 낮추기

한 화면에 모든 필드를 강제로 작성하게 하지 않습니다.

- 빠른 메모 허용
- 나중에 구조화
- 각 단계 중간 저장
- 빈 필드 허용
- 완성도 표시
- 다음에 보완할 항목 제안

## 12.2 AI 버튼 배치

나쁜 예:

```text
AI로 전부 작성
```

권장 예:

```text
원문을 구조화해보기
수치화할 부분 찾아보기
다른 스토리 관점 찾아보기
이 문항에 적합한 경험 추천받기
선택한 경험으로 초안 만들기
```

AI 기능의 역할을 구체적으로 표현합니다.

## 12.3 결과 덮어쓰기 방지

AI 적용 전:

- 변경 전
- 변경 후
- 적용할 필드
- 제외할 필드

를 보여줍니다.

## 12.4 수치 입력 UX

숫자를 입력하기 어려운 경우 다음 선택을 제공합니다.

- 정확히 확인함
- 대략적인 값
- 아직 모름
- 수치 대신 구체적 사실로 표현

## 12.5 경험카드 품질 경고

예시:

- 본인의 행동이 드러나지 않습니다.
- 결과가 추상적입니다.
- 팀 성과와 개인 기여를 구분해주세요.
- 수치의 근거를 확인해주세요.
- 배운 점이 경험 내용과 연결되지 않습니다.
- 기존 스토리와 강조점이 유사합니다.

---

# 13. 카테고리

현재 11개 경험 유형을 유지합니다.

```ts
export const EXPERIENCE_CATEGORIES = [
  '학업',
  '학교프로젝트',
  '교내동아리',
  '대외활동(교외 동아리)',
  '연구/개발',
  '공모전/대회',
  '인턴',
  '아르바이트',
  '계약직/파견직',
  '정규 입사 경험',
  '개인사업/창업/사이드프로젝트',
] as const;
```

추후 다음 카테고리를 검토할 수 있습니다.

- 군 복무
- 해외 경험
- 봉사활동
- 자격시험
- 교육 수료
- 기타

기존 카테고리 값을 변경할 때는 데이터 마이그레이션을 함께 작성합니다.

---

# 14. 유효성 검증

클라이언트와 서버에서 모두 검증합니다.

## 경험카드

- 제목: 1~120자
- 원문: 최대 20,000자
- 상황·과제·결과·배운 점: 필드별 최대 5,000자
- 행동: 최대 30개
- 태그: 최대 30개
- 태그 하나: 최대 30자
- 시작일 ≤ 종료일
- 진행 중이면 종료일 비움

## 성과 지표

- 표시 문구 필수
- 숫자는 허용 범위 확인
- 분모가 0인 변화율 계산 금지
- `%`와 `%p` 구분
- 검증 상태 필수

## 스토리 각도

- 제목 필수
- 같은 경험 내 제목 중복 경고
- 선택한 metric ID가 해당 경험 소유인지 확인
- 대표 스토리는 경험당 하나만 허용

## 자소서

- 글자 수 또는 byte 제한 계산
- 제한 초과 경고
- 빈 문항 생성 방지
- 경험 연결 시 사용자 소유권 확인

---

# 15. 테스트 전략

현재 테스트 환경이 없다면 Phase 0에서 최소한의 테스트 기반을 추가합니다.

## 단위 테스트

- 글자 수 계산
- UTF-8 byte 계산
- 변화율 계산
- 퍼센트와 퍼센트포인트 표현
- 경험 완성도 계산
- 추천 점수 계산
- 태그 정규화
- cursor encode/decode

## API 테스트

- 비로그인 401
- 다른 사용자 카드 조회 404 또는 403
- 잘못된 날짜 400
- 빈 제목 400
- 경험카드 CRUD
- 지표 CRUD
- 스토리 CRUD
- 보관 상태 카드 목록 제외
- 마이그레이션 중복 실행 안전성

## UI 테스트

- 빠른 메모 저장
- 단계별 입력
- 중간 저장
- 필터 적용
- 경험 상세 열기
- 스토리 추가
- 문항에 경험 연결
- 기존 자소서 수정 기능 회귀 테스트

## AI 테스트

- JSON Schema 검증 실패 처리
- AI 타임아웃 처리
- 근거 없는 숫자 차단
- 다른 사용자 경험 참조 차단
- 기존 답변 자동 덮어쓰기 차단
- AI 비활성 상태에서 수동 기능 유지

---

# 16. 성능과 확장성

## 목록

- 긴 원문 제외
- cursor pagination
- 사용자별 인덱스
- 필터 컬럼 인덱스
- 검색 결과 최대 개수 제한

## AI

- 모든 경험 전체를 매번 보내지 않음
- 규칙 기반으로 후보 축소
- 카드 요약과 스토리만 전송
- 동일 입력에 대한 결과 캐시 여부 검토
- 요청 중복 방지
- 사용자별 호출 제한 검토

## DB

- API 요청마다 테이블 생성 SQL을 실행하지 않음
- 스키마 변경은 migration 파일로 관리
- 복수 테이블 수정은 가능한 범위에서 transaction 사용
- N+1 조회 방지
- 목록과 상세 쿼리 분리

---

# 17. 접근 권한과 보안

모든 사용자 데이터 테이블은 `user_id` 또는 사용자 소유 관계를 통해 검증합니다.

직접 `user_id`가 없는 하위 테이블도 반드시 상위 테이블을 조인하여 소유권을 확인합니다.

예시:

```sql
SELECT m.*
FROM experience_metrics m
JOIN experience_cards c
  ON c.id = m.experience_card_id
WHERE m.id = ${metricId}
  AND c.user_id = ${user.id};
```

금지 사항:

- 클라이언트가 전달한 `user_id` 신뢰
- 카드 ID만으로 수정
- AI 요청에서 다른 사용자의 카드 ID 사용
- API 응답에 내부 오류 스택 노출
- 브라우저에 DB URL 또는 AI API 키 노출

---

# 18. Codex 구현 규칙

Codex는 다음 규칙을 따릅니다.

1. Phase 순서를 건너뛰지 않습니다.
2. 한 번에 하나의 Phase만 구현합니다.
3. 각 Phase 시작 전 관련 기존 파일을 읽습니다.
4. 기존 로그인과 자소서 기능을 유지합니다.
5. 기존 데이터를 삭제하는 migration을 작성하지 않습니다.
6. migration은 여러 번 실행해도 안전하게 작성합니다.
7. API에는 항상 인증과 사용자 소유권 검사를 포함합니다.
8. 클라이언트 타입과 서버 타입을 함께 갱신합니다.
9. UI만 만들고 API를 임시 목업 상태로 남기지 않습니다.
10. API만 만들고 사용자가 접근할 UI를 누락하지 않습니다.
11. 에러 메시지는 사용자용과 서버 로그용을 구분합니다.
12. AI 결과는 즉시 확정 데이터로 저장하지 않습니다.
13. AI가 숫자, 회사 정보, 개인 기여를 추측하지 않게 합니다.
14. 새로운 패키지는 필요성과 대안을 README 또는 PR 설명에 기록합니다.
15. 구현 완료 후 아래 명령을 실행합니다.

```bash
npm install
npm run typecheck
npm run build
npm run test
```

테스트 스크립트가 아직 없다면 해당 Phase에서 추가하거나, 추가하지 못한 이유를 명시합니다.

---

# 19. Phase별 커밋 권장안

```text
refactor: split app sections before experience card work

feat: add experience card database schema and migration

feat: add experience card CRUD API

feat: add experience archive and quick memo flow

feat: add structured experience editor

feat: add experience metrics and evidence tracking

feat: add competencies and story angles

feat: add experience search and filters

feat: add job profiles and KPI matching

feat: link experience cards to resume questions

feat: add AI-assisted experience structuring

feat: add AI metric and story suggestions

feat: recommend experiences for resume questions

feat: generate resume answers from selected experiences

feat: add resume answer review and version history

feat: connect application schedule to calendar
```

---

# 20. MVP 범위

경험카드 중심의 첫 번째 배포 목표는 **Phase 0~7**입니다.

### 반드시 포함

- 기존 경험 데이터 보존
- 경험 아카이브
- 빠른 메모
- 단계별 구조화
- 복수 행동
- 복수 성과 지표
- 수치 검증 상태
- 역량과 태그
- 복수 스토리 각도
- 검색과 필터
- 자소서 문항에 경험 수동 연결

### 포함하지 않음

- AI 자동 자소서 작성
- 임베딩 기반 검색
- 공고 자동 수집
- 협업 기능
- 공개 프로필
- 모바일 앱
- 결제
- 캘린더 외부 연동
- 여러 사용자의 경험 공유

Phase 0~7만으로도 Compass는 단순 메모 도구에서 **경험을 축적하고 재사용하는 실질적인 자소서 작업공간**으로 발전해야 합니다.

---

# 21. AI 기능의 MVP 범위

AI 기능은 Phase 8~12에서 순차적으로 추가합니다.

우선순위:

1. 경험 원문 구조화
2. 수치화 질문 제안
3. 여러 스토리 각도 제안
4. 문항별 경험 추천
5. 선택 경험 기반 초안 생성
6. 자소서 피드백과 수정
7. 버전 비교

AI가 가장 먼저 해야 할 일은 글을 대신 쓰는 것이 아니라, 사용자의 경험에서 빠진 정보와 활용 가능한 관점을 찾아주는 것입니다.

---

# 22. 최종 성공 기준

Compass가 다음 질문에 답할 수 있으면 목표를 달성한 것입니다.

### 경험 기록

- 내가 어떤 경험을 했는가?
- 그 경험에서 내가 직접 한 행동은 무엇인가?
- 행동 전과 후에 무엇이 달라졌는가?
- 수치로 표현할 수 있는 결과는 무엇인가?
- 해당 숫자는 확인된 사실인가?
- 이 경험에서 증명되는 역량은 무엇인가?

### 스토리 확장

- 같은 경험을 문제 해결 관점으로 설명할 수 있는가?
- 협업 관점으로 설명할 수 있는가?
- 실패와 개선 관점으로 설명할 수 있는가?
- 직무 역량 관점으로 설명할 수 있는가?
- 각 스토리에서 사용할 행동과 결과가 구분되는가?

### 자소서 활용

- 이 문항에 가장 적합한 경험은 무엇인가?
- 왜 그 경험이 적합한가?
- 다른 문항에서 이미 과도하게 사용한 경험은 아닌가?
- 지원 직무의 KPI와 연결되는가?
- 선택한 경험의 확인된 사실만으로 답변을 작성했는가?
- 글자 수와 byte 제한을 지켰는가?

---

# 23. 한 줄 제품 정의

> **Compass는 사용자의 경험을 카테고리별로 기록하고, 행동·성과·수치·역량·스토리 관점으로 구조화한 뒤, 지원 직무와 자소서 문항에 맞는 경험을 찾아 답변으로 전환하는 경험 아카이브 기반 자소서 코파일럿이다.**
