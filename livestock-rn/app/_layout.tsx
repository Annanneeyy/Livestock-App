import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/hooks/useAuth';

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Not signed in — redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (session && !session.user.email_confirmed_at) {
      // Signed in but email not verified
      router.replace('/(auth)/verify-email');
    } else if (profile) {
      // Signed in and verified — route by role
      if (inAuthGroup) {
        if (profile.role === 'admin') {
          router.replace('/(admin)/map');
        } else {
          router.replace('/(farmer)/home');
        }
      }
    }
  }, [session, profile, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return <AuthGate />;
}
