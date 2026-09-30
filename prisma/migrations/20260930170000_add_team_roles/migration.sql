-- Team access: an account owner can invite teammates (their own login) with
-- an ADMIN or EDITOR role. All team members get access to every project
-- under the owner's account; only ADMIN can manage the team itself. Public
-- client/guest access stays exactly as-is (no login, approve-only).
CREATE TYPE "falcon"."TeamRole" AS ENUM ('ADMIN', 'EDITOR');
CREATE TYPE "falcon"."TeamInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

CREATE TABLE "falcon"."TeamMembership" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "falcon"."TeamRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamMembership_ownerId_userId_key" ON "falcon"."TeamMembership"("ownerId", "userId");

ALTER TABLE "falcon"."TeamMembership" ADD CONSTRAINT "TeamMembership_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "falcon"."TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "falcon"."TeamInvite" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "falcon"."TeamRole" NOT NULL DEFAULT 'EDITOR',
    "token" TEXT NOT NULL,
    "status" "falcon"."TeamInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamInvite_token_key" ON "falcon"."TeamInvite"("token");
CREATE UNIQUE INDEX "TeamInvite_ownerId_email_key" ON "falcon"."TeamInvite"("ownerId", "email");

ALTER TABLE "falcon"."TeamInvite" ADD CONSTRAINT "TeamInvite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "falcon"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "falcon"."TeamMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."TeamInvite" ENABLE ROW LEVEL SECURITY;
