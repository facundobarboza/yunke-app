-- =============================================================================
-- FIX: Enable RLS on all public tables that don't have it
-- =============================================================================
-- Run this in the Supabase SQL Editor to fix the security alert.
-- It finds all tables in the public schema without RLS and enables it.
-- =============================================================================

-- Enable RLS on any table that doesn't have it
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = r.schemaname
        AND c.relname = r.tablename
        AND c.relrowsecurity = true
    ) THEN
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
      RAISE NOTICE 'Enabled RLS on %.%', r.schemaname, r.tablename;
    END IF;
  END LOOP;
END $$;

-- Also: make sure profiles has INSERT policy for the trigger
-- (handle_new_user runs as SECURITY DEFINER so it bypasses RLS, but let's be safe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Profiles insert for new users' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Profiles insert for new users" ON profiles
      FOR INSERT WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
