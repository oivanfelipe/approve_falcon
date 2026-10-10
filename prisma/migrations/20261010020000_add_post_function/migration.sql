-- "Função" from the content-plan spreadsheet — the post's role in the
-- strategy (e.g. "Institucional", "Lançamento do perfil"), shown to the
-- client alongside Tema/Formato/Objetivo during copy approval.
ALTER TABLE "falcon"."Delivery" ADD COLUMN "postFunction" TEXT;
