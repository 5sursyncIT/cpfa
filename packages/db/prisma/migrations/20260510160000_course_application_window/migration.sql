-- Course application window — used to gate inscriptions for diplômantes
-- (DTA, BTS) outside concours periods. Both columns NULL = form always open.

ALTER TABLE "Course"
  ADD COLUMN "applicationsOpenAt"  TIMESTAMP(3),
  ADD COLUMN "applicationsCloseAt" TIMESTAMP(3);
