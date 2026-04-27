import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';

export default function VerifyEmailScreen() {
  const { session, signOut } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  // Poll for email verification every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      setChecking(true);
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.email_confirmed_at) {
        // Refresh the session so the auth gate picks up the verified status
        await supabase.auth.refreshSession();
      }
      setChecking(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!session?.user.email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
      });
      if (error) throw error;
      setResendCooldown(30);
      Alert.alert('Sent', 'Verification email has been resent.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend email.');
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <Text className="text-2xl font-bold text-green-800 mb-4">Verify Your Email</Text>
      <Text className="text-gray-600 text-center mb-2">
        We've sent a verification link to:
      </Text>
      <Text className="text-green-700 font-semibold text-lg mb-6">
        {session?.user.email}
      </Text>
      <Text className="text-gray-500 text-center mb-8">
        Please check your inbox and click the link to verify your account.
        This page will update automatically.
      </Text>

      {checking && (
        <ActivityIndicator size="small" color="#2E7D32" className="mb-4" />
      )}

      <TouchableOpacity
        className={`rounded-lg py-3 px-8 ${
          resendCooldown > 0 ? 'bg-gray-300' : 'bg-green-700'
        }`}
        onPress={handleResend}
        disabled={resendCooldown > 0}
      >
        <Text className="text-white font-semibold">
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-6" onPress={signOut}>
        <Text className="text-gray-500">Sign out and try a different account</Text>
      </TouchableOpacity>
    </View>
  );
}
