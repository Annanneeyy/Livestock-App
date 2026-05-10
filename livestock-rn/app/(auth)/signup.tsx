import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Pressable, FlatList, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);

  const handleSignUp = async () => {
    if (Platform.OS === 'web') console.log('Sign Up Button Tapped');
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      console.log('Validation failed: Missing required fields');
      if (Platform.OS === 'web') alert('Please fill in all required fields.');
      else Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      console.log('Validation failed: Passwords do not match');
      if (Platform.OS === 'web') alert('Passwords do not match.');
      else Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      console.log('Validation failed: Password too short');
      if (Platform.OS === 'web') alert('Password must be at least 8 characters.');
      else Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    console.log('Validation passed. Starting sign up for:', email);
    try {
      const data = await signUp(email.trim(), password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender || undefined,
        purok: purok || undefined,
        barangay: barangay || undefined,
      });
      
      console.log('Sign up successful', data?.session ? 'Session created' : 'No session');
      
      if (data?.session) {
        // Automatically signed in by Supabase (email confirmation disabled)
        // Root layout will handle redirection to home/admin screen
        return;
      }

      const successMsg = 'Registration successful!';
      if (Platform.OS === 'web') {
        alert(successMsg);
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Success', successMsg, [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const isRateLimit = error.message?.includes('email rate limit exceeded');
      const errorMsg = isRateLimit 
        ? 'Too many signup attempts. Please try again later or increase limits in your Supabase Dashboard (Auth > Rate Limits).'
        : (error.message || 'An error occurred.');

      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert(isRateLimit ? 'Sign Up Limit Reached' : 'Sign Up Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const content = (
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
            <TouchableOpacity
              onPress={() => setShowBarangayDropdown(true)}
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row justify-between items-center"
            >
              <Text className={barangay ? 'text-gray-900' : 'text-gray-400'}>
                {barangay || 'Select Barangay'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <Modal
              visible={showBarangayDropdown}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowBarangayDropdown(false)}
            >
              <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl h-[60%]">
                  <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                    <Text className="text-xl font-bold text-gray-800">Select Barangay</Text>
                    <TouchableOpacity onPress={() => setShowBarangayDropdown(false)}>
                      <Ionicons name="close" size={28} color="#374151" />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={BARANGAYS}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    renderItem={({ item: b }) => (
                      <TouchableOpacity
                        className={`px-6 py-4 border-b border-gray-50 ${
                          barangay === b ? 'bg-green-50' : ''
                        }`}
                        onPress={() => {
                          setBarangay(b);
                          setShowBarangayDropdown(false);
                        }}
                      >
                        <View className="flex-row justify-between items-center">
                          <Text className={`text-lg ${barangay === b ? 'text-green-800 font-bold' : 'text-gray-700'}`}>
                            {b}
                          </Text>
                          {barangay === b && (
                            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Password *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="At least 8 characters"
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

          <Pressable
            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign Up</Text>
            )}
          </Pressable>

          <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
            <Text className="text-green-700 font-semibold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );

    if (Platform.OS === 'web') {
      return <View className="flex-1 bg-white">{content}</View>;
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        {content}
      </KeyboardAvoidingView>
    );
}
