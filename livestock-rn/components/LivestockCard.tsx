import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/hooks/useAuth';
import type { Livestock } from '../types/database';

interface Props {
  item: Livestock;
}

const LivestockCard = memo(({ item }: Props) => {
  const router = useRouter();
  const { profile } = useAuth();
  const rolePath = profile?.role === 'admin' ? '(admin)' : '(farmer)';
  const firstImage = item.images?.[0]?.image_url;

  return (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 overflow-hidden"
      onPress={() => router.push(`/${rolePath}/marketplace/${item.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row">
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            className="w-28 h-28"
            resizeMode="cover"
          />
        ) : (
          <View className="w-28 h-28 bg-gray-200 dark:bg-gray-700 items-center justify-center">
            <Text className="text-gray-400 text-3xl">🐷</Text>
          </View>
        )}

        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-base font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {item.category} • {item.seller?.barangay || 'Unknown'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-lg font-bold text-green-700">
              ₱{Number(item.price).toLocaleString()}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${
              item.is_available ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Text className={`text-xs font-medium ${
                item.is_available ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {item.is_available ? 'Available' : 'Sold'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default LivestockCard;
