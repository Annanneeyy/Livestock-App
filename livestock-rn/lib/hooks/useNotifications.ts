import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Notification } from '../../types/database';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) return;
      const user = userData.user;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;
      const userData = data;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userData.user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channelId = `notifications_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
        // RLS will handle user-specific data, but we can add filter if needed
        // filter: `user_id=eq.${userId}` // We'd need userId here
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
