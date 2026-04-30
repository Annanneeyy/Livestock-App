-- ========================================================
-- LIVESTOCK APP - COMPLETE DATABASE SCHEMA
-- Generated: 2026-04-07
-- This file contains the complete setup for:
-- 1. Core Tables (Profiles, Livestock, Chats, etc.)
-- 2. Row Level Security (RLS) Policies
-- 3. Storage Buckets & Policies
-- 4. Triggers & Functions (Auto-profile, Notifications)
-- 5. Realtime Configuration
-- ========================================================

-- ============================================
-- PROFILES (linked to auth.users)
-- ============================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
  gender          TEXT,
  birth_date      DATE,
  avatar_url      TEXT,
  purok           TEXT,
  barangay        TEXT,
  municipality    TEXT DEFAULT 'Quezon',
  zip_code        TEXT DEFAULT '8715',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LIVESTOCK (marketplace listings)
-- ============================================
CREATE TABLE livestock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Baktin', 'Lechonon', 'Lapaon')),
  price           DECIMAL(10,2) NOT NULL,
  description     TEXT,
  contact         TEXT,
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  location_text   TEXT,
  is_available    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LIVESTOCK IMAGES
-- ============================================
CREATE TABLE livestock_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id    UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id    UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CHATS
-- ============================================
CREATE TABLE chats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_sender_id  UUID REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  content         TEXT,
  posted_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- HEALTH GUIDELINES
-- ============================================
CREATE TABLE health_guidelines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease         TEXT NOT NULL,
  symptoms        TEXT,
  treatment       TEXT,
  prevention      TEXT,
  posted_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FEEDING INFO
-- ============================================
CREATE TABLE feeding_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Baktin', 'Anayon', 'Lapaon', 'Lechonon')),
  description     TEXT,
  feed_type       TEXT,
  feeding_schedule    TEXT,
  nutritional_requirement TEXT,
  feeding_best_practices  TEXT,
  supplements_additives   TEXT,
  posted_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('new_post', 'announcement', 'health_guideline', 'feeding_info', 'chat')),
  title           TEXT NOT NULL,
  message         TEXT,
  is_read         BOOLEAN DEFAULT false,
  related_id      UUID,
  related_type    TEXT CHECK (related_type IN ('livestock', 'announcement', 'guideline', 'feeding', 'chat')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_livestock_seller ON livestock(seller_id);
CREATE INDEX idx_livestock_category ON livestock(category);
CREATE INDEX idx_livestock_available ON livestock(is_available);
CREATE INDEX idx_livestock_images_livestock ON livestock_images(livestock_id);
CREATE INDEX idx_comments_livestock ON comments(livestock_id);
CREATE INDEX idx_chats_participant_1 ON chats(participant_1);
CREATE INDEX idx_chats_participant_2 ON chats(participant_2);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_feeding_info_category ON feeding_info(category);
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- LIVESTOCK
-- ============================================
CREATE POLICY "livestock_select" ON livestock
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "livestock_insert" ON livestock
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "livestock_update" ON livestock
  FOR UPDATE USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "livestock_delete" ON livestock
  FOR DELETE USING (auth.uid() = seller_id);

-- ============================================
-- LIVESTOCK IMAGES
-- ============================================
CREATE POLICY "livestock_images_select" ON livestock_images
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "livestock_images_insert" ON livestock_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM livestock
      WHERE livestock.id = livestock_id
      AND livestock.seller_id = auth.uid()
    )
  );

CREATE POLICY "livestock_images_delete" ON livestock_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM livestock
      WHERE livestock.id = livestock_id
      AND livestock.seller_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CHATS
-- ============================================
CREATE POLICY "chats_select" ON chats
  FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

CREATE POLICY "chats_insert" ON chats
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

CREATE POLICY "chats_update" ON chats
  FOR UPDATE USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- ============================================
