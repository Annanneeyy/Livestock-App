/**
 * Firebase → Supabase Migration Script
 *
 * Migrates all data from the Livestock App Firebase project to Supabase.
 *
 * Required env vars:
 *   FIREBASE_SERVICE_ACCOUNT_PATH — path to Firebase service account JSON
 *   SUPABASE_URL — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (NOT anon key)
 *
 * Usage:
 *   cd scripts
 *   npm install
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json \
 *   SUPABASE_URL=https://your-project.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
 *   npm run migrate
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ─── Config ────────────────────────────────────────────────────────────────

const FIREBASE_SA_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FIREBASE_SA_PATH || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: FIREBASE_SERVICE_ACCOUNT_PATH, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(FIREBASE_SA_PATH, 'utf-8')) as ServiceAccount;
initializeApp({ credential: cert(serviceAccount) });

const firestore = getFirestore();
const firebaseAuth = getAuth();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function firestoreTimestampToISO(ts: any): string | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  return null;
}

// ─── Step 1: Migrate Auth Users ────────────────────────────────────────────

async function migrateAuthUsers(): Promise<Record<string, string>> {
  console.log('\n═══ Step 1: Migrating Auth Users ═══');
  const uidMap: Record<string, string> = {};
  let migrated = 0;
  let failed = 0;

  let pageToken: string | undefined;
  do {
    const listResult = await firebaseAuth.listUsers(1000, pageToken);

    for (const user of listResult.users) {
      try {
        // Create user in Supabase with the same email
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email!,
          email_confirm: user.emailVerified,
          password: undefined, // Users will need to use "Forgot Password"
          user_metadata: {
            first_name: user.displayName?.split(' ')[0] || '',
            last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'farmer', // Default, will be updated from Firestore profiles
          },
        });

        if (error) {
          // If user already exists, try to find them
          if (error.message?.includes('already been registered')) {
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existing = existingUsers?.users?.find(u => u.email === user.email);
            if (existing) {
              uidMap[user.uid] = existing.id;
              migrated++;
              continue;
            }
          }
          console.error(`  ✗ ${user.email}: ${error.message}`);
          failed++;
          continue;
        }

        uidMap[user.uid] = data.user.id;
        migrated++;
      } catch (err: any) {
        console.error(`  ✗ ${user.email}: ${err.message}`);
        failed++;
      }
    }

    pageToken = listResult.pageToken;
  } while (pageToken);

  console.log(`  ✓ Migrated: ${migrated} | Failed: ${failed}`);
  return uidMap;
}

// ─── Step 2: Migrate Profiles ──────────────────────────────────────────────

async function migrateProfiles(uidMap: Record<string, string>) {
  console.log('\n═══ Step 2: Migrating Profiles ═══');
  const snapshot = await firestore.collection('users').get();
  let migrated = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const supabaseId = uidMap[doc.id];

    if (!supabaseId) {
      console.error(`  ✗ No Supabase ID for Firebase UID ${doc.id}`);
      failed++;
      continue;
    }

    try {
      const profile: Record<string, any> = {
        id: supabaseId,
        first_name: data.firstName || data.first_name || '',
        last_name: data.lastName || data.last_name || '',
        role: data.role || 'farmer',
        gender: data.gender || null,
        birth_date: data.birthDate || data.birth_date || null,
        purok: data.address?.purok || data.purok || null,
        barangay: data.address?.barangay || data.barangay || null,
        municipality: data.address?.municipality || data.municipality || 'Quezon',
        zip_code: data.address?.zipCode || data.zip_code || '8715',
      };

      // Upload avatar if exists (base64 profile image)
      if (data.profileImage && typeof data.profileImage === 'string' && data.profileImage.length > 100) {
        try {
          const buffer = Buffer.from(data.profileImage, 'base64');
          const fileName = `${supabaseId}/avatar.jpg`;

          await supabase.storage.from('avatars').upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          profile.avatar_url = urlData.publicUrl;
        } catch (imgErr: any) {
          console.error(`  ⚠ Avatar upload failed for ${doc.id}: ${imgErr.message}`);
        }
      }

      // Update the role in auth metadata too
      await supabase.auth.admin.updateUserById(supabaseId, {
        user_metadata: { role: profile.role, first_name: profile.first_name, last_name: profile.last_name },
      });

      const { error } = await supabase.from('profiles').upsert(profile);
      if (error) throw error;
      migrated++;
    } catch (err: any) {
      console.error(`  ✗ Profile ${doc.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`  ✓ Migrated: ${migrated} | Failed: ${failed}`);
}

// ─── Step 3: Migrate Admin Content ─────────────────────────────────────────

async function migrateAdminContent(uidMap: Record<string, string>) {
  console.log('\n═══ Step 3: Migrating Admin Content ═══');

  // Announcements
  const annSnapshot = await firestore.collection('announcements').get();
  let annMigrated = 0;
  for (const doc of annSnapshot.docs) {
    const data = doc.data();
    try {
      const { error } = await supabase.from('announcements').upsert({
        title: data.title || 'Untitled',
        description: data.description || null,
        content: data.content || null,
        posted_by: uidMap[data.postedBy] || uidMap[data.posted_by] || Object.values(uidMap)[0],
        created_at: firestoreTimestampToISO(data.createdAt) || new Date().toISOString(),
        updated_at: firestoreTimestampToISO(data.updatedAt) || new Date().toISOString(),
      });
      if (error) throw error;
      annMigrated++;
    } catch (err: any) {
      console.error(`  ✗ Announcement ${doc.id}: ${err.message}`);
    }
  }
  console.log(`  Announcements: ${annMigrated}`);

  // Health Guidelines
  const healthSnapshot = await firestore.collection('health_guidelines').get();
  let healthMigrated = 0;
  for (const doc of healthSnapshot.docs) {
    const data = doc.data();
    try {
      const { error } = await supabase.from('health_guidelines').upsert({
        disease: data.disease || 'Unknown',
        symptoms: data.symptoms || null,
        treatment: data.treatment || null,
        prevention: data.prevention || null,
        posted_by: uidMap[data.postedBy] || uidMap[data.posted_by] || Object.values(uidMap)[0],
        created_at: firestoreTimestampToISO(data.createdAt) || new Date().toISOString(),
        updated_at: firestoreTimestampToISO(data.updatedAt) || new Date().toISOString(),
      });
      if (error) throw error;
      healthMigrated++;
    } catch (err: any) {
      console.error(`  ✗ Health guideline ${doc.id}: ${err.message}`);
    }
  }
  console.log(`  Health Guidelines: ${healthMigrated}`);

  // Feeding Info
  const feedingSnapshot = await firestore.collection('feeding_info').get();
  let feedingMigrated = 0;
  for (const doc of feedingSnapshot.docs) {
    const data = doc.data();
    // Normalize category spelling
    let category = data.category || 'Baktin';
    if (category === 'Letchonon') category = 'Lechonon';

    try {
      const { error } = await supabase.from('feeding_info').upsert({
        name: data.name || 'Unnamed',
        category,
        description: data.description || null,
        feed_type: data.feedType || data.feed_type || null,
        feeding_schedule: data.feedingSchedule || data.feeding_schedule || null,
        nutritional_requirement: data.nutritionalRequirement || data.nutritional_requirement || null,
        feeding_best_practices: data.feedingBestPractices || data.feeding_best_practices || null,
        supplements_additives: data.supplementsAdditives || data.supplements_additives || null,
        posted_by: uidMap[data.postedBy] || uidMap[data.posted_by] || Object.values(uidMap)[0],
        created_at: firestoreTimestampToISO(data.createdAt) || new Date().toISOString(),
        updated_at: firestoreTimestampToISO(data.updatedAt) || new Date().toISOString(),
      });
      if (error) throw error;
      feedingMigrated++;
    } catch (err: any) {
      console.error(`  ✗ Feeding info ${doc.id}: ${err.message}`);
    }
  }
  console.log(`  Feeding Info: ${feedingMigrated}`);
}

// ─── Step 4: Migrate Livestock ─────────────────────────────────────────────

async function migrateLivestock(uidMap: Record<string, string>) {
  console.log('\n═══ Step 4: Migrating Livestock ═══');
  const snapshot = await firestore.collection('livestock').get();
  let migrated = 0;
  let imageCount = 0;
  let commentCount = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const sellerId = uidMap[data.sellerId] || uidMap[data.seller_id];

    if (!sellerId) {
      console.error(`  ✗ No seller mapping for livestock ${doc.id}`);
      failed++;
      continue;
    }

    try {
      // Insert livestock record
      const { data: inserted, error } = await supabase
        .from('livestock')
        .insert({
          seller_id: sellerId,
          name: data.name || 'Unnamed',
          category: data.category || 'Baktin',
          price: parseFloat(data.price) || 0,
          description: data.description || null,
          contact: data.contact || null,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
          location_text: data.locationText || data.location_text || null,
          is_available: data.isAvailable !== false,
          created_at: firestoreTimestampToISO(data.createdAt) || new Date().toISOString(),
          updated_at: firestoreTimestampToISO(data.updatedAt) || new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      const livestockId = inserted.id;

      // Migrate images (base64 → Supabase Storage)
      const imageSources: string[] = [];
      if (data.imageBase64) imageSources.push(data.imageBase64);
      if (data.imageBase64List && Array.isArray(data.imageBase64List)) {
        imageSources.push(...data.imageBase64List);
      }

      for (let i = 0; i < imageSources.length; i++) {
        try {
          const base64 = imageSources[i];
          if (!base64 || base64.length < 100) continue;

          const buffer = Buffer.from(base64, 'base64');
          const fileName = `${livestockId}/${i}.jpg`;

          const { error: uploadErr } = await supabase.storage
            .from('livestock-images')
            .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

          if (uploadErr) {
            console.error(`  ⚠ Image upload ${doc.id}[${i}]: ${uploadErr.message}`);
            continue;
          }

          const { data: urlData } = supabase.storage.from('livestock-images').getPublicUrl(fileName);

          await supabase.from('livestock_images').insert({
            livestock_id: livestockId,
            image_url: urlData.publicUrl,
            sort_order: i,
          });
          imageCount++;
        } catch (imgErr: any) {
          console.error(`  ⚠ Image ${doc.id}[${i}]: ${imgErr.message}`);
        }
      }

      // Migrate comments subcollection
      const commentsSnapshot = await firestore
        .collection('livestock')
        .doc(doc.id)
        .collection('comments')
        .get();

      for (const commentDoc of commentsSnapshot.docs) {
        const cData = commentDoc.data();
        const commentUserId = uidMap[cData.userId] || uidMap[cData.user_id];
        if (!commentUserId) continue;

        try {
          await supabase.from('comments').insert({
            livestock_id: livestockId,
            user_id: commentUserId,
            text: cData.text || cData.comment || '',
            created_at: firestoreTimestampToISO(cData.createdAt) || new Date().toISOString(),
          });
          commentCount++;
        } catch (cErr: any) {
          console.error(`  ⚠ Comment ${commentDoc.id}: ${cErr.message}`);
        }
      }

      migrated++;
    } catch (err: any) {
      console.error(`  ✗ Livestock ${doc.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`  ✓ Livestock: ${migrated} | Images: ${imageCount} | Comments: ${commentCount} | Failed: ${failed}`);
}

// ─── Step 5: Migrate Chats ─────────────────────────────────────────────────

async function migrateChats(uidMap: Record<string, string>) {
  console.log('\n═══ Step 5: Migrating Chats ═══');
  const snapshot = await firestore.collection('chats').get();
  let chatsMigrated = 0;
  let messagesMigrated = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const participants = data.participants || [];

    if (participants.length < 2) {
      console.error(`  ✗ Chat ${doc.id}: less than 2 participants`);
      failed++;
      continue;
    }

    const p1 = uidMap[participants[0]];
    const p2 = uidMap[participants[1]];

    if (!p1 || !p2) {
      console.error(`  ✗ Chat ${doc.id}: unmapped participant`);
      failed++;
      continue;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('chats')
        .insert({
          participant_1: p1,
          participant_2: p2,
          last_message: data.lastMessage || null,
          last_sender_id: data.lastSenderId ? uidMap[data.lastSenderId] : null,
          last_message_at: firestoreTimestampToISO(data.lastMessageAt) || null,
          created_at: firestoreTimestampToISO(data.createdAt) || new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      const chatId = inserted.id;

      // Migrate messages subcollection
      const messagesSnapshot = await firestore
        .collection('chats')
        .doc(doc.id)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      for (const msgDoc of messagesSnapshot.docs) {
        const mData = msgDoc.data();
        const senderId = uidMap[mData.userId] || uidMap[mData.senderId] || uidMap[mData.sender_id];
        if (!senderId) continue;

        try {
          await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: senderId,
            text: mData.text || mData.message || '',
            created_at: firestoreTimestampToISO(mData.createdAt) || new Date().toISOString(),
          });
          messagesMigrated++;
        } catch (mErr: any) {
          console.error(`  ⚠ Message ${msgDoc.id}: ${mErr.message}`);
        }
      }

      chatsMigrated++;
    } catch (err: any) {
      console.error(`  ✗ Chat ${doc.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`  ✓ Chats: ${chatsMigrated} | Messages: ${messagesMigrated} | Failed: ${failed}`);
}

// ─── Step 6: Migrate Notifications ─────────────────────────────────────────

async function migrateNotifications(uidMap: Record<string, string>) {
  console.log('\n═══ Step 6: Migrating Notifications ═══');
  const snapshot = await firestore.collection('notifications').get();
  let migrated = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const userId = uidMap[data.userId] || uidMap[data.user_id];

    if (!userId) {
      failed++;
      continue;
    }

    // Map notification type
    let type = data.type || 'new_post';
    const validTypes = ['new_post', 'announcement', 'health_guideline', 'feeding_info', 'chat'];
    if (!validTypes.includes(type)) type = 'new_post';

    // Map related entity
    let relatedId: string | null = null;
    let relatedType: string | null = null;

    if (data.relatedPostId) {
      relatedType = 'livestock';
      // Note: relatedId stays as Firebase ID — won't map to new Supabase UUID
      // This is acceptable since notifications are ephemeral
    } else if (data.relatedAnnouncementId) {
      relatedType = 'announcement';
    } else if (data.relatedGuidelineId) {
      relatedType = 'guideline';
    } else if (data.relatedFeedingId) {
      relatedType = 'feeding';
    } else if (data.relatedUserId) {
      relatedType = 'chat';
    }

    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title: data.title || 'Notification',
        message: data.message || data.body || null,
        is_read: data.isRead || data.is_read || false,
        related_id: relatedId,
        related_type: relatedType,
        created_at: firestoreTimestampToISO(data.createdAt) || new Date().toISOString(),
      });
      if (error) throw error;
      migrated++;
    } catch (err: any) {
      console.error(`  ✗ Notification ${doc.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`  ✓ Migrated: ${migrated} | Failed: ${failed}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Firebase → Supabase Migration                  ║');
  console.log('║  Livestock App (livestockapp-50d71)              ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const uidMap = await migrateAuthUsers();
  console.log(`\n  UID mapping: ${Object.keys(uidMap).length} Firebase → Supabase`);

  await migrateProfiles(uidMap);
  await migrateAdminContent(uidMap);
  await migrateLivestock(uidMap);
  await migrateChats(uidMap);
  await migrateNotifications(uidMap);

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Migration complete!                             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\n⚠ Note: Users will need to use "Forgot Password" to set a new password.');
  console.log('  Firebase password hashes cannot be directly imported via the JS client.');
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err);
  process.exit(1);
});
