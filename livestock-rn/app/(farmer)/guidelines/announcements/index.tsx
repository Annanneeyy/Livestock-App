import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { Announcement } from '../../../../types/database';

export default function AnnouncementsListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { fetchItems(); }, []));

  const fetchItems = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
            onPress={() => router.push(`/(farmer)/guidelines/announcements/${item.id}`)}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1 mr-2">
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
            
            {item.description && (
              <Text 
                className="text-sm text-gray-600 dark:text-gray-400 mb-3" 
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}
            
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {new Date(item.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="megaphone-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4 text-base">No announcements yet</Text>
          </View>
        }
      />
    </View>
  );
}
