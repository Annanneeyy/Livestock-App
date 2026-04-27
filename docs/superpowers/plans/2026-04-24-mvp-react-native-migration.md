# MVP React Native + Supabase Migration — Implementation Plan (Jayson)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Livestock App MVP on React Native (Expo) + Supabase, covering auth, marketplace, geospatial map, feeding info, health guidelines, and data migration from Firebase.

**Architecture:** Expo managed workflow with file-based routing (Expo Router). All data lives in Supabase PostgreSQL with Row Level Security. Images stored in Supabase Storage buckets. Supabase JS client for all backend operations. NativeWind for styling.

**Tech Stack:** Expo SDK 52+, TypeScript, Supabase, Expo Router, Zustand, react-native-maps, NativeWind, expo-image-picker, expo-location, i18next

**Spec:** `docs/superpowers/specs/2026-04-24-react-native-migration-design.md`

**Branch:** `react-migration`

**Note:** Ivan's Post-MVP plan (chat, notifications, admin dashboard, settings) will be written separately after Phase 0 lands.

---

## File Map

### Foundation (Phase 0)

| File | Responsibility |
|------|---------------|
| `app.json` | Expo app config (name, slug, scheme, plugins) |
| `tailwind.config.js` | NativeWind/Tailwind config |
| `global.css` | Tailwind directives |
| `nativewind-env.d.ts` | NativeWind TypeScript declarations |
| `lib/supabase.ts` | Supabase client initialization with AsyncStorage for session persistence |
| `lib/hooks/useAuth.ts` | Auth state hook (session, user, profile, loading, signIn, signUp, signOut) |
| `types/database.ts` | TypeScript types generated from Supabase schema |
| `constants/theme.ts` | Color palette, spacing, shared style constants |
| `app/_layout.tsx` | Root layout: loads fonts, initializes providers, auth gate |
| `app/(auth)/_layout.tsx` | Auth group layout (stack navigator) |
| `app/(auth)/login.tsx` | Login screen (role selection + email/password) |
| `app/(auth)/signup.tsx` | Sign up screen (name, email, password, address) |
| `app/(auth)/verify-email.tsx` | Email verification (polling + resend) |
| `app/(farmer)/_layout.tsx` | Farmer tab layout (bottom tabs) |
| `app/(admin)/_layout.tsx` | Admin tab layout (bottom tabs) |
| `supabase/migrations/00001_create_tables.sql` | All table DDL |
| `supabase/migrations/00002_create_rls_policies.sql` | All RLS policies |
| `supabase/migrations/00003_create_storage_buckets.sql` | Storage bucket setup |
| `supabase/migrations/00004_create_profile_trigger.sql` | Auto-create profile on auth signup |

### Marketplace (Phase 1)

| File | Responsibility |
|------|---------------|
| `app/(farmer)/marketplace.tsx` | Marketplace list with search, filter, "My Posts" |
| `app/(farmer)/marketplace/[id].tsx` | Post detail (images, seller info, comments) |
| `app/(farmer)/marketplace/create.tsx` | Create/edit post form |
| `app/(farmer)/marketplace/pick-location.tsx` | Map-based location picker |
| `components/LivestockCard.tsx` | Reusable card for marketplace list items |
| `components/ImageGallery.tsx` | Swipeable image gallery for post detail |
| `components/CommentSection.tsx` | Comments list + add comment input |
| `lib/hooks/useLivestock.ts` | CRUD hooks for livestock table |

### Geospatial Map (Phase 2)

| File | Responsibility |
|------|---------------|
| `app/(farmer)/home.tsx` | Map view with livestock markers |
| `app/(admin)/map.tsx` | Admin map view (same map, admin route) |
| `components/LivestockMap.tsx` | Shared map component (markers, legend, satellite tiles) |
| `components/MapLegend.tsx` | Category legend overlay |

### Guidelines (Phase 3)

| File | Responsibility |
|------|---------------|
| `app/(farmer)/guidelines.tsx` | Guidelines hub (toggle health/feeding) |
| `app/(farmer)/guidelines/health/index.tsx` | Health guidelines list |
| `app/(farmer)/guidelines/health/[id].tsx` | Health guideline detail |
| `app/(farmer)/guidelines/feeding/index.tsx` | Feeding categories list |
| `app/(farmer)/guidelines/feeding/[id].tsx` | Feeding detail |
| `app/(admin)/manage.tsx` | Admin content management hub |
| `app/(admin)/manage/announcements/index.tsx` | Announcements list |
| `app/(admin)/manage/announcements/form.tsx` | Create/edit announcement |
| `app/(admin)/manage/health/index.tsx` | Health guidelines list (admin) |
| `app/(admin)/manage/health/form.tsx` | Create/edit health guideline |
| `app/(admin)/manage/feeding/index.tsx` | Feeding info list (admin) |
| `app/(admin)/manage/feeding/form.tsx` | Create/edit feeding info |

### Migration & Profile (Phase 4)

| File | Responsibility |
|------|---------------|
| `app/(farmer)/profile.tsx` | Profile view/edit with avatar upload |
| `scripts/migrate-firebase-to-supabase.ts` | One-time Firebase → Supabase migration |
| `scripts/package.json` | Migration script dependencies (firebase-admin, @supabase/supabase-js) |

---

## Phase 0: Foundation ✅ COMPLETED (2026-04-27)

### Task 1: Initialize Expo Project

**Files:**
- Create: `app.json`, `tsconfig.json`, `package.json` (via `create-expo-app`)
- Create: `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`
- Create: `.gitignore`

- [x] **Step 1: Create Expo project**

Run from the repo root (`/Users/jsonse/Documents/development/Livestock-App`). We create the Expo project inside a `livestock-rn/` subdirectory to keep it separate from the existing Flutter code during migration:

```bash
npx create-expo-app@latest livestock-rn --template blank-typescript
cd livestock-rn
```

- [x] **Step 2: Install core dependencies**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-screens react-native-safe-area-context
npx expo install nativewind tailwindcss@^3.4 react-native-reanimated
npx expo install @react-native-async-storage/async-storage
npx expo install expo-image-picker expo-location expo-camera
npx expo install react-native-maps
npm install @supabase/supabase-js zustand i18next react-i18next
npm install react-native-url-polyfill
```

- [x] **Step 3: Configure app.json for Expo Router**

Replace the generated `app.json` with:

```json
{
  "expo": {
    "name": "Livestock App",
    "slug": "livestock-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "livestock-app",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.livestock.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app needs your location to show nearby livestock listings on the map.",
        "NSCameraUsageDescription": "This app needs camera access to take photos of your livestock.",
        "NSPhotoLibraryUsageDescription": "This app needs photo library access to upload livestock images."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.livestock.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-location",
      "expo-image-picker",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Livestock App to access your camera to take photos of livestock."
        }
      ]
    ]
  }
}
```

- [x] **Step 4: Set up NativeWind (Tailwind CSS)**

Create `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
      },
    },
  },
  plugins: [],
};
```

Create `global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

Update `metro.config.js` (create if needed):

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [x] **Step 5: Update package.json main entry for Expo Router**

In `package.json`, set the main entry:

```json
{
  "main": "expo-router/entry"
}
```

- [x] **Step 6: Copy assets from Flutter project**

```bash
cp ../assets/municipal_logo.png ./assets/icon.png
cp ../assets/municipal_logo.png ./assets/splash-icon.png
cp ../assets/municipal_logo.png ./assets/adaptive-icon.png
mkdir -p ./assets/images
cp ../assets/baktin.png ./assets/images/
cp ../assets/lechnonon.png ./assets/images/
cp ../assets/lapaon2.png ./assets/images/
cp ../assets/cute_pig_icon.png ./assets/images/
cp ../assets/farm.jpg ./assets/images/
```

- [x] **Step 7: Verify project runs**

```bash
npx expo start
```

Expected: Expo dev server starts. Press `i` for iOS Simulator or `a` for Android Emulator. App shows the default blank screen.

- [x] **Step 8: Commit**

```bash
git add .
git commit -m "feat: initialize Expo project with TypeScript, NativeWind, and core dependencies"
```

---

### Task 2: Supabase SQL Migrations

