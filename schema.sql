CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_provider_account_id_key
  ON accounts (provider, "providerAccountId");

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_session_token_key
  ON sessions ("sessionToken");

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  experience_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE experiences
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS experiences_user_id_created_at_idx
  ON experiences (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  application_start_date DATE,
  application_end_date DATE,
  job_field TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS resumes_user_id_updated_at_idx
  ON resumes (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS resume_questions (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL DEFAULT '',
  limit_type TEXT NOT NULL DEFAULT 'none',
  limit_value INTEGER,
  answer_content TEXT NOT NULL DEFAULT '',
  company_info TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT resume_questions_limit_type_check
    CHECK (limit_type IN ('chars', 'bytes', 'none'))
);

CREATE INDEX IF NOT EXISTS idx_resume_questions_resume_id
  ON resume_questions (resume_id, sort_order, id);

-- Experience-card archive. Existing free-form experiences are intentionally retained.
CREATE TABLE IF NOT EXISTS experience_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  legacy_experience_id INTEGER UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
  category TEXT NOT NULL, title TEXT NOT NULL, organization TEXT, role TEXT,
  start_date DATE, end_date DATE, is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
  raw_note TEXT NOT NULL DEFAULT '', situation TEXT NOT NULL DEFAULT '', task TEXT NOT NULL DEFAULT '',
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, result TEXT NOT NULL DEFAULT '', learning TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], status TEXT NOT NULL DEFAULT 'memo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT experience_cards_status_check CHECK (status IN ('memo', 'structured', 'ready', 'archived')),
  CONSTRAINT experience_cards_period_check CHECK (is_ongoing OR start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);
CREATE INDEX IF NOT EXISTS experience_cards_user_updated_idx ON experience_cards (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS experience_cards_user_category_idx ON experience_cards (user_id, category);
CREATE INDEX IF NOT EXISTS experience_cards_tags_gin_idx ON experience_cards USING GIN (tags);

CREATE TABLE IF NOT EXISTS experience_metrics (
  id SERIAL PRIMARY KEY, experience_card_id INTEGER NOT NULL REFERENCES experience_cards(id) ON DELETE CASCADE,
  label TEXT NOT NULL, metric_type TEXT NOT NULL DEFAULT 'other', before_value NUMERIC, after_value NUMERIC, absolute_value NUMERIC, unit TEXT,
  display_text TEXT NOT NULL, calculation_note TEXT, evidence_note TEXT, verification_status TEXT NOT NULL DEFAULT 'needs_verification', sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT experience_metrics_type_check CHECK (metric_type IN ('count','rate','amount','duration','score','rank','quality','other')),
  CONSTRAINT experience_metrics_verification_check CHECK (verification_status IN ('confirmed','estimated','needs_verification'))
);
CREATE TABLE IF NOT EXISTS experience_competencies (
  id SERIAL PRIMARY KEY, experience_card_id INTEGER NOT NULL REFERENCES experience_cards(id) ON DELETE CASCADE,
  competency_name TEXT NOT NULL, strength_score INTEGER, evidence TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'manual', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT experience_competencies_score_check CHECK (strength_score IS NULL OR strength_score BETWEEN 1 AND 5),
  CONSTRAINT experience_competencies_source_check CHECK (source IN ('manual','ai_suggested','ai_confirmed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS experience_competencies_unique_idx ON experience_competencies (experience_card_id, competency_name);
CREATE TABLE IF NOT EXISTS experience_story_angles (
  id SERIAL PRIMARY KEY, experience_card_id INTEGER NOT NULL REFERENCES experience_cards(id) ON DELETE CASCADE,
  angle_type TEXT NOT NULL, title TEXT NOT NULL, core_message TEXT NOT NULL DEFAULT '', situation TEXT NOT NULL DEFAULT '', challenge TEXT NOT NULL DEFAULT '', action TEXT NOT NULL DEFAULT '', result TEXT NOT NULL DEFAULT '', learning TEXT NOT NULL DEFAULT '',
  competency_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], metric_ids INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[], suitable_question_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], source TEXT NOT NULL DEFAULT 'manual', is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT experience_story_angles_source_check CHECK (source IN ('manual','ai_suggested','ai_confirmed'))
);
CREATE INDEX IF NOT EXISTS experience_story_angles_card_idx ON experience_story_angles (experience_card_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS resume_question_experience_links (
  id SERIAL PRIMARY KEY,
  resume_question_id INTEGER NOT NULL REFERENCES resume_questions(id) ON DELETE CASCADE,
  experience_card_id INTEGER NOT NULL REFERENCES experience_cards(id) ON DELETE CASCADE,
  story_angle_id INTEGER REFERENCES experience_story_angles(id) ON DELETE SET NULL,
  link_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resume_question_id, experience_card_id, story_angle_id)
);
CREATE INDEX IF NOT EXISTS resume_question_experience_links_question_idx
  ON resume_question_experience_links (resume_question_id, link_order, id);

CREATE TABLE IF NOT EXISTS resume_answer_versions (
  id SERIAL PRIMARY KEY,
  resume_question_id INTEGER NOT NULL REFERENCES resume_questions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  generation_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resume_question_id, version_number),
  CONSTRAINT resume_answer_versions_source_check CHECK (source IN ('manual', 'ai_generated', 'ai_revised'))
);

INSERT INTO experience_cards (user_id, legacy_experience_id, category, title, raw_note, status, created_at, updated_at)
SELECT user_id, id, experience_type, LEFT(REGEXP_REPLACE(content, E'[\\n\\r]+', ' ', 'g'), 60), content, 'memo', created_at, updated_at
FROM experiences WHERE user_id IS NOT NULL
ON CONFLICT (legacy_experience_id) DO NOTHING;
