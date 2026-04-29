import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../lib/hooks/useNotifications';

interface NotificationBellProps {
  color?: string;
}

export default function NotificationBell({ color = '#FFFFFF' }: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  return (
    <TouchableOpacity 
      onPress={() => router.push('/(farmer)/notifications')}
      style={styles.container}
    >
      <Ionicons name="notifications-outline" size={24} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2E7D32', // Matches header background
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
});