**Files:**
- Create: `supabase/migrations/00001_create_tables.sql`
- Create: `supabase/migrations/00002_create_rls_policies.sql`
- Create: `supabase/migrations/00003_create_storage_buckets.sql`
- Create: `supabase/migrations/00004_create_profile_trigger.sql`

These SQL files are run manually in the Supabase Dashboard SQL editor (or via Supabase CLI if installed). They define the entire database.

- [x] **Step 1: Create table definitions**

Create `supabase/migrations/00001_create_tables.sql`:

```sql
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
```

- [x] **Step 2: Create RLS policies**

Create `supabase/migrations/00002_create_rls_policies.sql`:

```sql
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
```

- [x] **Step 3: Create storage bucket setup**

Create `supabase/migrations/00003_create_storage_buckets.sql`:

```sql
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
```

- [x] **Step 4: Create profile auto-creation trigger**

Create `supabase/migrations/00004_create_profile_trigger.sql`:

```sql
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
```

- [x] **Step 5: Run migrations in Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Run `00001_create_tables.sql` — Expected: all tables created, no errors
3. Run `00002_create_rls_policies.sql` — Expected: all policies created
4. Run `00003_create_storage_buckets.sql` — Expected: 2 buckets created with policies
5. Run `00004_create_profile_trigger.sql` — Expected: trigger function and trigger created

Verify: Go to Table Editor — you should see `profiles`, `livestock`, `livestock_images`, `comments`, `chats`, `messages`, `announcements`, `health_guidelines`, `feeding_info`, `notifications`.

- [x] **Step 6: Commit migration files**

```bash
git add supabase/
git commit -m "feat: add Supabase SQL migrations for all tables, RLS, storage, and profile trigger"
```

---

### Task 3: Supabase Client & Auth Hook

**Files:**
- Create: `livestock-rn/lib/supabase.ts`
- Create: `livestock-rn/lib/hooks/useAuth.ts`
- Create: `livestock-rn/types/database.ts`
- Create: `livestock-rn/constants/theme.ts`

- [x] **Step 1: Create TypeScript types for the database**

Create `types/database.ts`:

```ts
export type UserRole = 'farmer' | 'admin';

export type LivestockCategory = 'Baktin' | 'Lechonon' | 'Lapaon';

export type FeedingCategory = 'Baktin' | 'Anayon' | 'Lapaon' | 'Lechonon';

export type NotificationType = 'new_post' | 'announcement' | 'health_guideline' | 'feeding_info' | 'chat';

export type NotificationRelatedType = 'livestock' | 'announcement' | 'guideline' | 'feeding' | 'chat';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  gender: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  purok: string | null;
  barangay: string | null;
  municipality: string;
  zip_code: string;
  created_at: string;
}

export interface Livestock {
  id: string;
  seller_id: string;
  name: string;
  category: LivestockCategory;
  price: number;
  description: string | null;
  contact: string | null;
  latitude: number | null;
  longitude: number | null;
  location_text: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  seller?: Profile;
  images?: LivestockImage[];
}

export interface LivestockImage {
  id: string;
  livestock_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Comment {
  id: string;
  livestock_id: string;
  user_id: string;
  text: string;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface Chat {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_sender_id: string | null;
  last_message_at: string | null;
  created_at: string;
  // Joined
  other_user?: Profile;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  // Joined
  sender?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  posted_by: string;
  created_at: string;
  updated_at: string;
}

export interface HealthGuideline {
  id: string;
  disease: string;
  symptoms: string | null;
  treatment: string | null;
  prevention: string | null;
  posted_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeedingInfo {
  id: string;
  name: string;
  category: FeedingCategory;
  description: string | null;
  feed_type: string | null;
  feeding_schedule: string | null;
  nutritional_requirement: string | null;
  feeding_best_practices: string | null;
  supplements_additives: string | null;
  posted_by: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  related_id: string | null;
  related_type: NotificationRelatedType | null;
  created_at: string;
}
```

- [x] **Step 2: Create Supabase client**

Create `lib/supabase.ts`:

```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Create `.env` at the project root (add to `.gitignore`):

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Add `.env` to `.gitignore`:

```
.env
```

- [x] **Step 3: Create useAuth hook**

Create `lib/hooks/useAuth.ts`:

```ts
import { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { Profile } from '../../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          setState({ session, user: session.user, profile, loading: false });
        });
      } else {
        setState({ session: null, user: null, profile: null, loading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ session, user: session.user, profile, loading: false });
        } else {
          setState({ session: null, user: null, profile: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data as Profile;
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      role?: string;
      gender?: string;
      birth_date?: string;
      purok?: string;
      barangay?: string;
      municipality?: string;
      zip_code?: string;
    }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          role: metadata.role || 'farmer',
          gender: metadata.gender,
          birth_date: metadata.birth_date,
          purok: metadata.purok,
          barangay: metadata.barangay,
          municipality: metadata.municipality || 'Quezon',
          zip_code: metadata.zip_code || '8715',
        },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}
```

- [x] **Step 4: Create theme constants**

Create `constants/theme.ts`:

```ts
export const COLORS = {
  green: {
    primary: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    bg: '#E8F5E9',
  },
  blue: {
    primary: '#1565C0',
    light: '#42A5F5',
    dark: '#0D47A1',
    bg: '#E3F2FD',
  },
  orange: {
    primary: '#E65100',
    light: '#FF9800',
    dark: '#BF360C',
    bg: '#FFF3E0',
  },
  purple: {
    primary: '#6A1B9A',
    light: '#AB47BC',
    dark: '#4A148C',
    bg: '#F3E5F5',
  },
  red: {
    primary: '#C62828',
    light: '#EF5350',
    dark: '#B71C1C',
    bg: '#FFEBEE',
  },
  teal: {
    primary: '#00695C',
    light: '#26A69A',
    dark: '#004D40',
    bg: '#E0F2F1',
  },
  pink: {
    primary: '#AD1457',
    light: '#EC407A',
    dark: '#880E4F',
    bg: '#FCE4EC',
  },
  indigo: {
    primary: '#283593',
    light: '#5C6BC0',
    dark: '#1A237E',
    bg: '#E8EAF6',
  },
} as const;

export type ThemeColor = keyof typeof COLORS;

export const DEFAULT_THEME: ThemeColor = 'green';

export const LIVESTOCK_CATEGORIES = ['Baktin', 'Lechonon', 'Lapaon'] as const;

export const FEEDING_CATEGORIES = ['Baktin', 'Anayon', 'Lapaon', 'Lechonon'] as const;

export const BARANGAYS = [
  'Apyao', 'Butong', 'Cawayan', 'Cebule', 'Dalurong', 'Delapa',
  'Kiburiao', 'Libertad', 'Lumitao', 'Merangeran', 'Minbantang',
  'Minongan', 'Palacapao', 'Puntian', 'Salawagan', 'San Jose',
  'San Roque', 'Sta. Cruz', 'Tugas',
] as const;
```

- [x] **Step 5: Commit**

```bash
git add types/ lib/ constants/ .gitignore
git commit -m "feat: add Supabase client, useAuth hook, database types, and theme constants"
```

---

### Task 4: Root Layout & Auth Gate

**Files:**
- Create: `livestock-rn/app/_layout.tsx`
- Create: `livestock-rn/app/(auth)/_layout.tsx`
- Create: `livestock-rn/app/(farmer)/_layout.tsx`
- Create: `livestock-rn/app/(admin)/_layout.tsx`

- [x] **Step 1: Create root layout with auth gate**

Create `app/_layout.tsx`:

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/hooks/useAuth';

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Not signed in — redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (session && !session.user.email_confirmed_at) {
      // Signed in but email not verified
      router.replace('/(auth)/verify-email');
    } else if (profile) {
      // Signed in and verified — route by role
      if (inAuthGroup) {
        if (profile.role === 'admin') {
          router.replace('/(admin)/map');
        } else {
          router.replace('/(farmer)/home');
        }
      }
    }
  }, [session, profile, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return <AuthGate />;
}
```

- [x] **Step 2: Create auth group layout**

Create `app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
```

- [x] **Step 3: Create farmer tab layout**

