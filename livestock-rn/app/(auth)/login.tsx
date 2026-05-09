import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err.message || 'An error occurred.';
      setError(message === 'Invalid login credentials' 
        ? 'Invalid email or password. Please try again.' 
        : message);
      
      if (Platform.OS !== 'web') {
        Alert.alert('Login Failed', message);
      }
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
        <View className="flex-1 justify-center px-8 py-12">
          <View className="items-center mb-8">
            <Image
              source={require('../../assets/images/cute_pig_icon.png')}
              className="w-24 h-24 mb-4"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-green-800">
              Livestock App
            </Text>
            <Text className="text-gray-500 mt-1">
              Municipality of Quezon, Bukidnon
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              autoCapitalize="none"

              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry

              textContentType="password"
            />
            <TouchableOpacity 
              className="mt-2 self-end"
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text className="text-green-700 text-sm font-medium">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-red-600 text-sm text-center font-medium">
                {error}
              </Text>
            </View>
          )}

          <TouchableOpacity

            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Log In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="text-green-700 font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
