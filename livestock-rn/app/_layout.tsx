import '../global.css';
import '../lib/i18n';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, BackHandler, ToastAndroid, Platform } from 'react-native';
import { useAuth } from '../lib/hooks/useAuth';
import { useTheme } from '../lib/hooks/useTheme';

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const { isLoaded: themeLoaded } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    let backCount = 0;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we can go back within the stack, don't trigger the exit warning
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      if (backCount === 1) {
        BackHandler.exitApp();
        return true;
      }
      
      backCount = 1;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      setTimeout(() => {
        backCount = 0;
      }, 2000);
      return true;
    });
    
    return () => backHandler.remove();
  }, [router]);

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

  if (loading || !themeLoaded) {
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
