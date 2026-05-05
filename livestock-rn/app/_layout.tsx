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
      // EXCEPT if we are on reset-password (which can happen after clicking a reset link)
      if (segments[1] !== 'reset-password') {
        router.replace('/(auth)/verify-email');
      }
    } else if (profile) {
      // Signed in and verified — route by role
      const role = profile.role?.toLowerCase();
      const inFarmerGroup = segments[0] === '(farmer)';
      const inAdminGroup = segments[0] === '(admin)';
      
      // Don't redirect if we are on reset-password or forgot-password
      if (segments[1] === 'reset-password' || segments[1] === 'forgot-password') {
        return;
      }

      if (role === 'admin') {
        if (!inAdminGroup) {
          router.replace('/(admin)/map');
        }
      } else {
        if (!inFarmerGroup) {
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
