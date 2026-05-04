import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { resetPassword, verifyResetOtp } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setStep('otp');
      Alert.alert(
        'Email Sent',
        'If an account exists, you will receive a 6-digit code. Please check your email.'
      );
    } catch (error: any) {
      if (error.message?.includes('email rate limit exceeded')) {
        Alert.alert('Limit Reached', 'Too many requests. Please try again later.');
      } else {
        Alert.alert('Error', error.message || 'An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await verifyResetOtp(email.trim(), otp);
      // Success - user now has a session, navigate to reset-password
      router.push('/(auth)/reset-password');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid code.');
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
          <Text className="text-2xl font-bold text-green-800 mb-2">
            {step === 'email' ? 'Forgot Password?' : 'Enter Verification Code'}
          </Text>
          <Text className="text-gray-600 mb-8">
            {step === 'email' 
              ? "Enter your email address and we'll send you a verification code."
              : `We've sent a 6-digit code to ${email}. Please enter it below.`
            }
          </Text>

          {step === 'email' ? (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email Address</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          ) : (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">6-Digit Code</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base text-center font-bold tracking-widest"
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity 
                className="mt-4" 
                onPress={() => setStep('email')}
                disabled={loading}
              >
                <Text className="text-green-700 text-center">Use a different email</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${loading ? 'bg-green-400' : 'bg-green-700'}`}
            onPress={step === 'email' ? handleRequestReset : handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                {step === 'email' ? 'Send Code' : 'Verify Code'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-6 items-center" 
            onPress={() => step === 'email' ? router.back() : setStep('email')}
          >
            <Text className="text-green-700 font-semibold">
              {step === 'email' ? 'Back to Login' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
