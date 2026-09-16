-- TutorNest Node backend durable state store.
-- This migration is additive and intentionally never drops or truncates data.
CREATE TABLE IF NOT EXISTS tutornest_store (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
