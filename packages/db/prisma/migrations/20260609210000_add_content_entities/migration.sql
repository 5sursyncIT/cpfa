-- First-class editable content entities for the homepage / about page, moving
-- key figures, partners and governance members out of JSON SiteSetting blobs
-- into managed tables with admin CRUD. Validation stays in the tRPC routers.

CREATE TABLE "KeyFigure" (
  "id"           TEXT PRIMARY KEY,
  "section"      TEXT NOT NULL DEFAULT 'HOME',
  "locale"       TEXT NOT NULL DEFAULT 'fr',
  "value"        TEXT NOT NULL,
  "sup"          TEXT NOT NULL DEFAULT '',
  "label"        TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "KeyFigure_section_locale_order_idx"
  ON "KeyFigure" ("section", "locale", "displayOrder");

CREATE TABLE "Partner" (
  "id"           TEXT PRIMARY KEY,
  "locale"       TEXT NOT NULL DEFAULT 'fr',
  "name"         TEXT NOT NULL,
  "logoKey"      TEXT,
  "url"          TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Partner_locale_order_idx"
  ON "Partner" ("locale", "displayOrder");

CREATE TABLE "GovernanceMember" (
  "id"           TEXT PRIMARY KEY,
  "locale"       TEXT NOT NULL DEFAULT 'fr',
  "role"         TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "note"         TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "GovernanceMember_locale_order_idx"
  ON "GovernanceMember" ("locale", "displayOrder");

-- Seed the FR rows with the content previously served from the SiteSetting
-- defaults, so the live site keeps its current content and editors land on a
-- populated list rather than an empty one. EN falls back to FR until localised.

INSERT INTO "KeyFigure" ("id", "section", "locale", "value", "sup", "label", "displayOrder") VALUES
  (gen_random_uuid()::text, 'HOME', 'fr', '30',    'ans', 'Au service du secteur',          0),
  (gen_random_uuid()::text, 'HOME', 'fr', '4 200', '+',   'Diplômés actifs',                1),
  (gen_random_uuid()::text, 'HOME', 'fr', '14',    '',    'Pays d''Afrique représentés',    2),
  (gen_random_uuid()::text, 'HOME', 'fr', '96',    '%',   'Taux d''insertion 12 mois',      3),
  (gen_random_uuid()::text, 'ABOUT', 'fr', '1996', '',    'Année de création',              0),
  (gen_random_uuid()::text, 'ABOUT', 'fr', '4 200','+',   'Diplômés',                       1),
  (gen_random_uuid()::text, 'ABOUT', 'fr', '86',   '',    'Intervenants experts',           2),
  (gen_random_uuid()::text, 'ABOUT', 'fr', '14',   '',    'Pays africains',                 3);

INSERT INTO "Partner" ("id", "locale", "name", "url", "displayOrder") VALUES
  (gen_random_uuid()::text, 'fr', 'IIA Yaoundé',  'https://iiayaounde.com/',              0),
  (gen_random_uuid()::text, 'fr', 'DNA',          'http://www.dna.finances.gouv.sn/',     1),
  (gen_random_uuid()::text, 'fr', 'FSSA',         'https://fssa.sn/',                     2),
  (gen_random_uuid()::text, 'fr', 'PF2E',         NULL,                                   3),
  (gen_random_uuid()::text, 'fr', 'PNUD',         NULL,                                   4),
  (gen_random_uuid()::text, 'fr', 'Cabinet CASAI',NULL,                                   5);

INSERT INTO "GovernanceMember" ("id", "locale", "role", "name", "note", "displayOrder") VALUES
  (gen_random_uuid()::text, 'fr', 'Direction générale', 'El Hadji Cheikhou Oumar SECK', 'Directeur — CPFA', 0);
