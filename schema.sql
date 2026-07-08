CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  experience_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
