-- Migration: Add avatar_url to profiles + avatars storage bucket
-- Run after 013_drop_is_admin_column.sql

-- 1. Add avatar_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies for avatars bucket
DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read for avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read for avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;

  -- Authenticated upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload for avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated upload for avatars"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;

  -- Anon upload (consistent with other buckets)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anon upload for avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anon upload for avatars"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'anon');
  END IF;

  -- Authenticated delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete for avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated delete for avatars"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;

  -- Anon delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anon delete for avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anon delete for avatars"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'avatars' AND auth.role() = 'anon');
  END IF;
END $$;
