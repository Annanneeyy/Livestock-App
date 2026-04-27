import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [purok, setPurok] = useState(profile?.purok || '');
  const [barangay, setBarangay] = useState(profile?.barangay || '');
  const [saving, setSaving] = useState(false);

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
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
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
    <ScrollView className="flex-1 bg-gray-50">
      {/* Avatar */}
      <View className="items-center py-8 bg-white">
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
        <Text className="text-xl font-bold text-gray-900 mt-3">
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
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Purok</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={purok}
                onChangeText={setPurok}
              />
            </View>
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Barangay</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                value={barangay}
                onChangeText={setBarangay}
              />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
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
            <View className="bg-white rounded-xl p-4 mb-3">
              <InfoRow label="Barangay" value={profile.barangay || 'Not set'} />
              <InfoRow label="Purok" value={profile.purok || 'Not set'} />
              <InfoRow label="Municipality" value={profile.municipality} />
              <InfoRow label="Zip Code" value={profile.zip_code} />
              {profile.gender && <InfoRow label="Gender" value={profile.gender} />}
            </View>

            <TouchableOpacity
              className="bg-green-700 rounded-lg py-3 items-center mb-3"
              onPress={() => setEditing(true)}
            >
              <Text className="text-white font-semibold">Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          className="bg-red-50 rounded-lg py-3 items-center mt-4"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]);
          }}
        >
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50 last:border-0">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </View>
  );
}
