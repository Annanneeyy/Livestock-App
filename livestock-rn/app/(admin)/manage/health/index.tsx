import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import type { HealthGuideline } from '../../../../types/database';

export default function HealthGuidelinesAdminListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<HealthGuideline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('health_guidelines').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('health_guidelines').delete().eq('id', id);
        fetchItems();
      }},
    ]);
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2E7D32" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900">{item.disease}</Text>
            {item.symptoms && <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{item.symptoms}</Text>}
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity className="bg-blue-600 rounded-lg px-4 py-2" onPress={() => router.push({ pathname: '/(admin)/manage/health/form', params: { editId: item.id } })}>
                <Text className="text-white text-sm font-medium">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-red-600 rounded-lg px-4 py-2" onPress={() => handleDelete(item.id)}>
                <Text className="text-white text-sm font-medium">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-20"><Text className="text-gray-400">No health guidelines</Text></View>}
      />
      <TouchableOpacity className="absolute bottom-6 right-6 bg-green-700 w-14 h-14 rounded-full items-center justify-center shadow-lg" onPress={() => router.push('/(admin)/manage/health/form')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
