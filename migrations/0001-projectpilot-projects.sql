CREATE TABLE IF NOT EXISTS projectpilot_projects (
  user_id text PRIMARY KEY,
  project jsonb NOT NULL CHECK (jsonb_typeof(project) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
