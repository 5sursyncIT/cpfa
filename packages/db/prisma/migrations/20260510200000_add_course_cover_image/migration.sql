-- Course cover image — displayed on public course cards and managed from
-- the backoffice course form. Stores a private Media storage key resolved
-- through /api/media/[...key].

ALTER TABLE "Course"
  ADD COLUMN "coverImageKey" TEXT;
