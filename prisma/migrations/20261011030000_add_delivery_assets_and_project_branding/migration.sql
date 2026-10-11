-- Extra carousel slides beyond a delivery's primary file/link, and
-- per-project client branding (logo + colors) used in post mockups.

CREATE TABLE "falcon"."DeliveryAsset" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sourceType" "falcon"."DeliverySource" NOT NULL DEFAULT 'FILE',
    "filePath" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "driveUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeliveryAsset_deliveryId_idx" ON "falcon"."DeliveryAsset"("deliveryId");

ALTER TABLE "falcon"."DeliveryAsset" ADD CONSTRAINT "DeliveryAsset_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "falcon"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "falcon"."Project" ADD COLUMN "clientLogoUrl" TEXT;
ALTER TABLE "falcon"."Project" ADD COLUMN "primaryColor" TEXT;
ALTER TABLE "falcon"."Project" ADD COLUMN "secondaryColor" TEXT;
