# Livestock App Migration: Flutter + Firebase to React Native (Expo) + Supabase

**Date:** 2026-04-24
**Status:** Approved
**Authors:** Jayson, Ivan
**Branch:** `react-migration`

## Overview

Migrate the Livestock App — a mobile application for buying and selling backyard swine in Quezon, Bukidnon — from Flutter/Firebase to React Native (Expo)/Supabase. The app serves backyard swine farmers and the Municipal Agriculture Office with marketplace, geospatial mapping, feeding information, and health guidelines features.

### Why migrate?

- **Flutter to React Native (Expo):** Flutter has limited testing environment (simulators, device testing). Expo provides iOS Simulator, Android Emulator, physical device testing, and Expo Go with a single command.
- **Firebase to Supabase:** Supabase offers a generous free tier and much easier API documentation. Moving from NoSQL (Firestore) to a relational PostgreSQL database also better fits the app's data model.

### Migration strategy

- Build on `react-migration` branch
- MVP first, then scale up Post-MVP features
- Migrate existing Firebase data (170+ user accounts, marketplace posts, guidelines content)
- Once fully working, merge to `main` replacing the Flutter codebase

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52+ (managed workflow) |
| Language | TypeScript |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Navigation | Expo Router (file-based routing) |
| State Management | React Context + Zustand |
| Maps | `react-native-maps` with ESRI satellite tiles + OpenStreetMap |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Image Handling | `expo-image-picker` + Supabase Storage |
| Location | `expo-location` + reverse geocoding |
| Charts | `react-native-chart-kit` |
| Localization | `i18next` + `react-i18next` (English, Filipino, Bisaya) |
| Local Storage | `@react-native-async-storage/async-storage` |

---

## Project Structure

```
livestock-app/
├── app/                        # Expo Router file-based routes
│   ├── (auth)/                 # Auth screens (login, signup, verify)
│   ├── (farmer)/               # Farmer tab screens
│   │   ├── home.tsx            # Map view
│   │   ├── marketplace.tsx     # Marketplace list
│   │   ├── guidelines.tsx      # Health + Feeding
│   │   └── profile.tsx         # Profile
│   ├── (admin)/                # Admin tab screens
│   │   ├── dashboard.tsx       # Stats + analytics
│   │   ├── map.tsx             # Admin map view
│   │   ├── manage.tsx          # Content management
│   │   └── settings.tsx        # Admin settings
│   └── _layout.tsx             # Root layout with auth gate
├── components/                 # Reusable UI components
├── lib/
│   ├── supabase.ts             # Supabase client init
│   ├── store/                  # Zustand stores
│   └── hooks/                  # Custom hooks (useAuth, useRealtime, etc.)
├── types/                      # TypeScript types
├── constants/                  # Theme colors, config
├── assets/                     # Images, fonts
├── scripts/
│   └── migrate-firebase-to-supabase.ts  # One-time migration script
└── supabase/
    └── migrations/             # SQL migration files
```

---

## Database Schema (Supabase / PostgreSQL)

### profiles

Linked to Supabase Auth's `auth.users` table.

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'farmer',  -- 'farmer' | 'admin'
  gender          TEXT,
  birth_date      DATE,
  avatar_url      TEXT,
  purok           TEXT,
  barangay        TEXT,
  municipality    TEXT DEFAULT 'Quezon',
  zip_code        TEXT DEFAULT '8715',
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### livestock

```sql
CREATE TABLE livestock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles(id),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,   -- 'Baktin' | 'Lechonon' | 'Lapaon'
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
```

### livestock_images

Replaces base64 image storage with proper Supabase Storage URLs.

```sql
CREATE TABLE livestock_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id    UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### comments

```sql
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id    UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id),
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### chats

```sql
CREATE TABLE chats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1   UUID NOT NULL REFERENCES profiles(id),
  participant_2   UUID NOT NULL REFERENCES profiles(id),
  last_message    TEXT,
  last_sender_id  UUID REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### messages

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### announcements

```sql
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  content         TEXT,
  posted_by       UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### health_guidelines

```sql
CREATE TABLE health_guidelines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease         TEXT NOT NULL,
  symptoms        TEXT,
  treatment       TEXT,
  prevention      TEXT,
  posted_by       UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### feeding_info

```sql
CREATE TABLE feeding_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,   -- 'Baktin' | 'Anayon' | 'Lapaon' | 'Lechonon'
  description     TEXT,
  feed_type       TEXT,
  feeding_schedule    TEXT,
  nutritional_requirement TEXT,
  feeding_best_practices  TEXT,
  supplements_additives   TEXT,
  posted_by       UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### notifications

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  type            TEXT NOT NULL,   -- 'new_post' | 'announcement' | 'health_guideline' | 'feeding_info' | 'chat'
  title           TEXT NOT NULL,
  message         TEXT,
  is_read         BOOLEAN DEFAULT false,
  related_id      UUID,
  related_type    TEXT,            -- 'livestock' | 'announcement' | 'guideline' | 'feeding' | 'chat'
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Row Level Security (RLS) Policies

