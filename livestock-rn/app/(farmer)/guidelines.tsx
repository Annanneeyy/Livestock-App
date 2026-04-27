import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GuidelinesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold text-green-800 mb-4">Guidelines</Text>

      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100"
        onPress={() => router.push('/(farmer)/guidelines/health')}
      >
        <View className="bg-red-100 rounded-lg p-3 mr-4">
          <Ionicons name="medkit" size={28} color="#DC2626" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">Health Guidelines</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            Diseases, symptoms, treatment, and prevention
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white rounded-xl p-4 flex-row items-center shadow-sm border border-gray-100"
        onPress={() => router.push('/(farmer)/guidelines/feeding')}
      >
        <View className="bg-amber-100 rounded-lg p-3 mr-4">
          <Ionicons name="nutrition" size={28} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">Feeding Information</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            Schedules, nutrition, and best practices
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
