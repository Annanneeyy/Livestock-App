# Livestock App — Capstone Q&A

*Municipality of Quezon, Bukidnon | React Native + Supabase*

---

## 📌 Section 1: Project Overview

**Q1: What is the Livestock App?**
> A mobile and web application built for the Municipality of Quezon, Bukidnon that allows local farmers to list and sell swine livestock, communicate with buyers, and receive health and feeding guidelines from administrators.

**Q2: What problem does this capstone project solve?**
> It addresses the lack of a centralized digital platform for swine livestock trading in Quezon, Bukidnon. Farmers previously relied on informal word-of-mouth to buy and sell livestock. The app digitizes this process with a marketplace, real-time messaging, geolocation mapping, and admin-managed health advisories.

**Q3: Who are the target users?**
> - **Farmers/Sellers**: Local swine farmers who want to post and sell their livestock.
> - **Buyers**: Community members looking to purchase swine.
> - **Administrators**: Municipal agriculture office staff who manage content, monitor activity, and oversee user roles.

**Q4: What are the two versions of the app in the repository?**
> - **React Native (Active)**: Located in `livestock-rn/`, built with Expo and Supabase. This is the current, production-ready version.
> - **Flutter (Legacy)**: Located in the root directory, built with Firebase. This is the older, deprecated version.

**Q5: Which municipalities and barangays does the app serve?**
> The app serves the **Municipality of Quezon, Bukidnon** (zip code: 8715) and covers 19 barangays: Apyao, Butong, Cawayan, Cebule, Dalurong, Delapa, Kiburiao, Libertad, Lumitao, Merangeran, Minbantang, Minongan, Palacapao, Puntian, Salawagan, San Jose, San Roque, Sta. Cruz, and Tugas.

---

## 🛠️ Section 2: Technology Stack

**Q6: What technologies are used in the React Native version?**
> | Layer | Technology |
> |---|---|
> | Framework | React Native 0.81.5 via Expo ~54.0.34 |
> | Navigation | Expo Router ~6.0.23 (file-based routing) |
> | Backend | Supabase (Auth, Database, Storage, Realtime) |
> | Styling | NativeWind v4 (Tailwind CSS for RN) |
> | Language | TypeScript |
> | State | React Context API + Custom Hooks |
> | Maps (Native) | react-native-maps 1.20.1 |
> | Maps (Web) | Leaflet via react-leaflet |
> | Charts | react-native-gifted-charts |
> | i18n | i18next + react-i18next |

**Q7: Why was Supabase chosen over Firebase?**
> Supabase provides a relational PostgreSQL database with built-in Row Level Security (RLS), which is better suited for enforcing role-based data access (farmer vs. admin). It also offers a free tier, real-time subscriptions, and a familiar SQL query model. Firebase was used in the older Flutter version but lacked the flexible relational querying needed for this app.

**Q8: Why was Expo used instead of bare React Native?**
> Expo simplifies cross-platform development (iOS, Android, and Web) from a single codebase. It provides managed workflows, over-the-air updates, and EAS (Expo Application Services) for cloud builds without requiring local Android Studio or Xcode setups.

**Q9: Why is NativeWind used for styling?**
> NativeWind brings Tailwind CSS utility classes to React Native, enabling rapid, consistent styling without writing StyleSheet objects for every component. It supports dark mode via the `dark:` prefix and keeps UI code clean and readable.

**Q10: What is Expo Router and why is it used?**
> Expo Router is a file-system-based navigation library (similar to Next.js) where the folder and file structure in `app/` automatically defines the navigation routes. It supports nested layouts, route groups (e.g., `(admin)`, `(farmer)`, `(auth)`), and web URL deep-linking out of the box.

---

## 🏗️ Section 3: Architecture & Project Structure

**Q11: What is the folder structure of `livestock-rn/`?**
> ```
> livestock-rn/
> ├── app/                  # All screens & navigation (Expo Router)
> │   ├── (admin)/          # Admin-only screens
> │   ├── (farmer)/         # Farmer/buyer screens
> │   ├── (auth)/           # Login, signup, password reset
> │   ├── _layout.tsx       # Root layout with auth gate
> │   └── index.tsx         # App entry point
> ├── components/           # Reusable UI components
> ├── lib/
> │   ├── context/          # Global state (AuthContext)
> │   ├── hooks/            # Custom data hooks
> │   ├── translations/     # i18n JSON files
> │   ├── supabase.ts       # Supabase client
> │   └── i18n.ts           # i18n initialization
> ├── constants/            # Theme colors, barangays, categories
> ├── types/                # TypeScript interfaces
> └── supabase/             # Database schema SQL
> ```

