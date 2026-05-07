import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { FeedingInfo } from '../types/database';

export default function FeedingInfoDetailView({ id }: { id: string }) {
  const [data, setData] = useState<FeedingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: result, error } = await supabase
        .from('feeding_info')
        .select('*')
        .eq('id', id)
        .maybeSingle();
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
        <Stack.Screen options={{ title: 'Feeding Info' }} />
        <Ionicons name="document-outline" size={48} color="#9CA3AF" />
        <Text className="text-gray-700 text-base font-medium mt-3 text-center">
          {errorMsg ? 'Could not load feeding info' : 'This feeding info has been removed'}
        </Text>
        {errorMsg ? <Text className="text-xs text-red-500 mt-2 text-center">{errorMsg}</Text> : null}
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
      <Stack.Screen options={{ title: data.name }} />
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
