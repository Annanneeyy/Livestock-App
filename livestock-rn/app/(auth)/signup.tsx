import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';
import { BARANGAYS } from '../../constants/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [purok, setPurok] = useState('');
  const [barangay, setBarangay] = useState('');
  const [gender, setGender] = useState('');

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender || undefined,
        purok: purok || undefined,
        barangay: barangay || undefined,
      });
      // Auth state change will redirect to verify-email via the auth gate
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred.');
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
        <View className="px-8 py-12">
          <Text className="text-2xl font-bold text-green-800 mb-6">Create Account</Text>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">First Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Last Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Email *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Gender</Text>
            <View className="flex-row gap-3">
              {['Male', 'Female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`flex-1 py-3 rounded-lg border items-center ${
                    gender === g ? 'bg-green-700 border-green-700' : 'border-gray-300'
                  }`}
                  onPress={() => setGender(g)}
                >
                  <Text className={gender === g ? 'text-white font-semibold' : 'text-gray-700'}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Purok</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Purok"
              value={purok}
              onChangeText={setPurok}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Barangay</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {BARANGAYS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    className={`px-4 py-2 rounded-full border ${
                      barangay === b ? 'bg-green-700 border-green-700' : 'border-gray-300'
                    }`}
                    onPress={() => setBarangay(b)}
                  >
                    <Text className={barangay === b ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Password *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
            <Text className="text-green-700 font-semibold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
