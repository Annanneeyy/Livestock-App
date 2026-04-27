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
  unread_count?: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  image_url: string | null;
  is_read: boolean;
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
