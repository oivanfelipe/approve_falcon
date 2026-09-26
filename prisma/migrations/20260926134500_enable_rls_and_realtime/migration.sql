-- Enable Row Level Security on every table in the falcon schema.
-- Server-side access (Prisma via DATABASE_URL/DIRECT_URL) uses a role that
-- bypasses RLS -- this only restricts the anon/authenticated roles used by
-- the browser-side Supabase client (lib/supabase/browser.ts).
ALTER TABLE "falcon"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."Delivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."ChatNotificationState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."View" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."Approval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."FreelancerSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."GuestUpload" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."GuestComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "falcon"."GuestView" ENABLE ROW LEVEL SECURITY;

-- The browser-side Supabase client (anon key) only ever needs read access to
-- these three tables, to receive Realtime "postgres_changes" events that
-- drive the live comments/status UI. All writes go through server-side
-- Prisma (features/*/actions/*.ts, app/api/**/route.ts), which bypasses RLS.
CREATE POLICY "anon_select_for_realtime" ON "falcon"."Comment"
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_for_realtime" ON "falcon"."Delivery"
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_for_realtime" ON "falcon"."View"
    FOR SELECT TO anon, authenticated USING (true);

-- Register these tables with Supabase Realtime so postgres_changes events
-- are actually published to subscribers.
ALTER PUBLICATION supabase_realtime ADD TABLE "falcon"."Comment";
ALTER PUBLICATION supabase_realtime ADD TABLE "falcon"."Delivery";
ALTER PUBLICATION supabase_realtime ADD TABLE "falcon"."View";

-- Lock down Prisma's own internal migrations tracking table too.
ALTER TABLE "falcon"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
