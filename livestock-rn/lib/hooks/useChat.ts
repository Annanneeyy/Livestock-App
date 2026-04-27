import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Chat, Message, Profile } from '../../types/database';

/**
 * Hook to manage the list of active chats/conversations
 */
export function useChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch chats where user is participant
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participant_1_profile:participant_1 (*),
          participant_2_profile:participant_2 (*)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // 2. Format chats and calculate unread counts/last message
      const formattedChats = await Promise.all((data || []).map(async (chat: any) => {
        const isParticipant1 = chat.participant_1 === user.id;
        const otherUser = isParticipant1 ? chat.participant_2_profile : chat.participant_1_profile;
        
        // Fetch unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        // Fallback: If last_message is null, fetch the most recent message from DB
        let lastMessage = chat.last_message;
        let lastMessageAt = chat.last_message_at;

        if (!lastMessage) {
          const { data: latestMsg } = await supabase
            .from('messages')
            .select('text, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (latestMsg) {
            lastMessage = latestMsg.text;
            lastMessageAt = latestMsg.created_at;
          }
        }

        return {
          ...chat,
          other_user: otherUser,
          last_message: lastMessage,
          last_message_at: lastMessageAt,
          unread_count: unreadCount || 0
        };
      }));

      setChats(formattedChats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();

    // Subscribe to chat updates with a unique channel name to avoid subscription conflicts
    const channelId = `chat_list_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats' 
      }, () => {
        fetchChats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchChats(); // Update last message and unread count
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  return { chats, loading, error, refresh: fetchChats };
}

/**
 * Hook to manage a specific chat's messages
 */
export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(*)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const markAsRead = useCallback(async () => {
    if (!chatId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
  }, [chatId]);

  const sendMessage = async (text: string) => {
    if (!chatId || !text.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          text: text.trim()
        });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (!chatId) return;
    fetchMessages();
    markAsRead();

    // Subscribe to new messages in this chat with a unique channel name
    const channelName = `chat_room_${chatId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        fetchMessages();
        markAsRead();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages, markAsRead]);

  return { messages, loading, error, sendMessage, markAsRead };
}

/**
 * Hook to start or get an existing chat with another user
 */
export async function getOrCreateChat(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if chat already exists
  const { data: existingChat, error: fetchError } = await supabase
    .from('chats')
    .select('id')
    .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existingChat) return existingChat.id;

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert({
      participant_1: user.id,
      participant_2: otherUserId
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return newChat.id;
}
