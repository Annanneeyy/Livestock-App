import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { HealthGuideline } from '../../../../types/database';

export default function HealthGuidelinesListScreen() {
  const router = useRouter();
  const [guidelines, setGuidelines] = useState<HealthGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    const { data, error } = await supabase
      .from('health_guidelines')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setGuidelines(data);
    setLoading(false);
  };

  const filtered = guidelines.filter(
    (g) =>
      g.disease.toLowerCase().includes(search.toLowerCase()) ||
      (g.symptoms || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-3 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search diseases or symptoms..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
            onPress={() => router.push(`/(farmer)/guidelines/health/${item.id}`)}
          >
            <Text className="text-base font-semibold text-gray-900">{item.disease}</Text>
            {item.symptoms && (
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                {item.symptoms}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400">No health guidelines found</Text>
          </View>
        }
      />
    </View>
  );
}
