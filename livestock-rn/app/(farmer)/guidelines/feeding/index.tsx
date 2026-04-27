import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { FEEDING_CATEGORIES } from '../../../../constants/theme';
import type { FeedingInfo } from '../../../../types/database';

export default function FeedingListScreen() {
  const router = useRouter();
  const [feedingData, setFeedingData] = useState<FeedingInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Baktin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeding();
  }, [selectedCategory]);

  const fetchFeeding = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feeding_info')
      .select('*')
      .eq('category', selectedCategory)
      .order('created_at', { ascending: false });

    if (!error && data) setFeedingData(data);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Category tabs */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FEEDING_CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === item ? 'bg-green-700' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedCategory(item)}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === item ? 'text-white' : 'text-gray-700'
              }`}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={feedingData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              onPress={() => router.push(`/(farmer)/guidelines/feeding/${item.id}`)}
            >
              <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
              {item.feed_type && (
                <Text className="text-sm text-gray-500 mt-0.5">Feed type: {item.feed_type}</Text>
              )}
              {item.description && (
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-gray-400">No feeding info for {selectedCategory}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
