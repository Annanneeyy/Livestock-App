import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatList } from '../../../lib/hooks/useChat';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ChatListScreen() {
  const { chats, loading, error } = useChatList();
  const { profile } = useAuth();
  const router = useRouter();

  const rolePath = profile?.role === 'admin' ? '(admin)' : '(farmer)';

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50 dark:bg-gray-900">
        <Ionicons name="alert-circle" size={48} color="#D32F2F" />
        <Text className="text-gray-600 mt-2 text-center">{error}</Text>
      </View>
    );
  }

  const renderChatItem = ({ item }: { item: any }) => {
    const otherUser = item.other_user;
    const lastMessageDate = item.last_message_at ? new Date(item.last_message_at) : null;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/${rolePath}/chats/${item.id}`)}
        className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700"
      >
        {/* Avatar */}
        <View className="relative">
          {otherUser?.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-green-100 justify-center items-center">
              <Text className="text-green-800 font-bold text-lg">
                {otherUser?.first_name?.[0] || '?'}{otherUser?.last_name?.[0] || ''}
              </Text>
            </View>
          )}
          {/* Status Indicator (Optional) */}
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        </View>

        {/* Content */}
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={1}>
              {otherUser?.first_name} {otherUser?.last_name}
            </Text>
            {lastMessageDate && (
              <Text className="text-gray-400 text-xs">
                {format(lastMessageDate, 'HH:mm')}
              </Text>
            )}
          </View>
          <View className="flex-row justify-between items-center mt-1">
            <Text 
              className={`flex-1 text-sm ${item.unread_count > 0 ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400'}`} 
              numberOfLines={1}
            >
              {item.last_message || 'No messages yet'}
            </Text>
            {item.unread_count > 0 && (
              <View className="bg-green-600 rounded-full h-5 min-w-[20px] px-1 justify-center items-center ml-2">
                <Text className="text-white text-[10px] font-bold">
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20 p-8">
            <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full justify-center items-center mb-4">
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 dark:text-white font-bold text-lg">No Messages Yet</Text>
            <Text className="text-gray-500 text-center mt-2">
              Start a conversation with sellers in the marketplace to see them here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