### profiles
- **SELECT:** Any authenticated user can read all profiles
- **UPDATE:** Users can only update their own profile (`auth.uid() = id`)

### livestock
- **SELECT:** Any authenticated user can read all listings
- **INSERT:** Users can only create listings where `seller_id = auth.uid()`
- **UPDATE/DELETE:** Users can only modify their own listings (`seller_id = auth.uid()`)

### livestock_images
- **SELECT:** Any authenticated user can read
- **INSERT/DELETE:** Only the livestock owner can manage images (join to `livestock.seller_id`)

### comments
- **SELECT:** Any authenticated user can read
- **INSERT:** Any authenticated user can create
- **DELETE:** Only the comment author (`user_id = auth.uid()`)

### chats
- **SELECT/INSERT/UPDATE:** Only participants (`participant_1 = auth.uid() OR participant_2 = auth.uid()`)

### messages
- **SELECT/INSERT:** Only participants of the parent chat (join to `chats`)

### announcements
- **SELECT:** Any authenticated user can read
- **INSERT/UPDATE/DELETE:** Only admin users (`role = 'admin'` checked via `profiles` table join, poster recorded via `posted_by`)

### health_guidelines & feeding_info
- **SELECT:** Any authenticated user can read
- **INSERT/UPDATE/DELETE:** Only admin users (`role = 'admin'` checked via `profiles` table join)

### notifications
- **SELECT/UPDATE:** Only the notification recipient (`user_id = auth.uid()`)
- **INSERT:** Any authenticated user can create (system-generated for other users)

### Storage Buckets
- **`avatars`:** Users can upload/overwrite their own; everyone authenticated can read all
- **`livestock-images`:** Livestock owner can upload/delete; everyone authenticated can read

---

## Data Migration Strategy (Firebase to Supabase)

A one-time Node.js migration script at `scripts/migrate-firebase-to-supabase.ts`.

### Execution Order (respects FK dependencies)

1. **Auth users** — Export Firebase Auth users (UID, email, password hash, email verified status). Import into Supabase Auth using the admin API. Supabase supports Firebase bcrypt/scrypt password hashes, so users keep existing passwords.

2. **Profiles** — Export Firestore `users` collection. Map Firebase UIDs to Supabase Auth UUIDs (preserved from step 1). Insert into `profiles` table.

3. **Admin content** — Export `announcements`, `health_guidelines`, `feeding_info` collections. Insert into corresponding Postgres tables. Map `postedBy` to `posted_by` using UID mapping.

4. **Livestock + Images** — Export `livestock` collection. For each post's `imageBase64`/`imageBase64List` fields: decode base64 to binary, upload to Supabase Storage `livestock-images` bucket, store returned URL in `livestock_images` table. Insert livestock records and comments.

5. **Chats** — Export `chats` collection and `messages` subcollections. Map `participants` array to `participant_1`/`participant_2` columns. Insert chats, then messages.

6. **Notifications** — Export `notifications` collection. Map `relatedPostId`, `relatedAnnouncementId`, etc. to unified `related_id` + `related_type`. Insert into `notifications` table.

### Rollback plan
Keep Firebase project active and unchanged until the React Native app is fully verified. Firebase remains the source of truth until cutover.

---

## Work Split

### Jayson — MVP (Phases 0-4)

| Phase | Scope | Est. Time |
|-------|-------|-----------|
| **Phase 0: Foundation** | Expo project init, Supabase setup (schema + RLS + storage), `lib/supabase.ts`, `useAuth` hook, auth gate, auth screens (login, signup, email verify, role redirect) | ~3 days |
| **Phase 1: Marketplace** | Marketplace list (search, category filter, "My Posts"), post create/edit form with image upload to Supabase Storage, post detail (image gallery, seller info, comments), location picker | ~5 days |
| **Phase 2: Geospatial Map** | Home screen with `react-native-maps` + ESRI satellite tiles, livestock markers from DB, category-based marker icons, marker tap navigation, admin map view | ~4 days |
| **Phase 3: Guidelines Content** | Health guidelines list + detail, feeding info categories/list/detail, search/filter, admin CRUD for both, admin announcement management | ~3 days |
| **Phase 4: Migration & Polish** | Firebase-to-Supabase migration script, run migration on prod data, profile screen (view/edit, avatar upload) | ~3 days |

**Ivan starts after Phase 0 is merged.**

