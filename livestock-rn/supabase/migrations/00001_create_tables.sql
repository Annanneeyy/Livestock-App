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
