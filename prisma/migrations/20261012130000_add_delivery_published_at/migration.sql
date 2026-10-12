-- Set once the team confirms a fully-approved post actually went live —
-- moves it from the working "Edição" list to the "Publicados" tab.
ALTER TABLE "falcon"."Delivery" ADD COLUMN "publishedAt" TIMESTAMP(3);
