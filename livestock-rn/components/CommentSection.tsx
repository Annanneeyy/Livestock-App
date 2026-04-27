import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addComment, deleteComment } from '../lib/hooks/useLivestock';
import type { Comment } from '../types/database';

interface Props {
  livestockId: string;
  userId: string;
  comments: Comment[];
  onRefresh: () => void;
}

export default function CommentSection({ livestockId, userId, comments, onRefresh }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(livestockId, userId, text.trim());
      setText('');
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteComment(commentId);
          onRefresh();
        },
      },
    ]);
  };

  return (
    <View>
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Comments ({comments.length})
      </Text>

      {comments.map((comment) => (
        <View key={comment.id} className="bg-gray-50 rounded-lg p-3 mb-2">
          <View className="flex-row justify-between items-start">
            <Text className="text-sm font-semibold text-gray-800">
              {comment.user?.first_name} {comment.user?.last_name}
            </Text>
            {comment.user_id === userId && (
              <TouchableOpacity onPress={() => handleDelete(comment.id)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-sm text-gray-700 mt-1">{comment.text}</Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(comment.created_at).toLocaleDateString()}
          </Text>
        </View>
      ))}

      <View className="flex-row items-center mt-2 gap-2">
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          placeholder="Add a comment..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          className="bg-green-700 rounded-lg px-4 py-2"
          onPress={handleSubmit}
          disabled={submitting || !text.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
