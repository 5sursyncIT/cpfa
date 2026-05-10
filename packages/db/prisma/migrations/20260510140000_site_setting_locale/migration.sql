-- Make SiteSetting locale-aware. Existing rows inherit locale='fr' (defaultLocale).
-- Composite PK (key, locale) lets editors store per-language values.

ALTER TABLE "SiteSetting" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr';

ALTER TABLE "SiteSetting" DROP CONSTRAINT "SiteSetting_pkey";
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key", "locale");
