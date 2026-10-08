CREATE TABLE IF NOT EXISTS reader_books (
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  progress_json TEXT NOT NULL DEFAULT '0',
  progress_updated_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  file_key TEXT,
  file_sha256 TEXT,
  file_size INTEGER,
  file_type TEXT,
  PRIMARY KEY (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS reader_books_by_user_updated
  ON reader_books (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS reader_book_deletions (
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  deleted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, book_id)
);