**Q12: What are the two user role groups and what screens do they access?**
> - **Admin `(admin)/`**: Map, Dashboard (Stats), Marketplace, Manage (Announcements, Health, Feeding), Chats, Settings (Profile, Admins, Notifications).
> - **Farmer `(farmer)/`**: Home (Map), Marketplace, Guidelines (Health, Feeding), Chats, Profile.

**Q13: What is the `AuthGate` component and what does it do?**
> `AuthGate` is the root-level component in `app/_layout.tsx` that reads the current authentication state (`session`, `profile`, `loading`) and automatically redirects users to the correct section of the app. Unauthenticated users go to `/(auth)/login`, verified admins go to `/(admin)/map`, and verified farmers go to `/(farmer)/home`.

**Q14: What is `AuthContext` and why was it created?**
> `AuthContext` (in `lib/context/AuthContext.tsx`) is a React Context provider that manages global authentication state — session, user, and profile — in a single place. It was created to fix a Web UI bug where multiple components each called `useAuth()` independently, causing race conditions and requiring a manual page refresh to load content.

**Q15: What custom hooks are in the project?**
> | Hook | Purpose |
> |---|---|
> | `useAuth` | Access global auth state and auth actions |
> | `useTheme` | Get/set light or dark mode preference |
> | `useLivestockList` | Fetch filtered livestock listings |
> | `useLivestockDetail` | Fetch a single livestock + its comments |
> | `useChatList` | Fetch all chat conversations for the current user |
> | `useChatMessages` | Fetch messages for a specific chat with realtime updates |
> | `useUnreadCount` | Get total unread message count across all chats |
> | `useNotifications` | Fetch and manage in-app notifications |
> | `useAdminStats` | Fetch aggregate dashboard analytics data |

---

## 🔒 Section 4: Authentication & Security

**Q16: How does user registration work?**
> Users register via the Sign Up screen providing: First Name, Last Name, Email, Password (min 8 characters), Gender (optional), Purok (optional), and Barangay (optional). After submission, Supabase sends a verification email. Users must verify their email before they can log in.

**Q17: What happens after a user verifies their email?**
> After email verification, the user's profile is automatically created in the `profiles` table via a Supabase PostgreSQL trigger (`on_auth_user_created`). The profile stores the user's role, name, and address information.

**Q18: What are the user roles and how are they assigned?**
> There are two roles: `farmer` (default) and `admin`. When a user registers, they are assigned the `farmer` role automatically. Administrators can promote a farmer to `admin` using the "Manage Admins" screen, which calls a secure Supabase RPC function `update_user_role`.

**Q19: What is Row Level Security (RLS) and how is it used?**
> RLS is a PostgreSQL feature that restricts which rows a user can read, insert, update, or delete based on database policies. In this app, RLS ensures that:
> - Users can only edit/delete their own livestock listings.
> - Users can only read their own notifications.
> - Only admins can create announcements, health guidelines, and feeding information.
> - Admin role changes require the `update_user_role` RPC function to bypass standard RLS restrictions.

**Q20: Why is `update_user_role` implemented as an RPC function?**
> Direct `UPDATE` on the `profiles` table is restricted by RLS to prevent users from changing their own role. An RPC (Remote Procedure Call) function runs with `SECURITY DEFINER` privileges (elevated database-level permissions), allowing it to bypass the normal user-level RLS policies safely and only when called by an authenticated admin.

**Q21: How does the Forgot Password / Password Reset flow work?**
> 1. User enters email on the Forgot Password screen.
> 2. Supabase sends an email with a **6-digit OTP code**.
> 3. User enters the code on the Verify OTP screen.
> 4. If valid, the user is redirected to the Reset Password screen where they set a new password.
> 5. The app calls `supabase.auth.updateUser({ password })` to finalize the change.

**Q22: Can an admin revoke their own admin access?**
> No. The "Manage Admins" screen includes a security check: if the logged-in admin attempts to demote their own account, the action is blocked with a warning message — *"For security reasons, you cannot revoke your own administrative access while logged in."* — to prevent accidental lockouts.

---

## 🗄️ Section 5: Database Schema

