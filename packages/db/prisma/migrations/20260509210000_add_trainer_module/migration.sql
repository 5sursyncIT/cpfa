-- Trainer module (§4.6 of docs/projet.md):
--   * Replace TrainerProfile.approved (bool) with status (PENDING/APPROVED/REJECTED)
--   * Add candidacy/review fields and a back-pointer to the reviewing admin
--   * Wire CourseSession to a trainer (User)
--   * New TrainerResource for pedagogical materials shared across approved trainers

CREATE TYPE "TrainerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Pre-existing rows (none in prod yet, but be additive-safe): map approved=true → APPROVED.
ALTER TABLE "TrainerProfile"
  ADD COLUMN "phone"           TEXT,
  ADD COLUMN "experienceYears" INTEGER,
  ADD COLUMN "status"          "TrainerStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "submittedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt"      TIMESTAMP(3),
  ADD COLUMN "reviewedById"    TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "TrainerProfile" SET "status" = 'APPROVED' WHERE "approved" = TRUE;
ALTER TABLE "TrainerProfile" DROP COLUMN "approved";

CREATE INDEX "TrainerProfile_status_idx" ON "TrainerProfile" ("status");

ALTER TABLE "TrainerProfile"
  ADD CONSTRAINT "TrainerProfile_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CourseSession ← User (trainer)
ALTER TABLE "CourseSession" ADD COLUMN "trainerId" TEXT;
ALTER TABLE "CourseSession"
  ADD CONSTRAINT "CourseSession_trainerId_fkey"
  FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "CourseSession_trainerId_startsAt_idx" ON "CourseSession" ("trainerId", "startsAt");

-- TrainerResource — shared pedagogical materials
CREATE TABLE "TrainerResource" (
  "id"            TEXT PRIMARY KEY,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "storageKey"    TEXT NOT NULL,
  "mimeType"      TEXT NOT NULL,
  "sizeBytes"     INTEGER NOT NULL,
  "courseId"      TEXT,
  "moduleId"      TEXT,
  "uploadedById"  TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TrainerResource_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TrainerResource_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "TrainerResource_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "TrainerResource_courseId_idx" ON "TrainerResource" ("courseId");
CREATE INDEX "TrainerResource_createdAt_idx" ON "TrainerResource" ("createdAt");
