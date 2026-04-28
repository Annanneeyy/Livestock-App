import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_ADMINS = [
  { id: '1', name: 'Ivan Admin', email: 'ivan@livestock.app', status: 'Owner' },
  { id: '2', name: 'Maria Santos', email: 'maria@livestock.app', status: 'Manager' },
  { id: '3', name: 'Jose Rizal', email: 'jose@livestock.app', status: 'Editor' },
];

export default function ManageAdminsScreen() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      <TouchableOpacity className="bg-green-700 p-4 rounded-2xl flex-row items-center justify-center mb-6 shadow-md">
        <Ionicons name="person-add" size={22} color="white" />
        <Text className="ml-2 text-white font-bold text-base">Invite New Admin</Text>
      </TouchableOpacity>

      <Text className="text-sm font-semibold text-gray-400 mb-4 uppercase ml-2">Active Administrators</Text>
      
      <FlatList
        data={MOCK_ADMINS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm flex-row items-center">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
              <Text className="text-green-700 font-bold text-lg">{item.name[0]}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
              <Text className="text-gray-500 text-sm">{item.email}</Text>
            </View>
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-gray-600 text-xs font-bold">{item.status}</Text>
            </View>
            <TouchableOpacity className="ml-4 p-1">
              <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
