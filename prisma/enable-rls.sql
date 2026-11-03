-- Turns on row-level security for every table in the public schema.
--
-- The app reads and writes these tables only through Prisma, which connects
-- as the table owner and is not affected by RLS. Supabase also exposes the
-- public schema through its REST API; with RLS on and no policies, that API
-- returns nothing for these tables.
--
-- Run in the Supabase SQL editor. Safe to run again: re-run it after
-- `prisma db push` adds a new table.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
