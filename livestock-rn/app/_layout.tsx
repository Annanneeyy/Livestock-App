import '../global.css';
import '../lib/i18n';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, View, BackHandler, ToastAndroid, Platform } from 'react-native';
import { useAuth } from '../lib/hooks/useAuth';
import { useTheme } from '../lib/hooks/useTheme';

export default function RootLayout() {
  const { session, profile, loading } = useAuth();
  const { isLoaded: themeLoaded } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    let backCount = 0;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
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
    if (loading || !navigationState?.key) return;

    // Small delay to ensure the navigator is fully ready
    const timeout = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!session) {
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } else if (session && !session.user.email_confirmed_at) {
        if (segments[1] !== 'reset-password') {
          router.replace('/(auth)/verify-email');
        }
      } else if (profile) {
        const role = profile.role?.toLowerCase();
        const inFarmerGroup = segments[0] === '(farmer)';
        const inAdminGroup = segments[0] === '(admin)';
        
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
    }, 1);

    return () => clearTimeout(timeout);
  }, [session, profile, loading, segments, navigationState?.key]);

  return (
    <>
      <Slot />
      {(loading || !themeLoaded) && (
        <View 
          className="absolute inset-0 items-center justify-center bg-white z-50"
        >
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      )}
    </>
  );
}
