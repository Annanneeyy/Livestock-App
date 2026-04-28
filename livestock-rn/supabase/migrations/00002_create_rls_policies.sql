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
