import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';

import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLivestockDetail, deleteLivestock, markAsSold } from '../../../lib/hooks/useLivestock';
import { useAuth } from '../../../lib/hooks/useAuth';
import ImageGallery from '../../../components/ImageGallery';
import CommentSection from '../../../components/CommentSection';
import { getOrCreateChat } from '../../../lib/hooks/useChat';

export default function PostDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { data, comments, loading, refetch } = useLivestockDetail(id!);
  const rolePath = profile?.role === 'admin' ? '(admin)' : '(farmer)';

  const handleGetDirections = () => {
    if (data?.latitude && data?.longitude) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${data.latitude},${data.longitude}`;
      const label = data.name || 'Live Swine';
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
        web: `https://www.google.com/maps/search/?api=1&query=${latLng}`
      });

      if (url) {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Alert.alert('Error', 'Map application is not available.');
          }
        });
      }
    } else {
      Alert.alert('Location not available', 'No coordinates found for this post.');
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace(`/${rolePath}/marketplace`);
    }
    if (from === 'map') {
      const mapPath = rolePath === '(admin)' ? 'map' : 'home';
      requestAnimationFrame(() => router.replace(`/${rolePath}/${mapPath}`));
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-lg">Post not found</Text>
      </View>
    );
  }

  const isOwner = user?.id === data.seller_id;

  const handleMarkAsSold = async () => {
    try {
      await markAsSold(data.id);
      Alert.alert('Success', 'Item marked as sold!');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to remove this listing? It will no longer be visible in the marketplace.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLivestock(data.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <Stack.Screen
        options={{
          title: data.name || 'Post Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={10}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ImageGallery images={data.images || []} />

      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">{data.name}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{data.category}</Text>
          </View>
          <Text className="text-2xl font-bold text-green-700">
            &#x20B1;{Number(data.price).toLocaleString()}
          </Text>
        </View>

        {/* Status */}
        <View className={`self-start px-3 py-1 rounded-full mb-4 ${
          data.is_available ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          <Text className={`text-sm font-medium ${
            data.is_available ? 'text-green-700' : 'text-red-700'
          }`}>
            {data.is_available ? 'Available' : 'Sold'}
          </Text>
        </View>

        {/* Description */}
        {data.description && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</Text>
            <Text className="text-gray-600 dark:text-gray-400">{data.description}</Text>
          </View>
        )}

        {/* Seller Info */}
        <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Seller</Text>
          <Text className="text-gray-900 dark:text-white">
            {data.seller?.first_name} {data.seller?.last_name}
          </Text>
          {data.seller?.barangay && (
            <Text className="text-sm text-gray-500">{data.seller.barangay}, Quezon</Text>
          )}
          {data.contact && (
            <Text className="text-sm text-green-700 mt-1">{data.contact}</Text>
          )}
        </View>

        {/* Location */}
        {data.location_text && (
          <View className="mb-4">
            <View className="flex-row items-center">
              <Ionicons name="location" size={16} color="#4ade80" />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1 flex-1">{data.location_text}</Text>
            </View>
            {data.latitude && data.longitude && (
              <TouchableOpacity
                className="flex-row items-center mt-2 bg-gray-50 dark:bg-gray-800 self-start px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                onPress={handleGetDirections}
              >
                <Ionicons name="navigate-circle" size={18} color="#2E7D32" />
                <Text className="text-sm font-semibold text-green-800 dark:text-green-400 ml-1.5">
                  Get Directions
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}


        {/* Action Buttons */}
        {!isOwner && user && (
          <TouchableOpacity
            className="flex-row bg-green-700 rounded-lg py-3 px-4 items-center justify-center mb-6"
            onPress={async () => {
              try {
                const chatId = await getOrCreateChat(data.seller_id);
                router.push({
                  pathname: `/${rolePath}/chats/${chatId}`,
                  params: { returnTo: `/${rolePath}/marketplace/${data.id}` }
                });
              } catch (err) {
                Alert.alert('Error', 'Could not start chat. Please try again.');
              }
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-base">Chat with Seller</Text>
          </TouchableOpacity>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <View className="mb-6">
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
                onPress={() => router.push({
                  pathname: `/${rolePath}/marketplace/create`,
                  params: { editId: data.id },
                })}
              >
                <Text className="text-white font-semibold">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-lg py-3 items-center"
                onPress={handleDelete}
              >
                <Text className="text-white font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
            
            {data.is_available && (
              <TouchableOpacity
                className="w-full bg-green-700 rounded-lg py-3 items-center"
                onPress={handleMarkAsSold}
              >
                <Text className="text-white font-semibold">Mark as Sold</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Comments */}
        {user && (
          <CommentSection
            livestockId={data.id}
            userId={user.id}
            comments={comments}
            onRefresh={refetch}
          />
        )}
      </View>
    </ScrollView>
  );
}
