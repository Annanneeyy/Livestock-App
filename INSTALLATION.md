# Livestock App - Installation & Setup Guide

This document provides step-by-step instructions to set up and run the Livestock App project. The project consists of a React Native mobile application (Expo) and a Supabase backend.

> [!NOTE]
> The root directory also contains a Flutter version of the app (using Firebase). This guide focuses on the React Native version located in the `livestock-rn` directory, which uses Supabase.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Expo Go** app (on your iOS or Android device for testing)
- **Supabase Account** (Sign up at [supabase.com](https://supabase.com))

---

## 2. Backend Setup (Supabase)

The backend uses Supabase for Authentication, Database, and Storage.

### Step 2.1: Create a Supabase Project
1. Go to the [Supabase Dashboard](https://app.supabase.com/).
2. Click **New Project** and select your organization.
3. Name your project (e.g., `Livestock-Market`) and set a secure database password.
4. Select a region close to you.
5. Click **Create new project**.

### Step 2.2: Apply the Database Schema
1. Once your project is ready, go to the **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire content of [livestock-rn/supabase/schema.sql](./livestock-rn/supabase/schema.sql).
4. Paste it into the editor and click **Run**.
   - *Note: This will create all necessary tables, indexes, RLS policies, triggers, and storage buckets.*

---

## 3. Frontend Setup (React Native / Expo)

The mobile application is built using Expo.

### Step 3.1: Navigate to the project directory
```bash
cd livestock-rn
```

### Step 3.2: Install Dependencies
```bash
npm install
```

### Step 3.3: Configure Environment Variables
1. Find your Supabase URL and Anon Key:
   - In Supabase, go to **Project Settings** > **API**.
   - Copy the **Project URL** and **anon public** key.
2. Create a `.env` file in the `livestock-rn` directory (if it doesn't exist).
3. Add the following variables:
```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

## 4. Running the Application

### Step 4.1: Start the Development Server
```bash
npx expo start
```

### Step 4.2: Open on your device
- **Android/iOS**: Scan the QR code using the **Expo Go** app.
- **Web**: Press `w` in the terminal to open in your browser.
- **Android Emulator**: Press `a`.
- **iOS Simulator**: Press `i`.

---

## 5. Project Structure

- `lib/`: Shared logic and utility functions.
- `app/`: Expo Router pages and navigation.
- `components/`: Reusable UI components.
- `constants/`: Theme, colors, and configuration.
- `supabase/`: Backend migrations and compiled schema.

---

## 6. Troubleshooting

- **Storage Errors**: Ensure that the `avatars`, `livestock-images`, and `chat-images` buckets were created in Supabase (the SQL schema should have done this automatically).
- **Authentication**: If user profiles are not being created upon signup, check the `on_auth_user_created` trigger in the SQL Editor.
- **Realtime**: If chat or notifications are not updating instantly, ensure "Realtime" is enabled for the `chats`, `messages`, and `notifications` tables in the Supabase Dashboard under **Database** > **Replication**.

---

*Document generated on 2026-04-07*
