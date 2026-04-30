import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, Alert,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../../lib/hooks/useAuth';
import { useTheme } from '../../lib/hooks/useTheme';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [purok, setPurok] = useState(profile?.purok || '');
  const [barangay, setBarangay] = useState(profile?.barangay || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPurok(profile.purok || '');
      setBarangay(profile.barangay || '');
    }
  }, [profile]);

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('user-language', lng);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          purok: purok.trim() || null,
          barangay: barangay.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const fileName = `${user.id}/avatar.jpg`;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      await refreshProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      contentContainerStyle={Platform.OS === 'web' ? { paddingBottom: 100 } : undefined}
    >
      {/* Avatar */}
      <View className="items-center py-8 bg-white dark:bg-gray-800">
        <TouchableOpacity onPress={handleAvatarPick}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
              <Text className="text-3xl">
                {profile.first_name[0]}{profile.last_name[0]}
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 bg-green-700 rounded-full w-8 h-8 items-center justify-center">
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white mt-3">
          {profile.first_name} {profile.last_name}
        </Text>
        <Text className="text-sm text-gray-500">{user?.email}</Text>
        <Text className="text-xs text-green-700 mt-1 uppercase">{profile.role}</Text>
      </View>

      {/* Info */}
      <View className="p-4">
        {editing ? (
          <>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">First Name</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Purok</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
                value={purok}
                onChangeText={setPurok}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Barangay</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white"
                value={barangay}
                onChangeText={setBarangay}
              />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3 items-center"
                onPress={() => setEditing(false)}
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-700 rounded-lg py-3 items-center"
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
              <InfoRow label="Barangay" value={profile.barangay || 'Not set'} />
              <InfoRow label="Purok" value={profile.purok || 'Not set'} />
              <InfoRow label="Municipality" value={profile.municipality} />
              <InfoRow label="Zip Code" value={profile.zip_code} />
              {profile.gender && <InfoRow label="Gender" value={profile.gender} />}
            </View>

            <TouchableOpacity
              className="bg-green-700 rounded-lg py-3 items-center mb-6"
              onPress={() => setEditing(true)}
            >
              <Text className="text-white font-semibold">Edit Profile</Text>
            </TouchableOpacity>

            {/* Language Selection */}
            <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-1">{t('settings.language')}</Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              {[
                { label: 'English', code: 'en' },
                { label: 'Filipino', code: 'fil' },
                { label: 'Bisaya', code: 'bis' }
              ].map((lang, idx) => (
                <TouchableOpacity
                  key={lang.code}
                  className={`flex-row items-center p-4 ${idx < 2 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text className={`flex-1 text-base ${i18n.language === lang.code ? 'text-green-700 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {lang.label}
                  </Text>
                  {i18n.language === lang.code && <Ionicons name="checkmark" size={20} color="#2E7D32" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Theme Selection */}
            <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-1">{t('settings.theme')}</Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              {[
                { label: t('settings.light'), value: 'light', icon: 'sunny-outline' },
                { label: t('settings.dark'), value: 'dark', icon: 'moon-outline' }
              ].map((item, idx) => (
                <TouchableOpacity
                  key={item.value}
                  className={`flex-row items-center p-4 ${idx < 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
                  onPress={() => setTheme(item.value as any)}
                >
                  <Ionicons name={item.icon as any} size={20} color={theme === item.value ? '#2E7D32' : '#4B5563'} />
                  <Text className={`flex-1 ml-3 text-base ${theme === item.value ? 'text-green-700 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </Text>
                  {theme === item.value && <Ionicons name="checkmark" size={20} color="#2E7D32" />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 items-center mt-2 mb-10 flex-row justify-center"
          onPress={() => {
            if (Platform.OS === 'web') {
              if (confirm(t('auth.sign_out_confirm'))) {
                signOut();
              }
            } else {
              Alert.alert(t('auth.sign_out'), t('auth.sign_out_confirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('auth.sign_out'), style: 'destructive', onPress: signOut },
              ]);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="ml-2 text-red-600 font-semibold" style={{ flexShrink: 0 }}>
            {t('auth.sign_out') || 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50 last:border-0">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 dark:text-white">{value}</Text>
    </View>
  );
}
