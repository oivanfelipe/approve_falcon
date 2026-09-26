-- CreateEnum
CREATE TYPE "DeliverySource" AS ENUM ('FILE', 'DRIVE_LINK');

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "sourceType" "DeliverySource" NOT NULL DEFAULT 'FILE';
ALTER TABLE "Delivery" ADD COLUMN     "driveUrl" TEXT;
ALTER TABLE "Delivery" ALTER COLUMN "filePath" DROP NOT NULL;
ALTER TABLE "Delivery" ALTER COLUMN "fileSize" DROP NOT NULL;
ALTER TABLE "Delivery" ALTER COLUMN "mimeType" DROP NOT NULL;
