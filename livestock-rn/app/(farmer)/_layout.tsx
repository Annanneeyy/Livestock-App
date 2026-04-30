import { Tabs, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUnreadCount } from '../../lib/hooks/useChat';
import { useTheme } from '../../lib/hooks/useTheme';
import NotificationBell from '../../components/NotificationBell';

export default function FarmerLayout() {
  const navigation = useNavigation();
  const unreadCount = useUnreadCount();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#4ade80' : '#2E7D32',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#9E9E9E',
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 5,
          ...Platform.select({
            web: {
              maxWidth: 700, // Increased for better spacing
              width: '90%',
              alignSelf: 'center',
              borderRadius: 40,
              marginBottom: 20,
              marginHorizontal: 'auto',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
              position: 'absolute',
              left: '5%',
              right: '5%',
              bottom: 0,
              height: 70,
              paddingBottom: 10,
            }
          })
        },
        headerShown: false,
        headerStyle: { backgroundColor: isDark ? '#064e3b' : '#2E7D32' },
        headerTintColor: '#fff',
        headerRight: () => <NotificationBell />,
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '600', 
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 2 
        },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (navigation.isFocused()) {
              DeviceEventEmitter.emit('refresh_home');
            }
          },
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (navigation.isFocused()) {
              DeviceEventEmitter.emit('refresh_marketplace');
            }
          },
        }}
      />
      <Tabs.Screen
        name="guidelines"
        options={{
          title: 'Guides',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (navigation.isFocused()) {
              DeviceEventEmitter.emit('refresh_chats');
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          tabBarButton: () => null,
          headerShown: true,
          title: 'Notifications',
        }}
      />
    </Tabs>
  );
}
