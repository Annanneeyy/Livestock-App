import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLivestockDetail, deleteLivestock } from '../../../lib/hooks/useLivestock';
import { useAuth } from '../../../lib/hooks/useAuth';
import ImageGallery from '../../../components/ImageGallery';
import CommentSection from '../../../components/CommentSection';
import { getOrCreateChat } from '../../../lib/hooks/useChat';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, comments, loading, refetch } = useLivestockDetail(id!);

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

  const handleDelete = () => {
    Alert.alert('Delete Post', 'This action cannot be undone.', [
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
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen 
        options={{ 
          title: data.name || 'Post Details',
          headerBackVisible: true, // Force back button visibility
        }} 
      />
      <ImageGallery images={data.images || []} />

      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{data.name}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{data.category}</Text>
          </View>
          <Text className="text-2xl font-bold text-green-700">
            &#x20B1;{Number(data.price).toLocaleString()}
          </Text>
        </View>

        {/* Status */}
        <View className={`self-start px-3 py-1 rounded-full mb-4 ${
          data.is_available ? 'bg-green-100' : 'bg-red-100'
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
            <Text className="text-sm font-semibold text-gray-700 mb-1">Description</Text>
            <Text className="text-gray-600">{data.description}</Text>
          </View>
        )}

        {/* Seller Info */}
        <View className="bg-gray-50 rounded-lg p-3 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Seller</Text>
          <Text className="text-gray-900">
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
          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={16} color="#2E7D32" />
            <Text className="text-sm text-gray-600 ml-1">{data.location_text}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {!isOwner && user && (
          <TouchableOpacity
            className="flex-row bg-green-700 rounded-lg py-3 px-4 items-center justify-center mb-6"
            onPress={async () => {
              try {
                const chatId = await getOrCreateChat(data.seller_id);
                router.push(`/(farmer)/chats/${chatId}`);
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
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
              onPress={() => router.push({
                pathname: '/(farmer)/marketplace/create',
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