-- MESSAGES
-- ============================================
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  );

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "announcements_update" ON announcements
  FOR UPDATE USING (
    auth.uid() = posted_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "announcements_delete" ON announcements
  FOR DELETE USING (
    auth.uid() = posted_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- HEALTH GUIDELINES
-- ============================================
CREATE POLICY "health_guidelines_select" ON health_guidelines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "health_guidelines_insert" ON health_guidelines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "health_guidelines_update" ON health_guidelines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "health_guidelines_delete" ON health_guidelines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FEEDING INFO
-- ============================================
CREATE POLICY "feeding_info_select" ON feeding_info
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "feeding_info_insert" ON feeding_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "feeding_info_update" ON feeding_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "feeding_info_delete" ON feeding_info
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
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
-- Automatically create a profile row when a new user signs up.
-- The user's metadata (first_name, last_name, etc.) is passed during signUp()
-- and stored in auth.users.raw_user_meta_data.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, gender, birth_date, purok, barangay, municipality, zip_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
    NEW.raw_user_meta_data->>'gender',
    CASE
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'birth_date')::date
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'purok',
    NEW.raw_user_meta_data->>'barangay',
    COALESCE(NEW.raw_user_meta_data->>'municipality', 'Quezon'),
    COALESCE(NEW.raw_user_meta_data->>'zip_code', '8715')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Add is_read to messages
ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT false;

-- Create a function to update the chat's last message info
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET 
    last_message = NEW.text,
    last_sender_id = NEW.sender_id,
    last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat info on new message
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();
-- Enable Realtime for the relevant tables
begin;
  -- remove any existing configuration
  drop publication if exists supabase_realtime;
  
  -- create new publication
  create publication supabase_realtime for table chats, messages, notifications;
commit;

-- Ensure replica identity is set to FULL for accurate real-time updates
ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
-- Allow participants to mark messages as read
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())
    )
  );
-- ============================================
-- NOTIFICATION TRIGGER FUNCTIONS
-- ============================================

-- 1. Notify all farmers about new livestock posts
CREATE OR REPLACE FUNCTION public.handle_new_livestock_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'new_post', 
    'New Livestock Available', 
    NEW.name || ' is now available for â‚±' || NEW.price, 
    NEW.id, 
    'livestock'
  FROM public.profiles p
  WHERE p.id != NEW.seller_id; -- Don't notify the seller
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Notify all users about new announcements
CREATE OR REPLACE FUNCTION public.handle_new_announcement_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'announcement', 
    'New Announcement: ' || NEW.title, 
    NEW.description, 
    NEW.id, 
    'announcement'
  FROM public.profiles p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Notify all users about new health guidelines
CREATE OR REPLACE FUNCTION public.handle_new_guideline_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'health_guideline', 
    'New Health Guideline: ' || NEW.disease, 
    'Learn how to treat and prevent ' || NEW.disease, 
    NEW.id, 
    'guideline'
  FROM public.profiles p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notify all users about new feeding info
CREATE OR REPLACE FUNCTION public.handle_new_feeding_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'feeding_info', 
    'New Feeding Guide: ' || NEW.name, 
    'Check out the latest feeding best practices for ' || NEW.category, 
    NEW.id, 
    'feeding'
  FROM public.profiles p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Notify recipient about new chat message
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS trigger AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get the other participant in the chat
  SELECT 
    CASE 
      WHEN c.participant_1 = NEW.sender_id THEN c.participant_2 
      ELSE c.participant_1 
    END INTO recipient_id
  FROM public.chats c
  WHERE c.id = NEW.chat_id;

  -- Get sender name
  SELECT first_name || ' ' || last_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  VALUES (
    recipient_id, 
    'chat', 
    'New Message from ' || sender_name, 
    CASE 
      WHEN NEW.text = '' OR NEW.text IS NULL THEN 'Sent a photo'
      ELSE NEW.text 
    END, 
    NEW.chat_id, 
    'chat'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for livestock
DROP TRIGGER IF EXISTS on_livestock_created ON public.livestock;
CREATE TRIGGER on_livestock_created
  AFTER INSERT ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_livestock_notification();

-- Trigger for announcements
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_announcement_notification();

-- Trigger for health guidelines
DROP TRIGGER IF EXISTS on_guideline_created ON public.health_guidelines;
CREATE TRIGGER on_guideline_created
  AFTER INSERT ON public.health_guidelines
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_guideline_notification();

-- Trigger for feeding info
DROP TRIGGER IF EXISTS on_feeding_created ON public.feeding_info;
CREATE TRIGGER on_feeding_created
  AFTER INSERT ON public.feeding_info
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_feeding_notification();

-- Trigger for messages
DROP TRIGGER IF EXISTS on_message_created_notification ON public.messages;
CREATE TRIGGER on_message_created_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();
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
