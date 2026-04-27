import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/hooks/useAuth';
import { createLivestock, updateLivestock } from '../../../lib/hooks/useLivestock';
import { supabase } from '../../../lib/supabase';
import { LIVESTOCK_CATEGORIES } from '../../../constants/theme';

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    editId?: string;
    lat?: string;
    lng?: string;
    locationText?: string;
    // Restored form state after returning from pick-location
    _name?: string;
    _category?: string;
    _price?: string;
    _description?: string;
    _contact?: string;
    _images?: string;
  }>();

  const isEditing = !!params.editId;

  const [name, setName] = useState(params._name || '');
  const [category, setCategory] = useState<string>(params._category || '');
  const [price, setPrice] = useState(params._price || '');
  const [description, setDescription] = useState(params._description || '');
  const [contact, setContact] = useState(params._contact || '');
  const [locationText, setLocationText] = useState(params.locationText || '');
  const [latitude, setLatitude] = useState<number | null>(params.lat ? parseFloat(params.lat) : null);
  const [longitude, setLongitude] = useState<number | null>(params.lng ? parseFloat(params.lng) : null);
  const [images, setImages] = useState<string[]>(params._images ? JSON.parse(params._images) : []);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Load existing post data when editing
  useEffect(() => {
    if (params.editId && !params._name) {
      setInitialLoading(true);
      supabase
        .from('livestock')
        .select('*, images:livestock_images(image_url)')
        .eq('id', params.editId)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.name);
            setCategory(data.category);
            setPrice(String(data.price));
            setDescription(data.description || '');
            setContact(data.contact || '');
            setLocationText(data.location_text || '');
            setLatitude(data.latitude ? Number(data.latitude) : null);
            setLongitude(data.longitude ? Number(data.longitude) : null);
            if (data.images) {
              setImages(data.images.map((img: any) => img.image_url));
            }
          }
          setInitialLoading(false);
        });
    }
  }, [params.editId]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.6,
      selectionLimit: 10 - images.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category || !price.trim()) {
      Alert.alert('Error', 'Please fill in name, category, and price.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      if (isEditing && params.editId) {
        await updateLivestock(params.editId, {
          name: name.trim(),
          category: category as any,
          price: parseFloat(price),
          description: description.trim() || null,
          contact: contact.trim() || null,
          latitude,
          longitude,
          location_text: locationText.trim() || null,
        }, images);
        Alert.alert('Success', 'Listing updated!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await createLivestock(
          {
            seller_id: user.id,
            name: name.trim(),
            category: category as any,
            price: parseFloat(price),
            description: description.trim() || null,
            contact: contact.trim() || null,
            latitude,
            longitude,
            location_text: locationText.trim() || null,
            is_available: true,
          },
          images
        );
        Alert.alert('Success', 'Livestock posted!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {initialLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-green-800 mb-4">
          {isEditing ? 'Edit Listing' : 'Post Livestock'}
        </Text>

        {/* Images */}
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Photos ({images.length}/10)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {images.map((uri, i) => (
              <View key={i} className="relative">
                <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                <TouchableOpacity
                  className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center"
                  onPress={() => removeImage(i)}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 10 && (
              <TouchableOpacity
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center"
                onPress={pickImages}
              >
                <Ionicons name="camera" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Name *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="e.g. Healthy Piglet"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Category *</Text>
          <View className="flex-row gap-2">
            {LIVESTOCK_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                className={`flex-1 py-3 rounded-lg border items-center ${
                  category === c ? 'bg-green-700 border-green-700' : 'border-gray-300'
                }`}
                onPress={() => setCategory(c)}
              >
                <Text className={category === c ? 'text-white font-semibold' : 'text-gray-700'}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Price (&#x20B1;) *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Describe your livestock..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Contact */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Contact</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Phone number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
        </View>

        {/* Location */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Location</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            onPress={() => router.push({
              pathname: '/(farmer)/marketplace/pick-location',
              params: {
                _name: name,
                _category: category,
                _price: price,
                _description: description,
                _contact: contact,
                _images: JSON.stringify(images),
                editId: params.editId || '',
              },
            })}
          >
            <Text className={locationText ? 'text-gray-900' : 'text-gray-400'}>
              {locationText || 'Pick location on map'}
            </Text>
            <Ionicons name="location" size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mb-8 ${
            loading ? 'bg-green-400' : 'bg-green-700'
          }`}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              {isEditing ? 'Update Listing' : 'Post Listing'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
