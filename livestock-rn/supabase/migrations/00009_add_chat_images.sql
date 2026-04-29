-- Add image_url to messages
ALTER TABLE public.messages ADD COLUMN image_url TEXT;

-- Update the storage policies for chat images
-- Assuming we have a bucket named 'chat-images'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for chat-images bucket
CREATE POLICY "chat_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "chat_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
