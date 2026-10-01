-- Two-stage client approval: the copy/caption must be approved before the
-- creative itself is revealed to the client. Existing deliveries get
-- copyStatus = APPROVED (backfilled below) so they keep showing their
-- creative immediately instead of suddenly being gated behind an empty copy.
ALTER TABLE "falcon"."Delivery" ADD COLUMN "copyText" TEXT;
ALTER TABLE "falcon"."Delivery" ADD COLUMN "copyStatus" "falcon"."DeliveryStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "falcon"."Delivery" SET "copyStatus" = 'APPROVED' WHERE "copyText" IS NULL;
