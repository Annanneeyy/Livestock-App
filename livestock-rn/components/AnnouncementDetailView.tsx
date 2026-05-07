import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { Announcement } from '../types/database';

export default function AnnouncementDetailView({ id }: { id: string }) {
  const [data, setData] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: result, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      console.log('[announcement detail]', { id, result, error });
      if (error) setErrorMsg(error.message);
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
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-center">Announcement not found</Text>
        <Text className="text-xs text-gray-400 mt-2 text-center">id: {id}</Text>
        {errorMsg ? <Text className="text-xs text-red-500 mt-2 text-center">{errorMsg}</Text> : null}
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
          <Text className="text-gray-600 leading-relaxed">{data.content}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