**Q23: What are the main database tables?**
> | Table | Purpose |
> |---|---|
> | `profiles` | User information and roles |
> | `livestock` | Livestock listings with price, location, category |
> | `livestock_images` | Images linked to livestock listings |
> | `comments` | User comments on livestock listings |
> | `chats` | Chat conversations between two users |
> | `messages` | Individual messages within a chat |
> | `announcements` | Admin-posted public announcements |
> | `health_guidelines` | Disease info: symptoms, treatment, prevention |
> | `feeding_info` | Feeding schedules, nutrition, and best practices |
> | `notifications` | In-app notifications for users |

**Q24: What are the livestock categories supported?**
> Three swine categories: **Baktin** (piglets 🐷), **Lechonon** (roasting pigs 🐖), and **Lapaon** (mature/fattened pigs 🐽). Each has a distinct emoji marker on the map.

**Q25: What data is stored in a livestock listing?**
> `id`, `seller_id`, `name`, `category`, `price`, `description`, `contact`, `latitude`, `longitude`, `location_text`, `is_available`, `created_at`, `updated_at`. Images are stored separately in the `livestock_images` table linked by `livestock_id`.

**Q26: What Supabase Storage buckets are used?**
> Three storage buckets: **`avatars`** (user profile photos), **`livestock-images`** (photos attached to listings), and **`chat-images`** (images sent in chat conversations).

**Q27: How is the "sold" status of a listing managed?**
> Listings have an `is_available` boolean column. When a seller marks an item as sold, this is set to `false`. The app uses a "soft delete" approach — listings are never permanently removed from the database, only hidden from the available listings view.

---

## 🗺️ Section 6: Map Feature

**Q28: How does the map work across platforms?**
> The map uses a **platform-specific component swap** pattern:
> - **Native (iOS/Android)**: Uses `react-native-maps` with Google Maps / Apple Maps provider.
> - **Web**: Uses `react-leaflet` (Leaflet.js). The file `NativeMap.web.tsx` is automatically loaded by Metro bundler on web instead of `NativeMap.tsx`.

