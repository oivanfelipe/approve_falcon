-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_planId_fkey";

-- DropTable
DROP TABLE IF EXISTS "BillingEvent";
DROP TABLE IF EXISTS "Subscription";
DROP TABLE IF EXISTS "Plan";

-- DropEnum
DROP TYPE IF EXISTS "SubscriptionStatus";
