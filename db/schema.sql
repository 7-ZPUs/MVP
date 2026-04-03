CREATE TABLE
  IF NOT EXISTS dip (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    integrity_status TEXT NOT NULL DEFAULT 'UNKNOWN'
  );

CREATE INDEX IF NOT EXISTS idx_dip_integrity_status ON dip (integrity_status);

CREATE TABLE
  IF NOT EXISTS document_class (
    id INTEGER PRIMARY KEY,
    dip_id INTEGER NOT NULL REFERENCES dip (id) ON DELETE CASCADE,
    uuid TEXT NOT NULL UNIQUE,
    dipUuid TEXT NOT NULL,
    integrity_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    name TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_document_class_dip_id ON document_class (dip_id);

CREATE INDEX IF NOT EXISTS idx_document_class_integrity_status ON document_class (integrity_status);

CREATE TABLE
  IF NOT EXISTS process (
    id INTEGER PRIMARY KEY,
    document_class_id INTEGER NOT NULL REFERENCES document_class (id) ON DELETE CASCADE,
    uuid TEXT NOT NULL UNIQUE,
    integrity_status TEXT NOT NULL DEFAULT 'UNKNOWN'
  );

CREATE TABLE
  IF NOT EXISTS process_metadata (
    id INTEGER PRIMARY KEY,
    process_id INTEGER NOT NULL REFERENCES process (id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES process_metadata (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'string'
  );

CREATE INDEX IF NOT EXISTS idx_process_document_class_id ON process (document_class_id);

CREATE INDEX IF NOT EXISTS idx_process_integrity_status ON process (integrity_status);

CREATE INDEX IF NOT EXISTS idx_process_metadata_process_id ON process_metadata (process_id);

CREATE TABLE
  IF NOT EXISTS document (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    integrity_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    process_id INTEGER NOT NULL REFERENCES process (id) ON DELETE CASCADE,
    metadata TEXT NOT NULL DEFAULT '{}'
  );

CREATE TABLE
  IF NOT EXISTS document_metadata (
    id INTEGER PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES document (id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES document_metadata (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'string'
  );

CREATE INDEX IF NOT EXISTS idx_document_process_id ON document (process_id);

CREATE INDEX IF NOT EXISTS idx_document_integrity_status ON document (integrity_status);

CREATE INDEX IF NOT EXISTS idx_document_metadata_document_id ON document_metadata (document_id);

CREATE TABLE
  IF NOT EXISTS file (
    id INTEGER PRIMARY KEY,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    hash TEXT NOT NULL,
    integrity_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    is_main INTEGER NOT NULL DEFAULT 0,
    document_id INTEGER NOT NULL REFERENCES document (id) ON DELETE CASCADE,
    UNIQUE (document_id, path)
  );

CREATE INDEX IF NOT EXISTS idx_file_document_id ON file (document_id);

CREATE INDEX IF NOT EXISTS idx_file_integrity_status ON file (integrity_status);

CREATE INDEX IF NOT EXISTS idx_file_document_id_is_main_id ON file (document_id, is_main DESC, id);