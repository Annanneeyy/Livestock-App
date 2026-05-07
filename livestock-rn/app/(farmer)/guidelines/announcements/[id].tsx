import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { Announcement } from '../../../../types/database';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase
        .from('announcements')
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
        <Text className="text-gray-400">Announcement not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Stack.Screen options={{ title: data.title }} />
      <View className="bg-white rounded-xl p-5 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Ionicons name="megaphone" size={22} color="#1976D2" />
          <Text className="text-xl font-bold text-gray-900 ml-2 flex-1">{data.title}</Text>
        </View>
        <Text className="text-xs text-gray-400 mb-4">
          {new Date(data.created_at).toLocaleString()}
        </Text>
        {data.description ? (
          <Text className="text-base text-gray-700 mb-4">{data.description}</Text>
        ) : null}
        {data.content ? (
          <Text className="text-gray-600 leading-relaxed whitespace-pre-line">{data.content}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
