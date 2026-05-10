-- Site-wide key/value content settings. The application layer validates the
-- shape of each value via per-key zod schemas; the DB stores raw JSON.

CREATE TABLE "SiteSetting" (
  "key"          TEXT PRIMARY KEY,
  "value"        JSONB NOT NULL,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedById"  TEXT,

  CONSTRAINT "SiteSetting_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
