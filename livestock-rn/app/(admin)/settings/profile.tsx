import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileDetailsScreen() {
  const { profile } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center border-4 border-white shadow-sm">
            <Ionicons name="person" size={48} color="#2E7D32" />
          </View>
          <TouchableOpacity className="mt-2">
            <Text className="text-green-700 font-semibold">Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-4">
          <InputGroup label="First Name" value={profile?.first_name} />
          <InputGroup label="Last Name" value={profile?.last_name} />
          <InputGroup label="Email" value={profile?.email || 'admin@livestock.app'} editable={false} />
          <InputGroup label="Barangay" value={profile?.barangay || 'Not set'} />
        </View>

        <TouchableOpacity className="mt-8 bg-green-700 py-4 rounded-2xl items-center shadow-md">
          <Text className="text-white font-bold text-lg">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InputGroup({ label, value, editable = true }: any) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-500 mb-1 ml-1">{label}</Text>
      <TextInput
        className={`bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-900 ${!editable ? 'text-gray-400' : ''}`}
        value={value}
        editable={editable}
      />
    </View>
  );
}
