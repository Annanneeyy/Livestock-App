import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, DeviceEventEmitter,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLivestockList } from '../../../lib/hooks/useLivestock';
import { useAuth } from '../../../lib/hooks/useAuth';
import LivestockCard from '../../../components/LivestockCard';
import { LIVESTOCK_CATEGORIES } from '../../../constants/theme';

const FILTERS = ['All', ...LIVESTOCK_CATEGORIES] as const;

export default function MarketplaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [myPostsOnly, setMyPostsOnly] = useState(false);
  const { profile } = useAuth();
  const rolePath = profile?.role === 'admin' ? '(admin)' : '(farmer)';

  const filters = useMemo(() => ({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    sellerId: myPostsOnly ? user?.id : undefined,
    search: search.trim() || undefined,
  }), [selectedCategory, myPostsOnly, search, user?.id]);

  const { data, loading, refetch } = useLivestockList(filters);

  // Refetch when screen comes back into focus (e.g. after creating/editing a post)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('refresh_marketplace', refetch);
    return () => sub.remove();
  }, [refetch]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Search Bar */}
      <View className="px-4 pt-3 pb-2 bg-white dark:bg-gray-800">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base dark:text-white"
            placeholder={t('marketplace.search')}
            placeholderTextColor="#9CA3AF"
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
      <View className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
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
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
              onPress={() => setSelectedCategory(item)}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === item ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* My Posts Toggle */}
      <View className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center">
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
              <Text className="text-gray-400 text-lg">{t('marketplace.no_listings')}</Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={loading}
        />
      )}

      {/* FAB to create post */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-700 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push(`/${rolePath}/marketplace/create`)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
