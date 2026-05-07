import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
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
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const performDelete = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      if (Platform.OS === 'web') window.alert(`Delete failed: ${error.message}`);
      else Alert.alert('Error', error.message);
      return;
    }
    fetchItems();
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this announcement?')) performDelete(id);
      return;
    }
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => performDelete(id) },
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
            <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
            {item.description && <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{item.description}</Text>}
            <Text className="text-xs text-gray-400 mt-2">{new Date(item.created_at).toLocaleDateString()}</Text>
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                className="bg-blue-600 rounded-lg px-4 py-2"
                onPress={() => router.push({ pathname: '/(admin)/manage/announcements/form', params: { editId: item.id } })}
              >
                <Text className="text-white text-sm font-medium">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-red-600 rounded-lg px-4 py-2" onPress={() => handleDelete(item.id)}>
                <Text className="text-white text-sm font-medium">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-20"><Text className="text-gray-400">No announcements</Text></View>}
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-700 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(admin)/manage/announcements/form')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
