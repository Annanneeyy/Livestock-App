import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useChatMessages } from '../../../lib/hooks/useChat';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, loading, error, sendMessage, markAsRead } = useChatMessages(id);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(inputText);
      setInputText('');
      // Mark as read after sending (though usually we mark when viewing)
      markAsRead();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === currentUser?.id;
    const messageDate = new Date(item.created_at);

    return (
      <View className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && (
          <View className="mr-2 self-end">
            {item.sender?.avatar_url ? (
              <Image source={{ uri: item.sender.avatar_url }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="w-8 h-8 rounded-full bg-green-100 justify-center items-center">
                <Text className="text-green-800 text-[10px] font-bold">
                  {item.sender?.first_name?.[0]}{item.sender?.last_name?.[0]}
                </Text>
              </View>
            )}
          </View>
        )}
        <View 
          className={`max-w-[75%] p-3 rounded-2xl ${
            isMe 
              ? 'bg-green-700 rounded-br-none' 
              : 'bg-white border border-gray-200 rounded-bl-none'
          }`}
        >
          <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`}>
            {item.text}
          </Text>
          <View className="flex-row items-center justify-end mt-1">
            <Text className={`text-[10px] ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
              {format(messageDate, 'HH:mm')}
            </Text>
            {isMe && (
              <Ionicons 
                name={item.is_read ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={item.is_read ? "#A5D6A7" : "#E8F5E9"} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          headerTitle: messages.length > 0 && messages[0].sender_id !== currentUser?.id 
            ? `${messages[0].sender?.first_name} ${messages[0].sender?.last_name}`
            : 'Chat'
        }} 
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View className="p-3 bg-white border-t border-gray-200 flex-row items-center">
        <TouchableOpacity className="mr-2 p-1">
          <Ionicons name="add-circle-outline" size={28} color="#2E7D32" />
        </TouchableOpacity>
        
        <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 max-h-24">
          <TextInput
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            className="text-gray-900 text-sm py-1"
          />
        </View>

        <TouchableOpacity 
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          className={`w-10 h-10 rounded-full justify-center items-center ${
            !inputText.trim() || sending ? 'bg-gray-300' : 'bg-green-700'
          }`}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