Create `app/(farmer)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FarmerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: true,
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guidelines"
        options={{
          title: 'Guidelines',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [x] **Step 4: Create admin tab layout**

Create `app/(admin)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Note: dashboard and settings tabs will be added by Ivan in Post-MVP (Phases 7 & 8).
// For MVP, admin only has Map and Manage tabs.
export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: true,
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [x] **Step 5: Create placeholder screens so the app compiles**

Create minimal placeholder files for each tab screen:

`app/(farmer)/home.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Map coming soon</Text>
    </View>
  );
}
```

`app/(farmer)/marketplace.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function MarketplaceScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Marketplace coming soon</Text>
    </View>
  );
}
```

`app/(farmer)/guidelines.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function GuidelinesScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Guidelines coming soon</Text>
    </View>
  );
}
```

`app/(farmer)/profile.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Profile coming soon</Text>
    </View>
  );
}
```

`app/(admin)/map.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function AdminMapScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Admin Map coming soon</Text>
    </View>
  );
}
```

`app/(admin)/manage.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function ManageScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Content Management coming soon</Text>
    </View>
  );
}
```

Note: `app/(admin)/dashboard.tsx` and `app/(admin)/settings.tsx` are **not created in the MVP**. Ivan will add them in Post-MVP Phases 7 and 8. He will also update the admin `_layout.tsx` to register those tabs.

- [x] **Step 6: Verify the app compiles and shows login redirect**

```bash
npx expo start
```

Expected: App starts, auth gate detects no session, redirects to `/(auth)/login`. Since login doesn't exist yet, you'll see a blank/error screen — that's expected. The routing logic is working.

- [x] **Step 7: Commit**

```bash
git add app/
git commit -m "feat: add root layout with auth gate, farmer/admin tab layouts, and placeholder screens"
```

---

### Task 5: Auth Screens (Login, Sign Up, Email Verification)

**Files:**
- Create: `livestock-rn/app/(auth)/login.tsx`
- Create: `livestock-rn/app/(auth)/signup.tsx`
- Create: `livestock-rn/app/(auth)/verify-email.tsx`

- [x] **Step 1: Build login screen**

Create `app/(auth)/login.tsx`:

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-8 py-12">
          <View className="items-center mb-8">
            <Image
              source={require('../../assets/images/cute_pig_icon.png')}
              className="w-24 h-24 mb-4"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-green-800">
              Livestock App
            </Text>
            <Text className="text-gray-500 mt-1">
              Municipality of Quezon, Bukidnon
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Log In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="text-green-700 font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [x] **Step 2: Build sign up screen**

Create `app/(auth)/signup.tsx`:

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';
import { BARANGAYS } from '../../constants/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [purok, setPurok] = useState('');
  const [barangay, setBarangay] = useState('');
  const [gender, setGender] = useState('');

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender || undefined,
        purok: purok || undefined,
        barangay: barangay || undefined,
      });
      // Auth state change will redirect to verify-email via the auth gate
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-12">
          <Text className="text-2xl font-bold text-green-800 mb-6">Create Account</Text>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">First Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Last Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Email *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Gender</Text>
            <View className="flex-row gap-3">
              {['Male', 'Female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`flex-1 py-3 rounded-lg border items-center ${
                    gender === g ? 'bg-green-700 border-green-700' : 'border-gray-300'
                  }`}
                  onPress={() => setGender(g)}
                >
                  <Text className={gender === g ? 'text-white font-semibold' : 'text-gray-700'}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Purok</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Purok"
              value={purok}
              onChangeText={setPurok}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Barangay</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {BARANGAYS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    className={`px-4 py-2 rounded-full border ${
                      barangay === b ? 'bg-green-700 border-green-700' : 'border-gray-300'
                    }`}
                    onPress={() => setBarangay(b)}
                  >
                    <Text className={barangay === b ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Password *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
            <Text className="text-green-700 font-semibold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [x] **Step 3: Build email verification screen**

Create `app/(auth)/verify-email.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';

export default function VerifyEmailScreen() {
  const { session, signOut } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  // Poll for email verification every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      setChecking(true);
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.email_confirmed_at) {
        // Refresh the session so the auth gate picks up the verified status
        await supabase.auth.refreshSession();
      }
      setChecking(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!session?.user.email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
      });
      if (error) throw error;
      setResendCooldown(30);
      Alert.alert('Sent', 'Verification email has been resent.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend email.');
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <Text className="text-2xl font-bold text-green-800 mb-4">Verify Your Email</Text>
      <Text className="text-gray-600 text-center mb-2">
        We've sent a verification link to:
      </Text>
      <Text className="text-green-700 font-semibold text-lg mb-6">
        {session?.user.email}
      </Text>
      <Text className="text-gray-500 text-center mb-8">
        Please check your inbox and click the link to verify your account.
        This page will update automatically.
      </Text>

      {checking && (
        <ActivityIndicator size="small" color="#2E7D32" className="mb-4" />
      )}

      <TouchableOpacity
        className={`rounded-lg py-3 px-8 ${
          resendCooldown > 0 ? 'bg-gray-300' : 'bg-green-700'
        }`}
        onPress={handleResend}
        disabled={resendCooldown > 0}
      >
        <Text className="text-white font-semibold">
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-6" onPress={signOut}>
        <Text className="text-gray-500">Sign out and try a different account</Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [x] **Step 4: Test the complete auth flow**

```bash
npx expo start
```

Test the following flow:
1. App opens → redirected to login screen
2. Tap "Sign Up" → fill in fields → submit → redirected to verify-email screen
3. Check Supabase Dashboard → Authentication → Users → new user appears
4. Check Table Editor → profiles → profile row auto-created by trigger
5. Go back to login → sign in with credentials → redirected to farmer home (placeholder)

- [x] **Step 5: Commit**

```bash
git add app/(auth)/
git commit -m "feat: add login, sign up, and email verification screens"
```

---

**Phase 0 is complete at this point. Ivan can branch off `react-migration` and start Post-MVP work.**

> **Completion notes (2026-04-27):** Phase 0 committed as `23b6bc6`. Expo SDK 54 (plan said 52+). React upgraded to 19.2.5 to resolve peer dependency conflict. All 4 SQL migrations run against remote Supabase project (`jgqcuaeuggtyymwyujvn`) via `supabase db query --linked`. Supabase CLI linked to project. All tasks consolidated into a single commit rather than per-task commits.

---

## Phase 1: Marketplace ✅ COMPLETED (2026-04-27)

### Task 6: Livestock CRUD Hooks

**Files:**
- Create: `livestock-rn/lib/hooks/useLivestock.ts`

- [x] **Step 1: Create livestock data hooks**

