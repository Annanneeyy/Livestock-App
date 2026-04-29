import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { HealthGuideline } from '../../../../types/database';

export default function HealthGuidelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<HealthGuideline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase
        .from('health_guidelines')
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
        <Text className="text-gray-400">Guideline not found</Text>
      </View>
    );
  }

  const sections = [
    { title: 'Disease', content: data.disease, icon: 'bug' as const, color: '#DC2626' },
    { title: 'Symptoms', content: data.symptoms, icon: 'alert-circle' as const, color: '#F59E0B' },
    { title: 'Treatment', content: data.treatment, icon: 'medkit' as const, color: '#3B82F6' },
    { title: 'Prevention', content: data.prevention, icon: 'shield-checkmark' as const, color: '#10B981' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Stack.Screen options={{ title: data.disease }} />
      {sections.map((section) =>
        section.content ? (
          <View key={section.title} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name={section.icon} size={20} color={section.color} />
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
