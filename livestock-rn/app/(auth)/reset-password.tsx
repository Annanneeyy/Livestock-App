import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';

export default function ResetPasswordScreen() {
  const { updatePassword, signOut } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      Alert.alert(
        'Success',
        'Your password has been updated successfully. Please log in with your new password.',
        [{ 
          text: 'OK', 
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          } 
        }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8 py-12 justify-center flex-1">
          <Text className="text-2xl font-bold text-green-800 mb-2">Set New Password</Text>
          <Text className="text-gray-600 mb-8">
            Please enter your new password below.
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">New Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-1">Confirm New Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Update Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-6 items-center" 
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
          >
            <Text className="text-green-700 font-semibold">Cancel and Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
