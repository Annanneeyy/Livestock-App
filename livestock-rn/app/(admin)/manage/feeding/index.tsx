import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import { FEEDING_CATEGORIES } from '../../../../constants/theme';
import type { FeedingInfo } from '../../../../types/database';

export default function FeedingInfoAdminListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FeedingInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Baktin');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, [selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('feeding_info').select('*').eq('category', selectedCategory).order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('feeding_info').delete().eq('id', id);
        fetchItems();
      }},
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={FEEDING_CATEGORIES} keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === item ? 'bg-green-700' : 'bg-gray-100'}`} onPress={() => setSelectedCategory(item)}>
              <Text className={`text-sm font-medium ${selectedCategory === item ? 'text-white' : 'text-gray-700'}`}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      {loading ? <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2E7D32" /></View> : (
        <FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
              <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
              {item.feed_type && <Text className="text-sm text-gray-500 mt-0.5">Feed type: {item.feed_type}</Text>}
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity className="bg-blue-600 rounded-lg px-4 py-2" onPress={() => router.push({ pathname: '/(admin)/manage/feeding/form', params: { editId: item.id } })}>
                  <Text className="text-white text-sm font-medium">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-red-600 rounded-lg px-4 py-2" onPress={() => handleDelete(item.id)}>
                  <Text className="text-white text-sm font-medium">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<View className="items-center py-20"><Text className="text-gray-400">No feeding info for {selectedCategory}</Text></View>}
        />
      )}
      <TouchableOpacity className="absolute bottom-6 right-6 bg-green-700 w-14 h-14 rounded-full items-center justify-center shadow-lg" onPress={() => router.push('/(admin)/manage/feeding/form')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