Create `lib/hooks/useLivestock.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Livestock, LivestockImage, Comment } from '../../types/database';

export function useLivestockList(filters?: {
  category?: string;
  sellerId?: string;
  search?: string;
}) {
  const [data, setData] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('livestock')
      .select(`
        *,
        seller:profiles!seller_id(id, first_name, last_name, barangay, avatar_url),
        images:livestock_images(id, image_url, sort_order)
      `)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.sellerId) {
      query = query.eq('seller_id', filters.sellerId);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data: result, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setData((result as Livestock[]) || []);
    }
    setLoading(false);
  }, [filters?.category, filters?.sellerId, filters?.search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useLivestockDetail(id: string) {
  const [data, setData] = useState<Livestock | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);

    const { data: livestock } = await supabase
      .from('livestock')
      .select(`
        *,
        seller:profiles!seller_id(id, first_name, last_name, barangay, avatar_url),
        images:livestock_images(id, image_url, sort_order)
      `)
      .eq('id', id)
      .single();

    const { data: commentData } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!user_id(id, first_name, last_name, avatar_url)
      `)
      .eq('livestock_id', id)
      .order('created_at', { ascending: true });

    setData(livestock as Livestock | null);
    setComments((commentData as Comment[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, comments, loading, refetch: fetch };
}

export async function createLivestock(
  livestock: Omit<Livestock, 'id' | 'created_at' | 'updated_at' | 'seller' | 'images'>,
  imageUris: string[]
): Promise<string> {
  // Insert livestock record
  const { data, error } = await supabase
    .from('livestock')
    .insert(livestock)
    .select('id')
    .single();

  if (error) throw error;
  const livestockId = data.id;

  // Upload images to storage and insert image records
  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    const fileName = `${livestockId}/${Date.now()}_${i}.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('livestock-images')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError.message);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from('livestock-images')
      .getPublicUrl(fileName);

    await supabase.from('livestock_images').insert({
      livestock_id: livestockId,
      image_url: urlData.publicUrl,
      sort_order: i,
    });
  }

  return livestockId;
}

export async function updateLivestock(
  id: string,
  updates: Partial<Omit<Livestock, 'id' | 'created_at' | 'seller' | 'images'>>
) {
  const { error } = await supabase
    .from('livestock')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteLivestock(id: string) {
  // Images in storage are NOT auto-deleted — clean up manually
  const { data: images } = await supabase
    .from('livestock_images')
    .select('image_url')
    .eq('livestock_id', id);

  if (images) {
    const paths = images.map((img) => {
      const url = new URL(img.image_url);
      // Extract path after /storage/v1/object/public/livestock-images/
      return url.pathname.split('/livestock-images/')[1];
    }).filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from('livestock-images').remove(paths);
    }
  }

  // Cascade delete handles livestock_images and comments rows
  const { error } = await supabase.from('livestock').delete().eq('id', id);
  if (error) throw error;
}

export async function addComment(livestockId: string, userId: string, text: string) {
  const { error } = await supabase.from('comments').insert({
    livestock_id: livestockId,
    user_id: userId,
    text,
  });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}
```

- [x] **Step 2: Commit**

```bash
git add lib/hooks/useLivestock.ts
git commit -m "feat: add livestock CRUD hooks with image upload to Supabase Storage"
```

---

### Task 7: LivestockCard Component

**Files:**
- Create: `livestock-rn/components/LivestockCard.tsx`

- [x] **Step 1: Build the card component**

Create `components/LivestockCard.tsx`:

```tsx
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Livestock } from '../types/database';

interface Props {
  item: Livestock;
}

export default function LivestockCard({ item }: Props) {
  const router = useRouter();
  const firstImage = item.images?.[0]?.image_url;

  return (
    <TouchableOpacity
      className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden"
      onPress={() => router.push(`/(farmer)/marketplace/${item.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row">
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            className="w-28 h-28"
            resizeMode="cover"
          />
        ) : (
          <View className="w-28 h-28 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-3xl">🐷</Text>
          </View>
        )}

        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {item.category} • {item.seller?.barangay || 'Unknown'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-lg font-bold text-green-700">
              ₱{Number(item.price).toLocaleString()}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${
              item.is_available ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Text className={`text-xs font-medium ${
                item.is_available ? 'text-green-700' : 'text-red-700'
              }`}>
                {item.is_available ? 'Available' : 'Sold'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add components/LivestockCard.tsx
git commit -m "feat: add LivestockCard component for marketplace list"
```

---

### Task 8: Marketplace List Screen

**Files:**
- Modify: `livestock-rn/app/(farmer)/marketplace.tsx`

- [x] **Step 1: Build marketplace list with search and filters**

Replace `app/(farmer)/marketplace.tsx`:

```tsx
import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLivestockList } from '../../lib/hooks/useLivestock';
import { useAuth } from '../../lib/hooks/useAuth';
import LivestockCard from '../../components/LivestockCard';
import { LIVESTOCK_CATEGORIES } from '../../constants/theme';

const FILTERS = ['All', ...LIVESTOCK_CATEGORIES] as const;

export default function MarketplaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [myPostsOnly, setMyPostsOnly] = useState(false);

  const filters = useMemo(() => ({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    sellerId: myPostsOnly ? user?.id : undefined,
    search: search.trim() || undefined,
  }), [selectedCategory, myPostsOnly, search, user?.id]);

  const { data, loading, refetch } = useLivestockList(filters);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="px-4 pt-3 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search livestock..."
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filters */}
      <View className="px-4 py-2 bg-white border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-1.5 rounded-full mr-2 ${
                selectedCategory === item
                  ? 'bg-green-700'
                  : 'bg-gray-100'
              }`}
              onPress={() => setSelectedCategory(item)}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === item ? 'text-white' : 'text-gray-700'
              }`}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* My Posts Toggle */}
      <View className="px-4 py-2 bg-white border-b border-gray-200 flex-row justify-between items-center">
        <Text className="text-gray-600 text-sm">
          {data.length} listing{data.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setMyPostsOnly(!myPostsOnly)}
        >
          <Ionicons
            name={myPostsOnly ? 'checkbox' : 'square-outline'}
            size={20}
            color={myPostsOnly ? '#2E7D32' : '#9CA3AF'}
          />
          <Text className="ml-1 text-sm text-gray-600">My Posts</Text>
        </TouchableOpacity>
      </View>

      {/* Listing */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LivestockCard item={item} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-400 text-lg">No listings found</Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={loading}
        />
      )}

      {/* FAB to create post */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-700 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(farmer)/marketplace/create')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
```

- [x] **Step 2: Verify the marketplace screen renders**

```bash
npx expo start
```

Expected: Log in as a farmer, tap Marketplace tab. Screen shows search bar, category filters, "My Posts" toggle, empty listing message, and a green FAB button.

- [x] **Step 3: Commit**

```bash
git add app/(farmer)/marketplace.tsx
git commit -m "feat: build marketplace list screen with search, category filter, and My Posts toggle"
```

---

### Task 9: Post Create/Edit Form

**Files:**
- Create: `livestock-rn/app/(farmer)/marketplace/create.tsx`
- Create: `livestock-rn/app/(farmer)/marketplace/pick-location.tsx`

- [x] **Step 1: Build post creation form**

Create `app/(farmer)/marketplace/create.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/hooks/useAuth';
import { createLivestock, updateLivestock } from '../../../lib/hooks/useLivestock';
import { supabase } from '../../../lib/supabase';
import { LIVESTOCK_CATEGORIES } from '../../../constants/theme';

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    editId?: string;
    lat?: string;
    lng?: string;
    locationText?: string;
  }>();

  const isEditing = !!params.editId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Load existing post data when editing
  useEffect(() => {
    if (params.editId) {
      setInitialLoading(true);
      supabase
        .from('livestock')
        .select('*, images:livestock_images(image_url)')
        .eq('id', params.editId)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.name);
            setCategory(data.category);
            setPrice(String(data.price));
            setDescription(data.description || '');
            setContact(data.contact || '');
            setLocationText(data.location_text || '');
            setLatitude(data.latitude ? Number(data.latitude) : null);
            setLongitude(data.longitude ? Number(data.longitude) : null);
            if (data.images) {
              setImages(data.images.map((img: any) => img.image_url));
            }
          }
          setInitialLoading(false);
        });
    }
  }, [params.editId]);

  // Update location when returning from pick-location screen
  useEffect(() => {
    if (params.lat) setLatitude(parseFloat(params.lat));
    if (params.lng) setLongitude(parseFloat(params.lng));
    if (params.locationText) setLocationText(params.locationText);
  }, [params.lat, params.lng, params.locationText]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.6,
      selectionLimit: 10 - images.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category || !price.trim()) {
      Alert.alert('Error', 'Please fill in name, category, and price.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      if (isEditing && params.editId) {
        await updateLivestock(params.editId, {
          name: name.trim(),
          category: category as any,
          price: parseFloat(price),
          description: description.trim() || null,
          contact: contact.trim() || null,
          latitude,
          longitude,
          location_text: locationText.trim() || null,
        });
        Alert.alert('Success', 'Listing updated!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await createLivestock(
          {
            seller_id: user.id,
            name: name.trim(),
            category: category as any,
            price: parseFloat(price),
            description: description.trim() || null,
            contact: contact.trim() || null,
            latitude,
            longitude,
            location_text: locationText.trim() || null,
            is_available: true,
          },
          images
        );
        Alert.alert('Success', 'Livestock posted!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {initialLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-green-800 mb-4">
          {isEditing ? 'Edit Listing' : 'Post Livestock'}
        </Text>

        {/* Images */}
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Photos ({images.length}/10)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {images.map((uri, i) => (
              <View key={i} className="relative">
                <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                <TouchableOpacity
                  className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center"
                  onPress={() => removeImage(i)}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 10 && (
              <TouchableOpacity
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center"
                onPress={pickImages}
              >
                <Ionicons name="camera" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Name *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="e.g. Healthy Piglet"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Category *</Text>
          <View className="flex-row gap-2">
            {LIVESTOCK_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                className={`flex-1 py-3 rounded-lg border items-center ${
                  category === c ? 'bg-green-700 border-green-700' : 'border-gray-300'
                }`}
                onPress={() => setCategory(c)}
              >
                <Text className={category === c ? 'text-white font-semibold' : 'text-gray-700'}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Price (₱) *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Describe your livestock..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Contact */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Contact</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Phone number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
        </View>

        {/* Location */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Location</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            onPress={() => router.push('/(farmer)/marketplace/pick-location')}
          >
            <Text className={locationText ? 'text-gray-900' : 'text-gray-400'}>
              {locationText || 'Pick location on map'}
            </Text>
            <Ionicons name="location" size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mb-8 ${
            loading ? 'bg-green-400' : 'bg-green-700'
          }`}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              {isEditing ? 'Update Listing' : 'Post Listing'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
```

- [x] **Step 2: Build location picker screen**

Create `app/(farmer)/marketplace/pick-location.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

// Quezon, Bukidnon center coordinates
const INITIAL_REGION = {
  latitude: 7.7306,
  longitude: 125.0975,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function PickLocationScreen() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationText, setLocationText] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Reverse geocode
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
        setLocationText(parts.join(', '));
      } else {
        setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch {
      setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const useMyLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      handleMapPress({
        nativeEvent: {
          coordinate: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not get location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map.');
      return;
    }
    router.navigate({
      pathname: '/(farmer)/marketplace/create',
      params: {
        lat: selectedLocation.latitude.toString(),
        lng: selectedLocation.longitude.toString(),
        locationText,
      },
    });
  };

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        mapType="satellite"
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} />
        )}
      </MapView>

      <View className="absolute top-4 right-4">
        <TouchableOpacity
          className="bg-white rounded-lg px-4 py-2 shadow-md flex-row items-center"
          onPress={useMyLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : (
            <>
              <Text className="text-green-700 font-medium mr-1">My Location</Text>
              <Ionicons name="locate" size={18} color="#2E7D32" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-2xl shadow-lg">
        <Text className="text-sm text-gray-500 mb-1">Selected Location</Text>
        <Text className="text-base font-medium text-gray-900 mb-3" numberOfLines={2}>
          {locationText || 'Tap the map to select a location'}
        </Text>
        <TouchableOpacity
          className={`rounded-lg py-3 items-center ${
            selectedLocation ? 'bg-green-700' : 'bg-gray-300'
          }`}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Text className="text-white font-semibold text-lg">Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [x] **Step 3: Verify post creation flow**

```bash
npx expo start
```

Test: Marketplace → FAB (+) → fill form → pick images → pick location → submit. Check Supabase Dashboard: `livestock` table has new row, `livestock_images` has image URLs, Storage bucket has uploaded files.

- [x] **Step 4: Commit**

```bash
git add app/(farmer)/marketplace/
git commit -m "feat: add post creation form with image upload and map-based location picker"
```

---

### Task 10: Post Detail Screen with Comments

**Files:**
- Create: `livestock-rn/app/(farmer)/marketplace/[id].tsx`
- Create: `livestock-rn/components/ImageGallery.tsx`
- Create: `livestock-rn/components/CommentSection.tsx`

- [x] **Step 1: Build image gallery component**

Create `components/ImageGallery.tsx`:

```tsx
import { useState, useRef } from 'react';
import { View, Image, FlatList, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  images: { id: string; image_url: string }[];
}

export default function ImageGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View className="w-full h-64 bg-gray-200 items-center justify-center">
        <Text className="text-gray-400 text-5xl">🐷</Text>
        <Text className="text-gray-400 mt-2">No images</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: SCREEN_WIDTH, height: 256 }}
            resizeMode="cover"
          />
        )}
      />
      {images.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
          {images.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full mx-1 ${
                i === activeIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
```

- [x] **Step 2: Build comment section component**

Create `components/CommentSection.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addComment, deleteComment } from '../lib/hooks/useLivestock';
import type { Comment } from '../types/database';

interface Props {
  livestockId: string;
  userId: string;
  comments: Comment[];
  onRefresh: () => void;
}

export default function CommentSection({ livestockId, userId, comments, onRefresh }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(livestockId, userId, text.trim());
      setText('');
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteComment(commentId);
          onRefresh();
        },
      },
    ]);
  };

  return (
    <View>
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Comments ({comments.length})
      </Text>

      {comments.map((comment) => (
        <View key={comment.id} className="bg-gray-50 rounded-lg p-3 mb-2">
          <View className="flex-row justify-between items-start">
            <Text className="text-sm font-semibold text-gray-800">
              {comment.user?.first_name} {comment.user?.last_name}
            </Text>
            {comment.user_id === userId && (
              <TouchableOpacity onPress={() => handleDelete(comment.id)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-sm text-gray-700 mt-1">{comment.text}</Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(comment.created_at).toLocaleDateString()}
          </Text>
        </View>
      ))}

      <View className="flex-row items-center mt-2 gap-2">
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          placeholder="Add a comment..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          className="bg-green-700 rounded-lg px-4 py-2"
          onPress={handleSubmit}
          disabled={submitting || !text.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [x] **Step 3: Build post detail screen**

Create `app/(farmer)/marketplace/[id].tsx`:

```tsx
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLivestockDetail, deleteLivestock } from '../../../lib/hooks/useLivestock';
import { useAuth } from '../../../lib/hooks/useAuth';
import ImageGallery from '../../../components/ImageGallery';
import CommentSection from '../../../components/CommentSection';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, comments, loading, refetch } = useLivestockDetail(id!);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-lg">Post not found</Text>
      </View>
    );
  }

  const isOwner = user?.id === data.seller_id;

  const handleDelete = () => {
    Alert.alert('Delete Post', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLivestock(data.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <ImageGallery images={data.images || []} />

      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{data.name}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{data.category}</Text>
          </View>
          <Text className="text-2xl font-bold text-green-700">
            ₱{Number(data.price).toLocaleString()}
          </Text>
        </View>

        {/* Status */}
        <View className={`self-start px-3 py-1 rounded-full mb-4 ${
          data.is_available ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Text className={`text-sm font-medium ${
            data.is_available ? 'text-green-700' : 'text-red-700'
          }`}>
            {data.is_available ? 'Available' : 'Sold'}
          </Text>
        </View>

        {/* Description */}
        {data.description && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Description</Text>
            <Text className="text-gray-600">{data.description}</Text>
          </View>
        )}

        {/* Seller Info */}
        <View className="bg-gray-50 rounded-lg p-3 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Seller</Text>
          <Text className="text-gray-900">
            {data.seller?.first_name} {data.seller?.last_name}
          </Text>
          {data.seller?.barangay && (
            <Text className="text-sm text-gray-500">{data.seller.barangay}, Quezon</Text>
          )}
          {data.contact && (
            <Text className="text-sm text-green-700 mt-1">{data.contact}</Text>
          )}
        </View>

        {/* Location */}
        {data.location_text && (
          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={16} color="#2E7D32" />
            <Text className="text-sm text-gray-600 ml-1">{data.location_text}</Text>
          </View>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
              onPress={() => router.push({
                pathname: '/(farmer)/marketplace/create',
                params: { editId: data.id },
              })}
            >
              <Text className="text-white font-semibold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-600 rounded-lg py-3 items-center"
              onPress={handleDelete}
            >
              <Text className="text-white font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comments */}
        {user && (
          <CommentSection
            livestockId={data.id}
            userId={user.id}
            comments={comments}
            onRefresh={refetch}
          />
        )}
      </View>
    </ScrollView>
  );
}
```

- [x] **Step 4: Verify the full marketplace flow**

Test: Create a post → see it in the list → tap to see detail → add a comment → delete the comment. Check Supabase Dashboard to verify all data.

- [x] **Step 5: Commit**

```bash
git add app/(farmer)/marketplace/[id].tsx components/ImageGallery.tsx components/CommentSection.tsx
git commit -m "feat: add post detail screen with image gallery and comments"
```

---

## Phase 2: Geospatial Map ✅ COMPLETED (2026-04-27)

### Task 11: Shared Map Component

**Files:**
- Create: `livestock-rn/components/LivestockMap.tsx`
- Create: `livestock-rn/components/MapLegend.tsx`

- [x] **Step 1: Build the map legend component**

Create `components/MapLegend.tsx`:

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { name: 'Baktin', color: '#EF4444', emoji: '🐷' },
  { name: 'Lechonon', color: '#3B82F6', emoji: '🐖' },
  { name: 'Lapaon', color: '#F59E0B', emoji: '🐽' },
];

export default function MapLegend() {
  const [visible, setVisible] = useState(false);

  return (
    <View className="absolute top-4 left-4">
      <TouchableOpacity
        className="bg-white rounded-lg px-3 py-2 shadow-md flex-row items-center"
        onPress={() => setVisible(!visible)}
      >
        <Ionicons name="layers" size={18} color="#2E7D32" />
        <Text className="text-green-700 font-medium ml-1">Legend</Text>
      </TouchableOpacity>

      {visible && (
        <View className="bg-white rounded-lg p-3 shadow-md mt-2 min-w-[140px]">
          {CATEGORIES.map((cat) => (
            <View key={cat.name} className="flex-row items-center mb-1.5 last:mb-0">
              <Text className="text-base mr-2">{cat.emoji}</Text>
              <Text className="text-sm text-gray-700">{cat.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
```

- [x] **Step 2: Build the shared map component**

Create `components/LivestockMap.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import type { Livestock } from '../types/database';
import MapLegend from './MapLegend';

// Quezon, Bukidnon center
const DEFAULT_REGION = {
  latitude: 7.7306,
  longitude: 125.0975,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CATEGORY_EMOJI: Record<string, string> = {
  Baktin: '🐷',
  Lechonon: '🐖',
  Lapaon: '🐽',
};

export default function LivestockMap() {
  const router = useRouter();
  const [listings, setListings] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    fetchListings();
    getUserLocation();
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('livestock')
      .select('id, name, category, price, latitude, longitude, is_available, seller_id')
      .eq('is_available', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (!error && data) {
      setListings(data as Livestock[]);
    }
    setLoading(false);
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch {
      // Location not available — use default region
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          userLocation
            ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : DEFAULT_REGION
        }
        showsUserLocation
        showsMyLocationButton
      >
        {/* ESRI Satellite Tiles */}
        <UrlTile
          urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maximumZ={19}
          flipY={false}
        />

        {listings.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: Number(item.latitude),
              longitude: Number(item.longitude),
            }}
            title={item.name}
            description={`₱${Number(item.price).toLocaleString()} • ${item.category}`}
            onCalloutPress={() => router.push(`/(farmer)/marketplace/${item.id}`)}
          >
            <View className="items-center">
              <Text className="text-2xl">{CATEGORY_EMOJI[item.category] || '📍'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <MapLegend />
    </View>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add components/LivestockMap.tsx components/MapLegend.tsx
git commit -m "feat: add shared LivestockMap component with ESRI satellite tiles and category markers"
```

---

### Task 12: Farmer & Admin Map Screens

**Files:**
- Modify: `livestock-rn/app/(farmer)/home.tsx`
- Modify: `livestock-rn/app/(admin)/map.tsx`

- [x] **Step 1: Update farmer home screen**

Replace `app/(farmer)/home.tsx`:

```tsx
import LivestockMap from '../../components/LivestockMap';

export default function HomeScreen() {
  return <LivestockMap />;
}
```

- [x] **Step 2: Update admin map screen**

Replace `app/(admin)/map.tsx`:

```tsx
import LivestockMap from '../../components/LivestockMap';

export default function AdminMapScreen() {
  return <LivestockMap />;
}
```

- [x] **Step 3: Verify map renders with markers**

```bash
npx expo start
```

Expected: Home tab shows satellite map centered on Quezon, Bukidnon. Any livestock posts with lat/lng show as emoji markers. Tapping a marker shows callout with name/price. Tapping callout navigates to post detail.

- [x] **Step 4: Commit**

```bash
git add app/(farmer)/home.tsx app/(admin)/map.tsx
git commit -m "feat: wire up farmer and admin map screens using shared LivestockMap component"
```

---

## Phase 3: Guidelines Content ✅ COMPLETED (2026-04-27)

### Task 13: Health Guidelines Screens

**Files:**
- Modify: `livestock-rn/app/(farmer)/guidelines.tsx`
- Create: `livestock-rn/app/(farmer)/guidelines/health/index.tsx`
- Create: `livestock-rn/app/(farmer)/guidelines/health/[id].tsx`

- [x] **Step 1: Build guidelines hub**

Replace `app/(farmer)/guidelines.tsx`:

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GuidelinesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold text-green-800 mb-4">Guidelines</Text>

      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100"
        onPress={() => router.push('/(farmer)/guidelines/health')}
      >
        <View className="bg-red-100 rounded-lg p-3 mr-4">
          <Ionicons name="medkit" size={28} color="#DC2626" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">Health Guidelines</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            Diseases, symptoms, treatment, and prevention
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white rounded-xl p-4 flex-row items-center shadow-sm border border-gray-100"
        onPress={() => router.push('/(farmer)/guidelines/feeding')}
      >
        <View className="bg-amber-100 rounded-lg p-3 mr-4">
          <Ionicons name="nutrition" size={28} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">Feeding Information</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            Schedules, nutrition, and best practices
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
```

- [x] **Step 2: Build health guidelines list**

Create `app/(farmer)/guidelines/health/index.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { HealthGuideline } from '../../../../types/database';

export default function HealthGuidelinesListScreen() {
  const router = useRouter();
  const [guidelines, setGuidelines] = useState<HealthGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    const { data, error } = await supabase
      .from('health_guidelines')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setGuidelines(data);
    setLoading(false);
  };

  const filtered = guidelines.filter(
    (g) =>
      g.disease.toLowerCase().includes(search.toLowerCase()) ||
      (g.symptoms || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-3 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search diseases or symptoms..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
            onPress={() => router.push(`/(farmer)/guidelines/health/${item.id}`)}
          >
            <Text className="text-base font-semibold text-gray-900">{item.disease}</Text>
            {item.symptoms && (
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                {item.symptoms}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400">No health guidelines found</Text>
          </View>
        }
      />
    </View>
  );
}
```

- [x] **Step 3: Build health guideline detail**

Create `app/(farmer)/guidelines/health/[id].tsx`:

```tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { HealthGuideline } from '../../../../types/database';

export default function HealthGuidelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<HealthGuideline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase
        .from('health_guidelines')
        .select('*')
        .eq('id', id)
        .single();
      setData(result);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Guideline not found</Text>
      </View>
    );
  }

  const sections = [
    { title: 'Disease', content: data.disease, icon: 'bug' as const, color: '#DC2626' },
    { title: 'Symptoms', content: data.symptoms, icon: 'alert-circle' as const, color: '#F59E0B' },
    { title: 'Treatment', content: data.treatment, icon: 'medkit' as const, color: '#3B82F6' },
    { title: 'Prevention', content: data.prevention, icon: 'shield-checkmark' as const, color: '#10B981' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {sections.map((section) =>
        section.content ? (
          <View key={section.title} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name={section.icon} size={20} color={section.color} />
              <Text className="text-base font-semibold text-gray-800 ml-2">
                {section.title}
              </Text>
            </View>
            <Text className="text-gray-600 leading-relaxed">{section.content}</Text>
          </View>
        ) : null
      )}
    </ScrollView>
  );
}
```

- [x] **Step 4: Commit**

```bash
git add app/(farmer)/guidelines.tsx app/(farmer)/guidelines/
git commit -m "feat: add guidelines hub, health guidelines list, and health guideline detail screens"
```

---

### Task 14: Feeding Info Screens

**Files:**
- Create: `livestock-rn/app/(farmer)/guidelines/feeding/index.tsx`
- Create: `livestock-rn/app/(farmer)/guidelines/feeding/[id].tsx`

- [x] **Step 1: Build feeding categories/list screen**

Create `app/(farmer)/guidelines/feeding/index.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { FEEDING_CATEGORIES } from '../../../../constants/theme';
import type { FeedingInfo } from '../../../../types/database';

export default function FeedingListScreen() {
  const router = useRouter();
  const [feedingData, setFeedingData] = useState<FeedingInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Baktin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeding();
  }, [selectedCategory]);

  const fetchFeeding = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feeding_info')
      .select('*')
      .eq('category', selectedCategory)
      .order('created_at', { ascending: false });

    if (!error && data) setFeedingData(data);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Category tabs */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FEEDING_CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === item ? 'bg-green-700' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedCategory(item)}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === item ? 'text-white' : 'text-gray-700'
              }`}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={feedingData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              onPress={() => router.push(`/(farmer)/guidelines/feeding/${item.id}`)}
            >
              <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
              {item.feed_type && (
                <Text className="text-sm text-gray-500 mt-0.5">Feed type: {item.feed_type}</Text>
              )}
              {item.description && (
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-gray-400">No feeding info for {selectedCategory}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
```

- [x] **Step 2: Build feeding detail screen**

Create `app/(farmer)/guidelines/feeding/[id].tsx`:

```tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { FeedingInfo } from '../../../../types/database';

export default function FeedingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<FeedingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase
        .from('feeding_info')
        .select('*')
        .eq('id', id)
        .single();
      setData(result);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Feeding info not found</Text>
      </View>
    );
  }

  const sections = [
    { title: 'Feed Type', content: data.feed_type, icon: 'leaf' as const },
    { title: 'Feeding Schedule', content: data.feeding_schedule, icon: 'time' as const },
    { title: 'Nutritional Requirements', content: data.nutritional_requirement, icon: 'stats-chart' as const },
    { title: 'Best Practices', content: data.feeding_best_practices, icon: 'checkmark-circle' as const },
    { title: 'Supplements & Additives', content: data.supplements_additives, icon: 'flask' as const },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <Text className="text-xl font-bold text-gray-900">{data.name}</Text>
        <Text className="text-sm text-green-700 mt-1">{data.category}</Text>
        {data.description && (
          <Text className="text-gray-600 mt-2">{data.description}</Text>
        )}
      </View>

      {sections.map((section) =>
        section.content ? (
          <View key={section.title} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name={section.icon} size={20} color="#2E7D32" />
              <Text className="text-base font-semibold text-gray-800 ml-2">
                {section.title}
              </Text>
            </View>
            <Text className="text-gray-600 leading-relaxed">{section.content}</Text>
          </View>
        ) : null
      )}
    </ScrollView>
  );
}
```

- [x] **Step 3: Commit**

```bash
git add app/(farmer)/guidelines/feeding/
git commit -m "feat: add feeding info category list and detail screens"
```

---

### Task 15: Admin Content Management Screens

**Files:**
- Modify: `livestock-rn/app/(admin)/manage.tsx`
- Create: `livestock-rn/app/(admin)/manage/announcements/index.tsx`
- Create: `livestock-rn/app/(admin)/manage/announcements/form.tsx`
- Create: `livestock-rn/app/(admin)/manage/health/index.tsx`
- Create: `livestock-rn/app/(admin)/manage/health/form.tsx`
- Create: `livestock-rn/app/(admin)/manage/feeding/index.tsx`
- Create: `livestock-rn/app/(admin)/manage/feeding/form.tsx`

This task creates 7 screens. The patterns are repetitive (list + form for each content type), so the code follows the same structure for announcements, health guidelines, and feeding info. See the spec for field details per type.

- [x] **Step 1: Build admin manage hub**

Replace `app/(admin)/manage.tsx`:

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  {
    title: 'Announcements',
    subtitle: 'Post and manage announcements',
    icon: 'megaphone' as const,
    color: '#2563EB',
    route: '/(admin)/manage/announcements',
  },
  {
    title: 'Health Guidelines',
    subtitle: 'Manage disease and health information',
    icon: 'medkit' as const,
    color: '#DC2626',
    route: '/(admin)/manage/health',
  },
  {
    title: 'Feeding Information',
    subtitle: 'Manage feeding schedules and nutrition',
    icon: 'nutrition' as const,
    color: '#D97706',
    route: '/(admin)/manage/feeding',
  },
];

export default function ManageScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold text-green-900 mb-4">Content Management</Text>

      {SECTIONS.map((section) => (
        <TouchableOpacity
          key={section.title}
          className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100"
          onPress={() => router.push(section.route as any)}
        >
          <View
            className="rounded-lg p-3 mr-4"
            style={{ backgroundColor: `${section.color}15` }}
          >
            <Ionicons name={section.icon} size={28} color={section.color} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">{section.title}</Text>
            <Text className="text-sm text-gray-500">{section.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

- [x] **Step 2: Build announcements list and form**

Create `app/(admin)/manage/announcements/index.tsx`:
- Fetch with `supabase.from('announcements').select('*').order('created_at', { ascending: false })`
- Render `FlatList` of cards showing `title`, `description` truncated, and `created_at` date
- Each card has an "Edit" button → `router.push({ pathname: '/(admin)/manage/announcements/form', params: { editId: item.id } })`
- Each card has a "Delete" button → `Alert.alert` confirm → `supabase.from('announcements').delete().eq('id', item.id)`
- FAB (+) button → `router.push('/(admin)/manage/announcements/form')`
- Follow the same list pattern as `app/(farmer)/guidelines/health/index.tsx` (Task 13 Step 2)

Create `app/(admin)/manage/announcements/form.tsx`:
- Read `params.editId` with `useLocalSearchParams`. If present, fetch existing record and pre-fill fields
- Fields: `title` (TextInput, required), `description` (TextInput multiline), `content` (TextInput multiline)
- On submit:
  - If editing: `supabase.from('announcements').update({ title, description, content, updated_at: new Date().toISOString() }).eq('id', editId)`
  - If creating: `supabase.from('announcements').insert({ title, description, content, posted_by: user.id })`
- On success: `Alert.alert('Success', ...)` then `router.back()`
- Follow the same form pattern as `app/(farmer)/marketplace/create.tsx` (Task 9)

- [x] **Step 3: Build health guidelines list and form**

Create `app/(admin)/manage/health/index.tsx`:
- Same list pattern as announcements list above
- Fetch from `health_guidelines` table
- Cards show `disease` as title, `symptoms` truncated as subtitle
- Edit/delete buttons and FAB, same pattern

Create `app/(admin)/manage/health/form.tsx`:
- Same form pattern as announcements form above
- Fields: `disease` (TextInput, required), `symptoms` (TextInput multiline), `treatment` (TextInput multiline), `prevention` (TextInput multiline)
- Insert/update to `health_guidelines` table with `posted_by: user.id`

- [x] **Step 4: Build feeding info list and form**

Create `app/(admin)/manage/feeding/index.tsx`:
- Same list pattern as announcements list, plus category filter tabs (use `FEEDING_CATEGORIES` from `constants/theme.ts`)
- Fetch with `.eq('category', selectedCategory)` filter
- Cards show `name` as title, `feed_type` as subtitle

Create `app/(admin)/manage/feeding/form.tsx`:
- Same form pattern as announcements form
- Fields: `name` (TextInput, required), `category` (picker buttons from `FEEDING_CATEGORIES`, required), `description` (TextInput multiline), `feed_type` (TextInput), `feeding_schedule` (TextInput multiline), `nutritional_requirement` (TextInput multiline), `feeding_best_practices` (TextInput multiline), `supplements_additives` (TextInput multiline)
- Insert/update to `feeding_info` table with `posted_by: user.id`

- [x] **Step 5: Verify admin can CRUD all content types**

Log in as admin → Manage tab → test create/edit/delete for announcements, health guidelines, and feeding info. Verify data appears in Supabase Dashboard and in the farmer-side guidelines screens.

- [x] **Step 6: Commit**

```bash
git add app/(admin)/manage.tsx app/(admin)/manage/
git commit -m "feat: add admin content management screens for announcements, health guidelines, and feeding info"
```

---

## Phase 4: Migration & Profile ✅ PARTIALLY COMPLETED (2026-04-27) — Profile screen done, migration script pending

### Task 16: Profile Screen

**Files:**
- Modify: `livestock-rn/app/(farmer)/profile.tsx`

- [x] **Step 1: Build profile view/edit screen**

Replace `app/(farmer)/profile.tsx`:

```tsx
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [purok, setPurok] = useState(profile?.purok || '');
  const [barangay, setBarangay] = useState(profile?.barangay || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          purok: purok.trim() || null,
          barangay: barangay.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const fileName = `${user.id}/avatar.jpg`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      await refreshProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Avatar */}
      <View className="items-center py-8 bg-white">
        <TouchableOpacity onPress={handleAvatarPick}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
              <Text className="text-3xl">
                {profile.first_name[0]}{profile.last_name[0]}
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 bg-green-700 rounded-full w-8 h-8 items-center justify-center">
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 mt-3">
          {profile.first_name} {profile.last_name}
        </Text>
        <Text className="text-sm text-gray-500">{user?.email}</Text>
        <Text className="text-xs text-green-700 mt-1 uppercase">{profile.role}</Text>
      </View>

      {/* Info */}
      <View className="p-4">
        {editing ? (
          <>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">First Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Purok</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={purok}
                onChangeText={setPurok}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Barangay</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={barangay}
                onChangeText={setBarangay}
              />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
                onPress={() => setEditing(false)}
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-700 rounded-lg py-3 items-center"
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View className="bg-white rounded-xl p-4 mb-3">
              <InfoRow label="Barangay" value={profile.barangay || 'Not set'} />
              <InfoRow label="Purok" value={profile.purok || 'Not set'} />
              <InfoRow label="Municipality" value={profile.municipality} />
              <InfoRow label="Zip Code" value={profile.zip_code} />
              {profile.gender && <InfoRow label="Gender" value={profile.gender} />}
            </View>

            <TouchableOpacity
              className="bg-green-700 rounded-lg py-3 items-center mb-3"
              onPress={() => setEditing(true)}
            >
              <Text className="text-white font-semibold">Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          className="bg-red-50 rounded-lg py-3 items-center mt-4"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]);
          }}
        >
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50 last:border-0">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </View>
  );
}
```

- [x] **Step 2: Verify profile screen**

Test: view profile, edit fields, save. Upload avatar. Sign out.

- [x] **Step 3: Commit**

```bash
git add app/(farmer)/profile.tsx
git commit -m "feat: add profile screen with edit and avatar upload"
```

---

### Task 17: Firebase to Supabase Migration Script

**Files:**
- Create: `livestock-rn/scripts/package.json`
- Create: `livestock-rn/scripts/migrate-firebase-to-supabase.ts`

- [ ] **Step 1: Create scripts package.json**

Create `scripts/package.json`:

```json
{
  "name": "livestock-migration",
  "private": true,
  "type": "module",
  "scripts": {
    "migrate": "npx tsx migrate-firebase-to-supabase.ts"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "tsx": "^4.7.0"
  }
}
```

- [ ] **Step 2: Create the migration script**

Create `scripts/migrate-firebase-to-supabase.ts`. The script requires three env vars:
- `FIREBASE_SERVICE_ACCOUNT_PATH` — path to Firebase service account JSON
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (not anon key — needed to bypass RLS and import auth users)

Structure the script as sequential async functions, called in order. Each function logs its progress and count. Errors are logged per-record but don't stop the migration (so it can be re-run safely — use `upsert` where possible).

**Step 2a: `migrateAuthUsers()`**
- Use `firebase-admin` `auth().listUsers()` to page through all Firebase Auth users
- For each user, call Supabase admin API: `supabase.auth.admin.createUser({ email, email_confirm: user.emailVerified, password: undefined, user_metadata: {} })`
- Note: Supabase supports importing Firebase password hashes via the admin API `gotrue` endpoint. See [Supabase migration docs](https://supabase.com/docs/guides/auth/server-side/migrating-from-firebase). If password hash import is not feasible, users will need to use "Forgot Password" to reset — document this tradeoff.
- Build a `uidMap: Record<string, string>` mapping Firebase UID → Supabase UUID (they may differ)

**Step 2b: `migrateProfiles()`**
- Fetch all docs from Firestore `users` collection using `firebase-admin` `firestore().collection('users').get()`
- For each doc, map fields: `firstName` → `first_name`, `lastName` → `last_name`, `address.barangay` → `barangay`, `address.purok` → `purok`, `address.municipality` → `municipality`, `address.zipCode` → `zip_code`, `role` → `role`, `profileImage` (base64) → upload to Supabase Storage `avatars` bucket → store URL as `avatar_url`
- Use `uidMap` to set the correct `id` (Supabase auth user ID)
- Insert into `profiles` table using `supabase.from('profiles').upsert(...)`

**Step 2c: `migrateAdminContent()`**
- Fetch Firestore `announcements`, `health_guidelines`, `feeding_info` collections
- Map `postedBy` → `posted_by` using `uidMap`
- Map `createdAt` Firestore Timestamp → ISO string for `created_at`
- For `feeding_info`: normalize `'Letchonon'` → `'Lechonon'` in the `category` field
- Upsert into corresponding Supabase tables

**Step 2d: `migrateLivestock()`**
- Fetch Firestore `livestock` collection
- For each doc:
  - Map `sellerId` → `seller_id` using `uidMap`
  - Insert into `livestock` table, get back the new UUID
  - If `imageBase64` exists: `Buffer.from(base64, 'base64')` → upload to Supabase Storage `livestock-images/{livestockId}/{index}.jpg` → insert into `livestock_images` table with the public URL
  - If `imageBase64List` exists: same for each item in the array
  - Fetch subcollection `comments`: map `userId` → `user_id` using `uidMap`, insert into `comments` table

**Step 2e: `migrateChats()`**
- Fetch Firestore `chats` collection
- Map `participants[0]` → `participant_1`, `participants[1]` → `participant_2` using `uidMap`
- Insert into `chats` table
- For each chat, fetch `messages` subcollection, map `userId` → `sender_id`, insert into `messages` table

**Step 2f: `migrateNotifications()`**
- Fetch Firestore `notifications` collection
- Map `userId` → `user_id` using `uidMap`
- Map the various related ID fields into unified `related_id` + `related_type`:
  - `relatedPostId` → `related_id`, `related_type: 'livestock'`
  - `relatedAnnouncementId` → `related_id`, `related_type: 'announcement'`
  - `relatedGuidelineId` → `related_id`, `related_type: 'guideline'`
  - `relatedFeedingId` → `related_id`, `related_type: 'feeding'`
  - `relatedUserId` → `related_id`, `related_type: 'chat'`
- Insert into `notifications` table

**Main function:**
```ts
async function main() {
  console.log('Starting Firebase → Supabase migration...');
  const uidMap = await migrateAuthUsers();
  await migrateProfiles(uidMap);
  await migrateAdminContent(uidMap);
  await migrateLivestock(uidMap);
  await migrateChats(uidMap);
  await migrateNotifications(uidMap);
  console.log('Migration complete!');
}
main().catch(console.error);
```

- [ ] **Step 3: Run the migration**

```bash
cd scripts
npm install
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
npm run migrate
```

Expected output: counts of migrated users, profiles, livestock, images, chats, messages, etc. Verify in Supabase Dashboard that all data appears.

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: add Firebase to Supabase migration script"
```

---

### Task 18: Final Integration Verification

- [ ] **Step 1: Test complete farmer flow**

1. Log in with a migrated farmer account
2. View map with livestock markers
3. Browse marketplace — verify migrated posts with images
4. Create a new post with images and location
5. View post detail, add/delete comments
6. View health guidelines, browse feeding info
7. Edit profile, upload avatar
8. Sign out

- [ ] **Step 2: Test complete admin flow**

1. Log in with a migrated admin account
2. View admin map
3. Create/edit/delete announcements
4. Create/edit/delete health guidelines
5. Create/edit/delete feeding info

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes after end-to-end testing"
```

**MVP is complete. Ivan can now continue with Post-MVP features (chat, notifications, admin dashboard, settings) on the same branch.**
