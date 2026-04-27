import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { name: 'Baktin', color: '#EF4444', emoji: '🐷' },
  { name: 'Lechonon', color: '#3B82F6', emoji: '🐖' },
  { name: 'Lapaon', color: '#F59E0B', emoji: '🐽' },
];

export default function MapLegend() {
  const [visible, setVisible] = useState(false);

  return (
    <View className="absolute top-4 left-4">
      <TouchableOpacity
        className="bg-white rounded-lg px-3 py-2 shadow-md flex-row items-center"
        onPress={() => setVisible(!visible)}
      >
        <Ionicons name="layers" size={18} color="#2E7D32" />
        <Text className="text-green-700 font-medium ml-1">Legend</Text>
      </TouchableOpacity>

      {visible && (
        <View className="bg-white rounded-lg p-3 shadow-md mt-2 min-w-[140px]">
          {CATEGORIES.map((cat) => (
            <View key={cat.name} className="flex-row items-center mb-1.5 last:mb-0">
              <Text className="text-base mr-2">{cat.emoji}</Text>
              <Text className="text-sm text-gray-700">{cat.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
