import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  {
    title: 'Announcements',
    subtitle: 'Post and manage announcements',
    icon: 'megaphone' as const,
    color: '#2563EB',
    route: '/(admin)/manage/announcements',
  },
  {
    title: 'Health Guidelines',
    subtitle: 'Manage disease and health information',
    icon: 'medkit' as const,
    color: '#DC2626',
    route: '/(admin)/manage/health',
  },
  {
    title: 'Feeding Information',
    subtitle: 'Manage feeding schedules and nutrition',
    icon: 'nutrition' as const,
    color: '#D97706',
    route: '/(admin)/manage/feeding',
  },
];

export default function ManageScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">

      {SECTIONS.map((section) => (
        <TouchableOpacity
          key={section.title}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100 dark:border-gray-700"
          onPress={() => router.push(section.route as any)}
        >
          <View
            className="rounded-lg p-3 mr-4"
            style={{ backgroundColor: `${section.color}15` }}
          >
            <Ionicons name={section.icon} size={28} color={section.color} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">{section.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );
}
