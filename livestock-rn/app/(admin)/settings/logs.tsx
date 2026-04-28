import { View, Text, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_LOGS = [
  { id: '1', event: 'New User Registered', user: 'Juan Dela Cruz', time: '2 mins ago', type: 'info' },
  { id: '2', event: 'Livestock Listing Approved', user: 'Admin Ivan', time: '15 mins ago', type: 'success' },
  { id: '3', event: 'System Maintenance Scheduled', user: 'System', time: '1 hour ago', type: 'warning' },
  { id: '4', event: 'Failed Login Attempt', user: 'Unknown IP', time: '2 hours ago', type: 'error' },
  { id: '5', event: 'Announcement Published', user: 'Admin Ivan', time: '5 hours ago', type: 'info' },
];

export default function SystemLogsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={MOCK_LOGS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm flex-row items-center">
            <View className={`p-3 rounded-xl mr-4 ${getTypeStyle(item.type).bg}`}>
              <Ionicons name={getTypeStyle(item.type).icon as any} size={20} color={getTypeStyle(item.type).color} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base">{item.event}</Text>
              <Text className="text-gray-500 text-sm">By {item.user} • {item.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        )}
      />
    </View>
  );
}

function getTypeStyle(type: string) {
  switch (type) {
    case 'success': return { bg: 'bg-green-50', color: '#2E7D32', icon: 'checkmark-circle' };
    case 'error': return { bg: 'bg-red-50', color: '#DC2626', icon: 'close-circle' };
    case 'warning': return { bg: 'bg-amber-50', color: '#D97706', icon: 'warning' };
    default: return { bg: 'bg-blue-50', color: '#1976D2', icon: 'information-circle' };
  }
}
