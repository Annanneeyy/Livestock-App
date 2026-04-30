import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

const THEME_KEY = 'user-theme';

export function useTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativeWindColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setColorScheme(savedTheme as any);
        } else {
          // Default to light
          setColorScheme('light');
          await AsyncStorage.setItem(THEME_KEY, 'light');
        }
      } catch (e) {
        setColorScheme('light');
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, [setColorScheme]);

  const setTheme = async (theme: 'light' | 'dark') => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    setColorScheme(theme);
  };

  return {
    theme: colorScheme,
    setTheme,
    toggleTheme: toggleColorScheme,
    isLoaded,
  };
}
