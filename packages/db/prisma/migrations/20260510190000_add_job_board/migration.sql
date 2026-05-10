-- Job board public (§3.2 du doc Directeur). Les offres sont créées en DRAFT
-- via le form public puis modérées par un admin (cms:write) avant publication.
-- Les candidatures déclenchent un email au recruteur (worker email).

CREATE TYPE "JobType" AS ENUM ('CDI', 'CDD', 'STAGE', 'FREELANCE', 'ALTERNANCE');
CREATE TYPE "JobLevel" AS ENUM ('JUNIOR', 'INTERMEDIAIRE', 'SENIOR', 'EXECUTIVE');
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'REJECTED');
CREATE TYPE "JobApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'REJECTED', 'ACCEPTED');

CREATE TABLE "JobPosting" (
  "id"             TEXT PRIMARY KEY,
  "recruiterId"    TEXT,
  "recruiterEmail" TEXT NOT NULL,
  "companyName"    TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT NOT NULL,
  "profile"        TEXT NOT NULL,
  "contact"        TEXT NOT NULL,
  "fileSheetKey"   TEXT,
  "type"           "JobType"   NOT NULL DEFAULT 'CDI',
  "level"          "JobLevel"  NOT NULL DEFAULT 'JUNIOR',
  "location"       TEXT,
  "urgent"         BOOLEAN     NOT NULL DEFAULT FALSE,
  "status"         "JobStatus" NOT NULL DEFAULT 'DRAFT',
  "closesAt"       TIMESTAMP(3),
  "publishedAt"    TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "JobPosting_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "JobPosting_status_closesAt_idx" ON "JobPosting" ("status", "closesAt");

CREATE TABLE "JobApplication" (
  "id"              TEXT PRIMARY KEY,
  "jobPostingId"    TEXT NOT NULL,
  "candidateUserId" TEXT,
  "firstName"       TEXT NOT NULL,
  "lastName"        TEXT NOT NULL,
  "email"           TEXT NOT NULL,
  "phone"           TEXT,
  "motivation"      TEXT NOT NULL,
  "cvKey"           TEXT NOT NULL,
  "status"          "JobApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "JobApplication_jobPostingId_fkey"
    FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "JobApplication_candidateUserId_fkey"
    FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "JobApplication_jobPostingId_idx" ON "JobApplication" ("jobPostingId");
