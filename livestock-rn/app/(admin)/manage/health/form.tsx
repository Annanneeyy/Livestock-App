import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { supabase } from '../../../../lib/supabase';

export default function HealthGuidelineFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!params.editId;

  const [disease, setDisease] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prevention, setPrevention] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (params.editId) {
      setInitialLoading(true);
      supabase.from('health_guidelines').select('*').eq('id', params.editId).single().then(({ data }) => {
        if (data) { setDisease(data.disease); setSymptoms(data.symptoms || ''); setTreatment(data.treatment || ''); setPrevention(data.prevention || ''); }
        setInitialLoading(false);
      });
    }
  }, [params.editId]);

  const handleSubmit = async () => {
    if (!disease.trim()) { Alert.alert('Error', 'Disease name is required.'); return; }
    if (!user) return;
    setLoading(true);
    try {
      if (isEditing) {
        const { error } = await supabase.from('health_guidelines').update({ disease: disease.trim(), symptoms: symptoms.trim() || null, treatment: treatment.trim() || null, prevention: prevention.trim() || null, updated_at: new Date().toISOString() }).eq('id', params.editId!);
        if (error) throw error;
        Alert.alert('Success', 'Guideline updated!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const { error } = await supabase.from('health_guidelines').insert({ disease: disease.trim(), symptoms: symptoms.trim() || null, treatment: treatment.trim() || null, prevention: prevention.trim() || null, posted_by: user.id });
        if (error) throw error;
        Alert.alert('Success', 'Guideline created!', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error: any) { Alert.alert('Error', error.message); }
    finally { setLoading(false); }
  };

  if (initialLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2E7D32" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-green-800 mb-4">{isEditing ? 'Edit Health Guideline' : 'New Health Guideline'}</Text>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Disease *</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Disease name" value={disease} onChangeText={setDisease} /></View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Symptoms</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Symptoms" value={symptoms} onChangeText={setSymptoms} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <View className="mb-4"><Text className="text-sm font-medium text-gray-700 mb-1">Treatment</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Treatment" value={treatment} onChangeText={setTreatment} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <View className="mb-6"><Text className="text-sm font-medium text-gray-700 mb-1">Prevention</Text><TextInput className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Prevention" value={prevention} onChangeText={setPrevention} multiline numberOfLines={3} textAlignVertical="top" /></View>
        <TouchableOpacity className={`rounded-lg py-4 items-center mb-8 ${loading ? 'bg-green-400' : 'bg-green-700'}`} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">{isEditing ? 'Update' : 'Create'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
