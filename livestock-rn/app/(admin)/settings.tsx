import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/hooks/useAuth';

export default function AdminSettings() {
  const { signOut, profile } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
            <Text className="text-green-700 text-2xl font-bold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </Text>
          </View>
          <View className="ml-4">
            <Text className="text-xl font-bold text-gray-900">{profile?.first_name} {profile?.last_name}</Text>
            <Text className="text-gray-500 capitalize">{profile?.role} Account</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-2">Account</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50">
            <Ionicons name="person-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">Profile Details</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="notifications-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-semibold text-gray-400 mt-6 mb-2 uppercase ml-2">Admin Tools</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50">
            <Ionicons name="shield-checkmark-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">System Logs</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="people-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">Manage Admins</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="mt-8 bg-red-50 p-4 rounded-2xl flex-row items-center justify-center mb-10"
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text className="ml-2 text-red-600 font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
