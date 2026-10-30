CREATE TABLE IF NOT EXISTS projectpilot_projects (
  user_id text PRIMARY KEY,
  project jsonb NOT NULL CHECK (jsonb_typeof(project) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projectpilot_projects ADD COLUMN IF NOT EXISTS project_id text;
UPDATE projectpilot_projects
SET project_id = project->>'id'
WHERE project_id IS NULL;
ALTER TABLE projectpilot_projects ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE projectpilot_projects ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE projectpilot_projects DROP CONSTRAINT IF EXISTS projectpilot_projects_pkey;
ALTER TABLE projectpilot_projects
ADD CONSTRAINT projectpilot_projects_pkey PRIMARY KEY (user_id, project_id);
