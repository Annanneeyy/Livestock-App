import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { supabase } from '../../../../lib/supabase';
import { FEEDING_CATEGORIES } from '../../../../constants/theme';

export default function FeedingInfoFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!params.editId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [feedType, setFeedType] = useState('');
  const [feedingSchedule, setFeedingSchedule] = useState('');
  const [nutritionalRequirement, setNutritionalRequirement] = useState('');
  const [feedingBestPractices, setFeedingBestPractices] = useState('');
  const [supplementsAdditives, setSupplementsAdditives] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (params.editId) {
      setInitialLoading(true);
      supabase.from('feeding_info').select('*').eq('id', params.editId).single().then(({ data }) => {
        if (data) {
          setName(data.name); setCategory(data.category); setDescription(data.description || '');
          setFeedType(data.feed_type || ''); setFeedingSchedule(data.feeding_schedule || '');
          setNutritionalRequirement(data.nutritional_requirement || '');
          setFeedingBestPractices(data.feeding_best_practices || '');
          setSupplementsAdditives(data.supplements_additives || '');
        }
        setInitialLoading(false);
      });
    }
  }, [params.editId]);

  const handleSubmit = async () => {
    if (!name.trim() || !category) { Alert.alert('Error', 'Name and category are required.'); return; }
    if (!user) return;
    setLoading(true);
    try {
      const record = {
        name: name.trim(), category, description: description.trim() || null,
        feed_type: feedType.trim() || null, feeding_schedule: feedingSchedule.trim() || null,
        nutritional_requirement: nutritionalRequirement.trim() || null,
        feeding_best_practices: feedingBestPractices.trim() || null,
        supplements_additives: supplementsAdditives.trim() || null,
      };
      if (isEditing) {
        const { error } = await supabase.from('feeding_info').update({ ...record, updated_at: new Date().toISOString() }).eq('id', params.editId!);
        if (error) throw error;
        Alert.alert('Success', 'Feeding info updated!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const { error } = await supabase.from('feeding_info').insert({ ...record, posted_by: user.id });
        if (error) throw error;
        Alert.alert('Success', 'Feeding info created!', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error: any) { Alert.alert('Error', error.message); }
    finally { setLoading(false); }
  };

  if (initialLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2E7D32" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-green-800 mb-4">{isEditing ? 'Edit Feeding Info' : 'New Feeding Info'}</Text>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Name *</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Feed name" value={name} onChangeText={setName} /></View>
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Category *</Text>
          <View className="flex-row flex-wrap gap-2">
            {FEEDING_CATEGORIES.map((c) => (
              <TouchableOpacity key={c} className={`px-4 py-2 rounded-full border ${category === c ? 'bg-green-700 border-green-700' : 'border-gray-300'}`} onPress={() => setCategory(c)}>
                <Text className={category === c ? 'text-white font-medium' : 'text-gray-700'}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Description</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} textAlignVertical="top" /></View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Feed Type</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Feed type" value={feedType} onChangeText={setFeedType} /></View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Feeding Schedule</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Schedule" value={feedingSchedule} onChangeText={setFeedingSchedule} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Nutritional Requirements</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Nutritional requirements" value={nutritionalRequirement} onChangeText={setNutritionalRequirement} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Best Practices</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Best practices" value={feedingBestPractices} onChangeText={setFeedingBestPractices} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <View className="mb-6"><Text className="text-sm font-medium text-gray-700 mb-1">Supplements & Additives</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Supplements and additives" value={supplementsAdditives} onChangeText={setSupplementsAdditives} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <TouchableOpacity className={`rounded-lg py-4 items-center mb-8 ${loading ? 'bg-green-400' : 'bg-green-700'}`} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">{isEditing ? 'Update' : 'Create'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
