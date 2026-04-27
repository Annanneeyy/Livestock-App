import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLivestockList } from '../../lib/hooks/useLivestock';
import { useAuth } from '../../lib/hooks/useAuth';
import LivestockCard from '../../components/LivestockCard';
import { LIVESTOCK_CATEGORIES } from '../../constants/theme';

const FILTERS = ['All', ...LIVESTOCK_CATEGORIES] as const;

export default function MarketplaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [myPostsOnly, setMyPostsOnly] = useState(false);

  const filters = useMemo(() => ({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    sellerId: myPostsOnly ? user?.id : undefined,
    search: search.trim() || undefined,
  }), [selectedCategory, myPostsOnly, search, user?.id]);

  const { data, loading, refetch } = useLivestockList(filters);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="px-4 pt-3 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search livestock..."
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filters */}
      <View className="px-4 py-2 bg-white border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-1.5 rounded-full mr-2 ${
                selectedCategory === item
                  ? 'bg-green-700'
                  : 'bg-gray-100'
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

      {/* My Posts Toggle */}
      <View className="px-4 py-2 bg-white border-b border-gray-200 flex-row justify-between items-center">
        <Text className="text-gray-600 text-sm">
          {data.length} listing{data.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setMyPostsOnly(!myPostsOnly)}
        >
          <Ionicons
            name={myPostsOnly ? 'checkbox' : 'square-outline'}
            size={20}
            color={myPostsOnly ? '#2E7D32' : '#9CA3AF'}
          />
          <Text className="ml-1 text-sm text-gray-600">My Posts</Text>
        </TouchableOpacity>
      </View>

      {/* Listing */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LivestockCard item={item} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-400 text-lg">No listings found</Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={loading}
        />
      )}

      {/* FAB to create post */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-700 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(farmer)/marketplace/create')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
