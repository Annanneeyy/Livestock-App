import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Livestock } from '../types/database';

interface Props {
  item: Livestock;
}

export default function LivestockCard({ item }: Props) {
  const router = useRouter();
  const firstImage = item.images?.[0]?.image_url;

  return (
    <TouchableOpacity
      className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden"
      onPress={() => router.push(`/(farmer)/marketplace/${item.id}`)}
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
          <View className="w-28 h-28 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-3xl">🐷</Text>
          </View>
        )}

        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {item.category} • {item.seller?.barangay || 'Unknown'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-lg font-bold text-green-700">
              ₱{Number(item.price).toLocaleString()}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${
              item.is_available ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Text className={`text-xs font-medium ${
                item.is_available ? 'text-green-700' : 'text-red-700'
              }`}>
                {item.is_available ? 'Available' : 'Sold'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
