import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GuidelinesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">Guidelines</Text>

      <TouchableOpacity
        className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100 dark:border-gray-700"
        onPress={() => router.push('/(farmer)/guidelines/health')}
      >
        <View className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mr-4">
          <Ionicons name="medkit" size={28} color="#DC2626" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">Health Guidelines</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Diseases, symptoms, treatment, and prevention
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center shadow-sm border border-gray-100 dark:border-gray-700"
        onPress={() => router.push('/(farmer)/guidelines/feeding')}
      >
        <View className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 mr-4">
          <Ionicons name="nutrition" size={28} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">Feeding Information</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Schedules, nutrition, and best practices
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
