import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
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
        id, name, category, price, description, contact, location_text, latitude, longitude, is_available, seller_id, created_at,
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
        id, name, category, price, description, contact, location_text, latitude, longitude, is_available, seller_id, created_at,
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
    if (!uri) continue;

    try {
      const fileName = `${livestockId}/${Date.now()}_${i}.jpg`;
      let fileData;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileData = await response.blob();
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        fileData = decode(base64);
      }

      const { error: uploadError } = await supabase.storage
        .from('livestock-images')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          upsert: true
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
    } catch (imgErr: any) {
      console.error(`Image ${i} upload failed:`, imgErr.message);
      continue;
    }
  }

  return livestockId;
}

export async function updateLivestock(
  id: string,
  updates: Partial<Omit<Livestock, 'id' | 'created_at' | 'seller' | 'images'>>,
  newImageUris?: string[]
) {
  const { error } = await supabase
    .from('livestock')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  if (newImageUris) {
    // Delete old image records (cleanup storage is optional here but good for space)
    await supabase.from('livestock_images').delete().eq('livestock_id', id);

    for (let i = 0; i < newImageUris.length; i++) {
      const uri = newImageUris[i];

      if (uri.startsWith('http')) {
        await supabase.from('livestock_images').insert({
          livestock_id: id,
          image_url: uri,
          sort_order: i,
        });
        continue;
      }

      const fileName = `${id}/${Date.now()}_${i}.jpg`;
      let fileData;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileData = await response.blob();
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        fileData = decode(base64);
      }

      const { error: uploadError } = await supabase.storage
        .from('livestock-images')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('livestock-images')
        .getPublicUrl(fileName);

      await supabase.from('livestock_images').insert({
        livestock_id: id,
        image_url: urlData.publicUrl,
        sort_order: i,
      });
    }
  }
}

export async function markAsSold(id: string) {
  const { error } = await supabase
    .from('livestock')
    .update({ is_available: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLivestock(id: string) {
  // Soft delete: setting is_available to false. 
  // In a real app, you'd have an is_deleted column.
  const { error } = await supabase
    .from('livestock')
    .update({ 
      is_available: false, 
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
    
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
