import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState({
    push: true,
    email: false,
    newUsers: true,
    reports: true,
    marketUpdates: true
  });

  const toggle = (key: keyof typeof prefs) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-2">Channel Settings</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
          <ToggleItem 
            label="Push Notifications" 
            value={prefs.push} 
            onToggle={() => toggle('push')} 
            icon="notifications" 
            color="#2E7D32" 
          />
          <ToggleItem 
            label="Email Alerts" 
            value={prefs.email} 
            onToggle={() => toggle('email')} 
            icon="mail" 
            color="#1976D2" 
          />
        </View>

        <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-2">Administrative Alerts</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <ToggleItem 
            label="New User Registration" 
            value={prefs.newUsers} 
            onToggle={() => toggle('newUsers')} 
          />
          <ToggleItem 
            label="Incident Reports" 
            value={prefs.reports} 
            onToggle={() => toggle('reports')} 
          />
          <ToggleItem 
            label="Market Activity Weekly" 
            value={prefs.marketUpdates} 
            onToggle={() => toggle('marketUpdates')} 
          />
        </View>

        <View className="mt-8 p-4 bg-blue-50 rounded-2xl flex-row">
          <Ionicons name="information-circle" size={24} color="#1976D2" />
          <Text className="flex-1 ml-3 text-blue-800 text-sm">
            Critical system alerts cannot be disabled and will always be sent via Push and Email.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ToggleItem({ label, value, onToggle, icon, color }: any) {
  return (
    <View className="flex-row items-center p-4 border-b border-gray-50 bg-white">
      {icon && (
        <View style={{ backgroundColor: `${color}15` }} className="p-2 rounded-lg mr-3">
          <Ionicons name={icon} size={20} color={color} />
        </View>
      )}
      <Text className="flex-1 text-base text-gray-700 font-medium">{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#2E7D32' }}
      />
    </View>
  );
}
