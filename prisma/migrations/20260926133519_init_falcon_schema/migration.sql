-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "falcon";

-- CreateEnum
CREATE TYPE "falcon"."DeliveryStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "falcon"."DeliverySource" AS ENUM ('FILE', 'DRIVE_LINK');

-- CreateEnum
CREATE TYPE "falcon"."AuthorType" AS ENUM ('CLIENT', 'FREELANCER');

-- CreateTable
CREATE TABLE "falcon"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "falcon"."Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."Delivery" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT,
    "sourceType" "falcon"."DeliverySource" NOT NULL DEFAULT 'FILE',
    "filePath" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "driveUrl" TEXT,
    "reviewToken" TEXT NOT NULL,
    "status" "falcon"."DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "requiresEmail" BOOLEAN NOT NULL DEFAULT false,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."ChatNotificationState" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "hasPendingNotification" BOOLEAN NOT NULL DEFAULT false,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatNotificationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."Comment" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorType" "falcon"."AuthorType" NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "xPosition" DOUBLE PRECISION,
    "yPosition" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."View" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."Approval" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."FreelancerSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#E10600',
    "secondaryColor" TEXT NOT NULL DEFAULT '#000000',
    "backgroundColor" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelancerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."GuestUpload" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "reviewToken" TEXT NOT NULL,
    "claimToken" TEXT NOT NULL,
    "status" "falcon"."DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."GuestComment" (
    "id" TEXT NOT NULL,
    "guestUploadId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorType" "falcon"."AuthorType" NOT NULL DEFAULT 'CLIENT',
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "xPosition" DOUBLE PRECISION,
    "yPosition" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "falcon"."GuestView" (
    "id" TEXT NOT NULL,
    "guestUploadId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "falcon"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "falcon"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "falcon"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "falcon"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_reviewToken_key" ON "falcon"."Delivery"("reviewToken");

-- CreateIndex
CREATE UNIQUE INDEX "ChatNotificationState_deliveryId_key" ON "falcon"."ChatNotificationState"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_deliveryId_key" ON "falcon"."Approval"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "FreelancerSettings_userId_key" ON "falcon"."FreelancerSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FreelancerSettings_slug_key" ON "falcon"."FreelancerSettings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GuestUpload_reviewToken_key" ON "falcon"."GuestUpload"("reviewToken");

-- CreateIndex
CREATE UNIQUE INDEX "GuestUpload_claimToken_key" ON "falcon"."GuestUpload"("claimToken");

-- AddForeignKey
ALTER TABLE "falcon"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."Delivery" ADD CONSTRAINT "Delivery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "falcon"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."ChatNotificationState" ADD CONSTRAINT "ChatNotificationState_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "falcon"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."Comment" ADD CONSTRAINT "Comment_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "falcon"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "falcon"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."View" ADD CONSTRAINT "View_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "falcon"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."Approval" ADD CONSTRAINT "Approval_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "falcon"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."FreelancerSettings" ADD CONSTRAINT "FreelancerSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."GuestComment" ADD CONSTRAINT "GuestComment_guestUploadId_fkey" FOREIGN KEY ("guestUploadId") REFERENCES "falcon"."GuestUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."GuestComment" ADD CONSTRAINT "GuestComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "falcon"."GuestComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "falcon"."GuestView" ADD CONSTRAINT "GuestView_guestUploadId_fkey" FOREIGN KEY ("guestUploadId") REFERENCES "falcon"."GuestUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