**Q29: What map tiles are used?**
> **ESRI World Imagery** satellite tiles (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`) for a real-world aerial view of Quezon, Bukidnon.

**Q30: What is the default map center?**
> Latitude: `7.7306`, Longitude: `125.0975` — the geographic center of Quezon, Bukidnon.

**Q31: How do map markers work on Web vs Native?**
> - **Native**: Custom `<View>` components are used as marker children with emoji icons inside circular white bubbles.
> - **Web (Leaflet)**: Custom `L.divIcon` HTML markers are generated dynamically using the same emoji icons, ensuring visual consistency across platforms.

**Q32: What is the Radius Filter feature?**
> Users can filter map listings by distance from their current GPS location. Options are: **Any** (no filter), **5km**, **10km**, **25km**, and **50km**. Distance is calculated using the Haversine formula. If a radius is selected but location permission is denied, a warning is shown and listings are hidden.

**Q33: What happens to listings without GPS coordinates?**
> Listings without latitude/longitude coordinates are classified as "unmapped." They still appear in the list view with a "📍 No location" badge, but are not placed on the map. They are excluded when a radius filter is active.

---

## 🛒 Section 7: Marketplace Feature

**Q34: How do farmers create a livestock listing?**
> From the Marketplace screen, farmers tap the green **+** FAB (floating action button) which navigates to a Create Listing form. They fill in the name, category, price, description, contact number, and optionally attach photos and pin a GPS location on the map.

**Q35: How are listing images uploaded?**
> - **On Native**: Images are read as Base64 strings using `expo-file-system`, decoded using `base64-arraybuffer`, and uploaded to Supabase Storage.
> - **On Web**: Images are fetched as Blobs and uploaded directly.
> - The resulting public URLs are saved in the `livestock_images` table.

**Q36: What filters are available in the Marketplace?**
> - **Search**: Free-text search on listing name and description.
> - **Category**: Filter by Baktin, Lechonon, or Lapaon.
> - **My Posts**: Toggle to show only the current user's own listings.
> - **Hide Sold**: Toggle to show only available (unsold) listings.

**Q37: Can farmers edit or delete their listings?**
> Yes. On the listing detail screen, the seller sees Edit and Delete options. Editing allows updating all fields and replacing images. Deletion uses a soft-delete (sets `is_available = false`).

**Q38: What is the comment section?**
> Each livestock listing has a comment section where logged-in users can post questions or remarks visible to all. Both the listing owner and admins can delete any comment.

---

## 💬 Section 8: Chat Feature

**Q39: How does the chat system work?**
> Users can start a private 1-on-1 chat from a livestock listing's detail page by tapping "Chat with Seller." The `getOrCreateChat()` function checks if a conversation already exists between the two users; if not, it creates a new one. Messages are sent and received in real time.

**Q40: How is real-time messaging implemented?**
> The `useChatMessages` hook subscribes to Supabase Realtime's `postgres_changes` event on the `messages` table, filtered by `chat_id`. When a new message is inserted, the hook re-fetches and updates the UI instantly without requiring a manual refresh.

**Q41: How are unread messages tracked?**
> Each message has an `is_read` boolean column. When a user opens a chat, all messages sent by the other participant in that chat are automatically marked as read via an `UPDATE` query. The chat list shows an unread badge count for each conversation.

**Q42: Can images be sent in chat?**
> Yes. Users can select and send images within a chat conversation. Images are uploaded to the `chat-images` Supabase Storage bucket and the public URL is stored in the `image_url` column of the `messages` table.

---

## 📢 Section 9: Admin Content Management

**Q43: What content can administrators manage?**
> Admins have a dedicated **Manage** tab with three sections:
> 1. **Announcements** — General notices to all users.
> 2. **Health Guidelines** — Swine disease info: disease name, symptoms, treatment, prevention.
> 3. **Feeding Information** — Category-specific feeding schedules, feed types, nutrition requirements, best practices, and supplements.

**Q44: How are announcements and guidelines delivered to farmers?**
> When an admin creates content, a notification is automatically triggered (via Supabase database trigger or function) and sent to all users. The `notifications` table stores the notification type, title, message, and a `related_id` linking back to the original content.

**Q45: What is the Dashboard for admins?**
> The Dashboard (`/admin/dashboard`) shows analytics charts using `react-native-gifted-charts`:
> - **Pie Chart**: Role distribution (admin vs. farmer).
> - **Bar Chart**: Livestock count per barangay.
> - **Line Chart**: User registration trend over the last 6 months.
> - **Category Sales**: Total market value per livestock category (Baktin, Lechonon, Lapaon).

---

## 🌐 Section 10: Web Support

**Q46: Is the app fully functional as a web app?**
> Yes. The app runs on web via `npx expo start --web`. It has responsive layouts — on screens wider than 768px, a sidebar replaces the bottom tab bar. The sidebar can be minimized to icon-only view.

**Q47: How does the sidebar work on Web?**
> The `WebSidebar` component is rendered only when `Platform.OS === 'web'` and screen width `> 768px`. It is injected in the admin layout alongside the `<Tabs>` navigator. It uses `usePathname()` to highlight the active route and supports collapse/expand via a toggle button.

**Q48: What was causing the "need to refresh" bug on Web?**
> Three root causes were identified and fixed:
> 1. **Storage mismatch**: `AsyncStorage` (async, RN polyfill) was being used on Web instead of the native synchronous `window.localStorage`. Fixed in `lib/supabase.ts`.
> 2. **Race condition**: The `useAuth` hook was being instantiated independently in multiple components, creating competing async calls. Fixed by centralizing state in `AuthContext`.
> 3. **Router not ready**: The Expo Router's segments were empty during initial hydration on Web, causing incorrect redirects. Fixed by checking `useRootNavigationState().key` before redirecting.

**Q49: How are platform differences handled in the codebase?**
> Two strategies are used:
> - **`Platform.OS` checks**: Inline code like `if (Platform.OS === 'web')` to use `alert()` vs `Alert.alert()`, `confirm()` vs `Alert.alert()`, etc.
> - **Platform-specific files**: Metro bundler automatically picks `NativeMap.web.tsx` on web and `NativeMap.tsx` on native, providing completely different map implementations per platform.

---

## 🌍 Section 11: Localization

**Q50: What languages does the app support?**
> Three languages: **English (en)**, **Filipino (fil)**, and **Bisaya/Cebuano (bis)**. Language preference is saved to `AsyncStorage` and persists across sessions.

**Q51: How is the language changed?**
> From the Settings screen, users select their preferred language. The app calls `i18n.changeLanguage(lng)` and saves the selection to `AsyncStorage` with the key `user-language`.

**Q52: What parts of the UI are translated?**
> Navigation labels, settings options, common actions (Save, Cancel, Loading, Error), marketplace search placeholder, and auth-related messages. Some dynamic content (e.g., listing names, admin-posted content) remains in the language it was written in.

---

## 🌙 Section 12: Theme / Dark Mode

**Q53: Does the app support dark mode?**
> Yes. The app supports **Light** and **Dark** themes. The preference is saved to `AsyncStorage` with the key `user-theme`. The `useTheme` hook manages reading and writing the preference via NativeWind's `setColorScheme`.

**Q54: How is dark mode applied?**
> NativeWind uses the `dark:` prefix (e.g., `dark:bg-gray-900`, `dark:text-white`) directly on component class names. The root-level `colorScheme` setting switches the entire UI without per-component conditional logic.

---

## 📱 Section 13: Build & Deployment

**Q55: How do you run the app locally?**
> ```bash
> cd livestock-rn
> npm install
> npx expo start --clear
> # Press 'w' for web, 'a' for Android emulator, 'i' for iOS simulator
> ```

**Q56: How do you build an Android APK?**
> ```bash
> npm run build:apk
> # Uses EAS Build with the 'preview' profile to generate a .apk file
> ```

**Q57: What is EAS?**
> EAS (Expo Application Services) is a cloud-based build and submission service. It compiles the React Native app into native binaries (APK for Android, IPA for iOS) without requiring a local Mac or Android Studio environment.

**Q58: What environment variables are required?**
> Two variables in a `.env` file inside `livestock-rn/`:
> ```env
> EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
> EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
> ```

**Q59: What Supabase setup is required after creating a project?**
> 1. Run the full `supabase/schema.sql` in the Supabase SQL Editor.
> 2. Update the **Reset Password** email template to use `{{ .Token }}` (OTP-based reset).
> 3. Enable **Realtime** for `chats`, `messages`, and `notifications` tables.
> 4. Confirm the `avatars`, `livestock-images`, and `chat-images` storage buckets were created.

---

## 🧪 Section 14: Common Issues & Troubleshooting

**Q60: Why does the web app show a blank screen or spinner on first load?**
> This was a known bug caused by `AsyncStorage` being used as Supabase's session storage on Web (async initialization creates a race condition). It is fixed in `lib/supabase.ts` by using `window.localStorage` on web. Additionally, a global `AuthContext` ensures session state is resolved before routing decisions are made.

**Q61: Why are user profiles not being created after signup?**
> The `on_auth_user_created` database trigger may not have been set up. Apply the full schema from `supabase/schema.sql` in the Supabase SQL Editor.

**Q62: Why is the role update (promote/demote admin) failing?**
> The `update_user_role` RPC function must exist in the Supabase database. Look for it at the end of `schema.sql` and run it in the SQL Editor if it is missing.

**Q63: Why are chat messages not arriving in real time?**
> Supabase Realtime must be enabled for the `messages` table. Go to **Supabase Dashboard → Database → Replication** and enable the `messages` table.

**Q64: Why is the password reset email sending a link instead of a code?**
> The Supabase **Reset Password** email template must be customized. Replace the default link in the template body with `{{ .Token }}` to send a 6-digit OTP code instead.

**Q65: Why does the map not show on Web?**
> Ensure that `leaflet/dist/leaflet.css` is imported in `NativeMap.web.tsx`. Missing the CSS import causes the map tiles to render but markers and the map view to appear broken or collapsed.

---

## 💡 Section 15: Design & UX Decisions

**Q66: Why are swine the only livestock category (not cattle, poultry, etc.)?**
> The app is scoped specifically to the swine industry of Quezon, Bukidnon, which is the primary livestock traded in the municipality. Future versions could expand categories.

**Q67: Why does the map use satellite imagery instead of street view?**
> ESRI satellite imagery provides better real-world context for rural barangay areas in Quezon, Bukidnon where street-level map data (roads, labels) may be incomplete in OpenStreetMap.

**Q68: Why is the "My Posts" toggle in the marketplace instead of a separate screen?**
> Consolidating all listings into one filtered list reduces navigation complexity. Farmers can quickly switch between browsing all listings and managing their own without leaving the marketplace.

**Q69: Why is the delete operation a soft-delete rather than a hard delete?**
> Soft-delete preserves data integrity and allows future features like sales history reporting. Hard-deleting a listing would remove associated images, comments, and chat references, potentially causing broken references in other users' chats.

**Q70: Why does the app request GPS location only for the radius filter?**
> Location access is requested on-demand to respect user privacy. It is only triggered when a user selects a radius filter option (5km, 10km, etc.), not on initial app load. If denied, the filter shows a warning and hides radius-filtered results.

---

*Document created: 2026-05-10 | Version: 1.0.0 | Livestock App Capstone — Quezon, Bukidnon*
