import React from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface NavItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
}

interface WebSidebarProps {
  items: NavItem[];
  isMinimized: boolean;
  onToggle: () => void;
}

export default function WebSidebar({ items, isMinimized, onToggle }: WebSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (Platform.OS !== 'web') return null;

  return (
    <View 
      style={{ 
        width: isMinimized ? 80 : 240,
        transition: 'width 0.3s ease-in-out',
      }}
      className="h-screen bg-white border-r border-gray-100 shadow-sm z-50 py-6"
    >
      {/* Header / Toggle Button */}
      <View className={`px-4 mb-8 flex-row items-center ${isMinimized ? 'justify-center' : 'justify-between'}`}>
        {!isMinimized && (
          <Text className="text-xl font-bold text-green-800">Livestock</Text>
        )}
        <TouchableOpacity 
          onPress={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Ionicons 
            name={isMinimized ? "chevron-forward" : "chevron-back"} 
            size={20} 
            color="#2E7D32" 
          />
        </TouchableOpacity>
      </View>

      {/* Nav Items */}
      <View className="px-2 gap-1">
        {items.map((item) => {
          const isActive = pathname.includes(item.path);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.navigate(item.path as any)}
              className={`flex-row items-center p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-green-50 border border-green-100' 
                  : 'hover:bg-gray-50'
              } ${isMinimized ? 'justify-center' : ''}`}
            >
              <Ionicons 
                name={item.icon} 
                size={22} 
                color={isActive ? '#2E7D32' : '#6B7280'} 
              />
              {!isMinimized && (
                <Text 
                  className={`ml-3 font-semibold ${
                    isActive ? 'text-green-800' : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
              {isActive && !isMinimized && (
                <View className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}
