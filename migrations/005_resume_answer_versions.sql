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
