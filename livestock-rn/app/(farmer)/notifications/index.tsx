import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useNotifications } from '../../../lib/hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Notification } from '../../../types/database';

export default function NotificationsScreen() {
  const { notifications, loading, error, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_post': return { name: 'add-circle', color: '#2E7D32' };
      case 'announcement': return { name: 'megaphone', color: '#1976D2' };
      case 'health_guideline': return { name: 'medical', color: '#D32F2F' };
      case 'feeding_info': return { name: 'restaurant', color: '#F57C00' };
      case 'chat': return { name: 'chatbubbles', color: '#7B1FA2' };
      default: return { name: 'notifications', color: '#757575' };
    }
  };

  const handlePress = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (!notification.related_id) return;

    switch (notification.related_type) {
      case 'livestock':
        router.push(`/(farmer)/marketplace/${notification.related_id}`);
        break;
      case 'announcement':
        router.push(`/(farmer)/guidelines`); // Announcements are likely in guidelines or home
        break;
      case 'guideline':
        router.push(`/(farmer)/guidelines`);
        break;
      case 'feeding':
        router.push(`/(farmer)/guidelines`);
        break;
      case 'chat':
        router.push(`/(farmer)/chats/${notification.related_id}`);
        break;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Mark all as read</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const icon = getIcon(item.type);
          return (
            <TouchableOpacity 
              style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
              onPress={() => handlePress(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                <Ionicons name={icon.name as any} size={24} color={icon.color} />
              </View>
              <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, !item.is_read && styles.boldText]}>{item.title}</Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.date}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  unreadItem: {
    backgroundColor: '#F1F8E9',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9E9E9E',
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
