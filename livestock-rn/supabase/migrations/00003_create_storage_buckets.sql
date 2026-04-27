-- Run these in the Supabase SQL Editor (storage schema requires superuser)

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('livestock-images', 'livestock-images', true);

-- AVATARS bucket policies
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- LIVESTOCK-IMAGES bucket policies
CREATE POLICY "livestock_images_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'livestock-images');

CREATE POLICY "livestock_images_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'livestock-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "livestock_images_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'livestock-images'
    AND auth.uid() IS NOT NULL
  );
