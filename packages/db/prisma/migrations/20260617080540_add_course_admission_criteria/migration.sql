-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "admissionCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "GovernanceMember" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "JobPosting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "KeyFigure" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Partner" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SiteSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Testimonial" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TrainerProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "GovernanceMember_locale_order_idx" RENAME TO "GovernanceMember_locale_displayOrder_idx";

-- RenameIndex
ALTER INDEX "KeyFigure_section_locale_order_idx" RENAME TO "KeyFigure_section_locale_displayOrder_idx";

-- RenameIndex
ALTER INDEX "Partner_locale_order_idx" RENAME TO "Partner_locale_displayOrder_idx";

-- RenameIndex
ALTER INDEX "Testimonial_pub_locale_scope_order_idx" RENAME TO "Testimonial_published_locale_scope_displayOrder_idx";
