-- Short, auto-generated client slug (replaces the old single
-- account-wide branded-link slug from FreelancerSettings).
ALTER TABLE "falcon"."Project" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Project_slug_key" ON "falcon"."Project"("slug");