### Ivan — Post-MVP (Phases 5-8)

| Phase | Scope | Est. Time |
|-------|-------|-----------|
| **Phase 5: Chat System** | Chat list screen, private message screen with Supabase Realtime, initiate chat from post detail, unread indicators | ~4 days |
| **Phase 6: Notifications** | Notifications table with Supabase Realtime, notification bell with unread count, notification center (mark read, navigate to entity), trigger notifications on new posts/announcements/guidelines/chat | ~3 days |
| **Phase 7: Admin Dashboard** | User statistics, barangay-wise breakdown, role distribution chart, user list by barangay | ~3 days |
| **Phase 8: Settings** | Theme selection (8 color options), dark mode toggle, language switching (English/Filipino/Bisaya via i18next), notification preferences, persist to AsyncStorage | ~2 days |

### Timeline Summary

| Who | Phases | Est. Time |
|-----|--------|-----------|
| Jayson | Phase 0-4 (MVP) | ~18 days |
| Ivan | Phase 5-8 (Post-MVP) | ~12 days |
| Both | Integration testing + bug fixes | ~5 days |
| | **Total to merge-ready** | **~5-6 weeks** |

### Collaboration Model

1. Jayson builds foundation (Phase 0) first (~3 days)
2. Design doc shared with Ivan immediately so he can review architecture, schema, and conventions
3. Once Phase 0 is committed to `react-migration`, Ivan branches off and starts Post-MVP in parallel
4. Both merge to `react-migration` regularly to stay in sync
5. Final integration testing together before merging `react-migration` to `main`

---

## Feature Parity Mapping

How each Flutter feature maps to the React Native implementation:

| Flutter (Current) | React Native (New) |
|---|---|
| `firebase_auth` | Supabase Auth (`@supabase/supabase-js`) |
| `cloud_firestore` | Supabase Postgres + Realtime |
| `firebase_storage` (unused) + base64 in Firestore | Supabase Storage (proper file URLs) |
| `flutter_map` + ESRI tiles | `react-native-maps` + ESRI tiles |
| `location` | `expo-location` |
| `geocoding` | `expo-location` reverse geocoding |
| `image_picker` | `expo-image-picker` |
| `shared_preferences` | `@react-native-async-storage/async-storage` |
| `fl_chart` | `react-native-chart-kit` |
| `ChangeNotifier` / `Provider` | Zustand + React Context |
| Material Design 3 widgets | NativeWind (Tailwind CSS) |
| `Navigator` push/pop | Expo Router (file-based) |
| `firestore.rules` | Supabase RLS policies |
| Dart | TypeScript |

---

## Screens Inventory

### MVP Screens (Jayson)

**Auth (3 screens)**
- Login (role selection + email/password)
- Sign Up (name, email, password, address fields)
- Email Verification (polling + resend)

**Farmer - Marketplace (4 screens)**
- Marketplace List (search, filter by category, "My Posts" toggle)
- Post Detail (images, description, seller info, comments)
- Post Form (create/edit with image upload + location picker)
- Location Picker (map-based location selection)

**Farmer - Map (1 screen)**
- Home / Map View (satellite map with livestock markers, legend, zoom)

**Farmer - Guidelines (5 screens)**
- Guidelines Hub (toggle health/feeding)
- Health Guidelines List (search, filter)
- Health Guideline Detail (disease, symptoms, treatment, prevention)
- Feeding Categories List
- Feeding Detail (schedule, nutrition, best practices, supplements)

**Farmer - Profile (1 screen)**
- Profile View/Edit (avatar, name, address, stats)

**Admin - Content Management (4 screens)**
- Announcements List + Create/Edit
- Health Guidelines List + Create/Edit
- Feeding Info List + Create/Edit
- Admin Map View

**MVP Total: 18 screens**

### Post-MVP Screens (Ivan)

**Chat (2 screens)**
- Chat List (conversations with last message preview)
- Private Message (real-time messaging)

**Notifications (1 screen)**
- Notification Center (list, mark read, navigate)

**Admin (1 screen)**
- Admin Dashboard (stats, charts, barangay breakdown)

**Settings (1 screen)**
- Settings (theme, dark mode, language, notifications)

**Post-MVP Total: 5 screens**

**Grand Total: 23 screens** (down from 32 in Flutter due to consolidation)

---

## Supabase Project Configuration

- **Project:** New Supabase project (free tier)
- **Region:** Southeast Asia (Singapore) — closest to Bukidnon, Philippines
- **Auth:** Email/password provider enabled, email verification enabled
- **Storage buckets:** `avatars` (public read), `livestock-images` (public read)
- **Realtime:** Enabled for `chats`, `messages`, `notifications` tables
- **Database:** All tables created via SQL migrations in `supabase/migrations/`
