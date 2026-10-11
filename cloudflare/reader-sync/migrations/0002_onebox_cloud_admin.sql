CREATE TABLE IF NOT EXISTS onebox_users (
  user_id TEXT PRIMARY KEY,
  github_login TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  migrated_at INTEGER,
  migration_started_at INTEGER,
  migration_consent_at INTEGER
);

CREATE INDEX IF NOT EXISTS onebox_users_by_login ON onebox_users (github_login COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS onebox_users_by_status ON onebox_users (status, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS onebox_user_data (
  user_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  PRIMARY KEY (user_id, data_key)
);

CREATE INDEX IF NOT EXISTS onebox_user_data_by_user ON onebox_user_data (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS onebox_user_files (
  user_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, file_id)
);

CREATE INDEX IF NOT EXISTS onebox_user_files_by_user ON onebox_user_files (user_id, data_key);

CREATE TABLE IF NOT EXISTS onebox_file_tombstones (
  user_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  deleted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, file_id)
);

CREATE TABLE IF NOT EXISTS onebox_recycle_bin (
  recycle_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  deleted_at INTEGER NOT NULL,
  purge_at INTEGER NOT NULL,
  deleted_by TEXT NOT NULL,
  restored_at INTEGER
);

CREATE INDEX IF NOT EXISTS onebox_recycle_bin_by_purge ON onebox_recycle_bin (purge_at, restored_at);
CREATE INDEX IF NOT EXISTS onebox_recycle_bin_by_user ON onebox_recycle_bin (user_id, deleted_at DESC);

CREATE TABLE IF NOT EXISTS onebox_admins (
  github_id TEXT PRIMARY KEY,
  github_login TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  grants_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  invited_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS onebox_admins_by_role ON onebox_admins (role, status);

CREATE TABLE IF NOT EXISTS onebox_module_flags (
  module_key TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS onebox_ads (
  ad_id TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS onebox_ads_by_status_time ON onebox_ads (status, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS onebox_announcements (
  announcement_id TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  target_users_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS onebox_announcements_by_status_time ON onebox_announcements (status, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS onebox_announcement_reads (
  announcement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS onebox_audit_log (
  audit_id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_login TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS onebox_audit_log_by_time ON onebox_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS onebox_audit_log_by_target ON onebox_audit_log (target_type, target_id, created_at DESC);

INSERT OR IGNORE INTO onebox_module_flags (module_key, enabled, updated_at, updated_by) VALUES
  ('home', 1, 0, 'system'), ('navigation', 1, 0, 'system'), ('reading', 1, 0, 'system'),
  ('calendar', 1, 0, 'system'), ('weather', 1, 0, 'system'), ('calculator', 1, 0, 'system'),
  ('conversion', 1, 0, 'system'), ('translation', 1, 0, 'system'), ('messages', 1, 0, 'system'),
  ('ticket-wallet', 1, 0, 'system'), ('settings', 1, 0, 'system'), ('developer', 1, 0, 'system');
