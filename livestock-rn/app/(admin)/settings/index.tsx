import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function AdminSettingsIndex() {
  const { signOut, profile } = useAuth();
  const router = useRouter();

  const sections = [
    {
      title: 'Account',
      items: [
        { label: 'Profile Details', icon: 'person-outline', route: '/(admin)/settings/profile' },
        { label: 'Notification Preferences', icon: 'notifications-outline', route: '/(admin)/settings/notifications' },
      ]
    },
    {
      title: 'Admin Tools',
      items: [
        { label: 'Manage Admins', icon: 'people-outline', route: '/(admin)/settings/admins' },
      ]
    }
  ];

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
        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-2">{section.title}</Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, idx) => (
                <TouchableOpacity 
                  key={item.label}
                  className={`flex-row items-center p-4 ${idx < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                  onPress={() => router.push(item.route as any)}
                >
                  <Ionicons name={item.icon as any} size={22} color="#4B5563" />
                  <Text className="flex-1 ml-3 text-base text-gray-700">{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          className="mt-4 bg-red-50 p-4 rounded-2xl flex-row items-center justify-center mb-10"
          onPress={() => {
            if (Platform.OS === 'web') {
              if (confirm('Are you sure you want to sign out?')) {
                signOut();
              }
            } else {
              Alert.alert('Sign Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ]);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text className="ml-2 text-red-600 font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
