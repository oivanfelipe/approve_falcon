-- Content calendar: a scheduled publish date per delivery, and a public
-- shareable token per project so a client can view every scheduled piece
-- for that project in one calendar link.
ALTER TABLE "falcon"."Delivery" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "falcon"."Project" ADD COLUMN "calendarToken" TEXT;

CREATE UNIQUE INDEX "Project_calendarToken_key" ON "falcon"."Project"("calendarToken");
