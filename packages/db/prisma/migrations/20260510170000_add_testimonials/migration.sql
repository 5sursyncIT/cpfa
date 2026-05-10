-- Témoignages multi-parties (étudiants, enseignants, professionnels, partenaires)
-- pour la home, /enseigner-au-cpfa et /espaces-apprenants. Validation en zod
-- côté router.

CREATE TYPE "TestimonialScope" AS ENUM ('STUDENT', 'TEACHER', 'PROFESSIONAL', 'PARTNER');

CREATE TABLE "Testimonial" (
  "id"             TEXT PRIMARY KEY,
  "scope"          "TestimonialScope" NOT NULL,
  "authorName"     TEXT NOT NULL,
  "authorRole"     TEXT,
  "authorPhotoKey" TEXT,
  "quote"          TEXT NOT NULL,
  "locale"         TEXT NOT NULL DEFAULT 'fr',
  "published"      BOOLEAN NOT NULL DEFAULT FALSE,
  "displayOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Testimonial_pub_locale_scope_order_idx"
  ON "Testimonial" ("published", "locale", "scope", "displayOrder");
