import { Tabs, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import NotificationBell from '../../components/NotificationBell';

export default function AdminLayout() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '600', 
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 2 
        },
        tabBarIconStyle: { marginTop: 4 },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 5,
          ...Platform.select({
            web: {
              maxWidth: 800, // Increased for better spacing with 6 tabs
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
        tabBarItemStyle: {
          paddingVertical: 4,
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Stats',
          headerShown: true,
          headerTitle: 'Dashboard Stats',
          headerStyle: { backgroundColor: '#1B5E20' },
          headerTintColor: '#fff',
          headerRight: () => <NotificationBell />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (navigation.isFocused()) {
              DeviceEventEmitter.emit('refresh_dashboard');
            }
          },
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (navigation.isFocused()) {
              DeviceEventEmitter.emit('refresh_map');
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
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
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
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          tabBarButton: () => null,
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: '#1B5E20' },
          headerTintColor: '#fff',
          headerRight: () => <NotificationBell />,
        }}
      />
    </Tabs>
  );
}
