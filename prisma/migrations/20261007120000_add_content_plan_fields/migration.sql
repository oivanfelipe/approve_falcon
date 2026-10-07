-- Lets a Delivery exist as text-only content (no creative yet), matching the
-- agency's content-plan spreadsheet: approve the plan fields + caption first,
-- attach the creative file/link once it's ready.
ALTER TABLE "falcon"."Delivery" ALTER COLUMN "fileName" DROP NOT NULL;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "planNumber" TEXT;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "theme" TEXT;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "format" TEXT;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "product" TEXT;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "objective" TEXT;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "artCopy" TEXT;
