import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { supabase } from '../../../../lib/supabase';

export default function AnnouncementFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!params.editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (params.editId) {
      setInitialLoading(true);
      supabase.from('announcements').select('*').eq('id', params.editId).single().then(({ data }) => {
        if (data) { setTitle(data.title); setDescription(data.description || ''); setContent(data.content || ''); }
        setInitialLoading(false);
      });
    }
  }, [params.editId]);

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required.'); return; }
    if (!user) return;
    setLoading(true);
    try {
      if (isEditing) {
        const { error } = await supabase.from('announcements').update({ title: title.trim(), description: description.trim() || null, content: content.trim() || null, updated_at: new Date().toISOString() }).eq('id', params.editId!);
        if (error) throw error;
        Alert.alert('Success', 'Announcement updated!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const { error } = await supabase.from('announcements').insert({ title: title.trim(), description: description.trim() || null, content: content.trim() || null, posted_by: user.id });
        if (error) throw error;
        Alert.alert('Success', 'Announcement posted!', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error: any) { Alert.alert('Error', error.message); }
    finally { setLoading(false); }
  };

  if (initialLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2E7D32" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-green-800 mb-4">{isEditing ? 'Edit Announcement' : 'New Announcement'}</Text>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Title *</Text>
          <TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Announcement title" value={title} onChangeText={setTitle} />
        </View>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
          <TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Short description" value={description} onChangeText={setDescription} multiline numberOfLines={2} textAlignVertical="top" />
        </View>
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Content</Text>
          <TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Full content..." value={content} onChangeText={setContent} multiline numberOfLines={5} textAlignVertical="top" />
        </View>
        <TouchableOpacity className={`rounded-lg py-4 items-center mb-8 ${loading ? 'bg-green-400' : 'bg-green-700'}`} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">{isEditing ? 'Update' : 'Post'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
