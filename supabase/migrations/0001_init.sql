-- AI Photo Culling System (GDrive SSO Edition) - initial schema (PRD v1.2)

CREATE TABLE user_gdrive_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_folder_id TEXT NOT NULL,
  destination_folder_id TEXT NOT NULL,
  sync_mode TEXT NOT NULL DEFAULT 'COPY' CHECK (sync_mode IN ('COPY','MOVE')),
  status TEXT NOT NULL DEFAULT 'IDLE'
    CHECK (status IN ('IDLE','SCANNING','READY_TO_SYNC','SYNCING','COMPLETED','FAILED')),
  total_photos INT NOT NULL DEFAULT 0,
  processed_photos INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE photo_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  best_photo_id UUID
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES photo_clusters(id) ON DELETE SET NULL,
  gdrive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  thumbnail_url TEXT,
  captured_at TIMESTAMPTZ,
  exif_data JSONB,
  dhash TEXT,
  sharpness_score FLOAT,
  is_technically_rejected BOOLEAN NOT NULL DEFAULT false,
  reject_reason TEXT,
  ai_scores JSONB,
  overall_score FLOAT NOT NULL DEFAULT 0,
  eyes_all_open BOOLEAN NOT NULL DEFAULT true,
  ai_critique TEXT,
  cull_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (cull_status IN ('PENDING','KEEP_BEST','ALTERNATIVE','REJECTED')),
  synced_file_id TEXT,
  is_synced_to_gdrive BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (project_id, gdrive_file_id)
);

CREATE INDEX photos_project_captured_idx ON photos (project_id, captured_at);
CREATE INDEX photos_project_status_idx ON photos (project_id, cull_status);

-- RLS: user hanya akses data miliknya. Worker pakai service_role (bypass RLS).
ALTER TABLE user_gdrive_tokens ENABLE ROW LEVEL SECURITY;  -- tanpa policy = hanya service_role
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_owner ON projects FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY clusters_owner ON photo_clusters FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY photos_owner ON photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE projects, photos;
