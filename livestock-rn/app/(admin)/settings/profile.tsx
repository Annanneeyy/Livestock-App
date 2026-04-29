import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';

export default function ProfileDetailsScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    barangay: ''
  });
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        barangay: profile.barangay || ''
      });
      setImage(profile.avatar_url || null);
    }
  }, [profile]);

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
        
        if (Platform.OS === 'web') {
          // Web handling for image upload
          const response = await fetch(image);
          const blob = await response.blob();
          const { error: uploadError } = await supabase.storage
            .from('livestock-images')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: true
            });
          if (uploadError) throw uploadError;
        } else {
          // Mobile handling
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
        }

        const { data: urlData } = supabase.storage
          .from('livestock-images')
          .getPublicUrl(fileName);
        
        avatarUrl = urlData.publicUrl;
      }

      // 2. Update Profile table
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          barangay: formData.barangay,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      if (Platform.OS === 'web') {
        alert('Profile updated successfully');
        router.push('/(admin)/settings');
      } else {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.push('/(admin)/settings') }
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert('Error: ' + err.message);
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 max-w-2xl mx-auto w-full">
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
            label="Email Address (Locked)" 
            value={user?.email || ''} 
            editable={false} 
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
          style={{ width: '100%' }}
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

function InputGroup({ label, value, onChangeText, editable = true }: any) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-500 mb-1 ml-1">{label}</Text>
      <TextInput
        style={{
          backgroundColor: editable ? '#F9FAFB' : '#F3F4F6',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          color: editable ? '#111827' : '#9CA3AF',
          fontSize: 16,
          minHeight: 50, // Added for web visibility
          width: '100%',
        }}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        autoCapitalize="none"
      />
    </View>
  );
}
