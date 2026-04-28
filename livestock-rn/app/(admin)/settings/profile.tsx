import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export default function ProfileDetailsScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    barangay: ''
  });
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: user?.email || '', // Email comes from Auth user, not Profiles table
        barangay: profile.barangay || ''
      });
      setImage(profile.avatar_url || null);
    }
  }, [profile, user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      let avatarUrl = image;

      // 1. Handle Image Upload if changed
      if (image && !image.startsWith('http')) {
        const fileName = `avatars/${profile.id}_${Date.now()}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(image, {
          encoding: 'base64',
        });

        const { error: uploadError } = await supabase.storage
          .from('livestock-images')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('livestock-images')
          .getPublicUrl(fileName);
        
        avatarUrl = urlData.publicUrl;
      }

      // 2. Update Auth Email if changed
      if (formData.email !== user?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email
        });
        if (authError) throw authError;
        Alert.alert('Email Update', 'A confirmation link has been sent to your new email address.');
      }

      // 3. Update Profile table (removed email as it doesn't exist in profiles table)
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          barangay: formData.barangay,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Profile details updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center border-4 border-white shadow-sm overflow-hidden">
            {image ? (
              <Image source={{ uri: image }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={48} color="#2E7D32" />
            )}
          </View>
          <TouchableOpacity className="mt-2" onPress={pickImage}>
            <Text className="text-green-700 font-semibold">Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View>
          <InputGroup 
            label="First Name" 
            value={formData.first_name} 
            onChangeText={(text: string) => setFormData({...formData, first_name: text})}
          />
          <InputGroup 
            label="Last Name" 
            value={formData.last_name} 
            onChangeText={(text: string) => setFormData({...formData, last_name: text})}
          />
          <InputGroup 
            label="Email Address" 
            value={formData.email} 
            onChangeText={(text: string) => setFormData({...formData, email: text})}
            keyboardType="email-address"
          />
          <InputGroup 
            label="Barangay" 
            value={formData.barangay} 
            onChangeText={(text: string) => setFormData({...formData, barangay: text})}
          />
        </View>

        <TouchableOpacity 
          className={`mt-8 py-4 rounded-2xl items-center shadow-md ${loading ? 'bg-green-200' : 'bg-green-700'}`}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InputGroup({ label, value, onChangeText, editable = true, keyboardType = 'default' }: any) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-500 mb-1 ml-1">{label}</Text>
      <TextInput
        className={`bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-900 ${!editable ? 'text-gray-400' : ''}`}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}
