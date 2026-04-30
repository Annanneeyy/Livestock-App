import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useTheme } from '../../../lib/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminSettingsIndex() {
  const { signOut, profile } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('user-language', lng);
  };

  const sections = [
    {
      title: t('settings.title'),
      items: [
        { label: 'Profile Details', icon: 'person-outline', route: '/(admin)/settings/profile' },
        { label: 'Messages', icon: 'chatbubbles-outline', route: '/(admin)/chats' },
        { label: 'Notification Preferences', icon: 'notifications-outline', route: '/(admin)/settings/notifications' },
      ]
    },
    {
      title: t('settings.language'),
      items: [
        { label: 'English', icon: 'language-outline', action: () => changeLanguage('en'), active: i18n.language === 'en' },
        { label: 'Filipino', icon: 'language-outline', action: () => changeLanguage('fil'), active: i18n.language === 'fil' },
        { label: 'Bisaya', icon: 'language-outline', action: () => changeLanguage('bis'), active: i18n.language === 'bis' },
      ]
    },
    {
      title: t('settings.theme'),
      items: [
        { label: t('settings.light'), icon: 'sunny-outline', action: () => setTheme('light'), active: theme === 'light' },
        { label: t('settings.dark'), icon: 'moon-outline', action: () => setTheme('dark'), active: theme === 'dark' },
      ]
    },
    {
      title: 'Admin Tools',
      items: [
        { label: 'Manage Admins', icon: 'people-outline', route: '/(admin)/settings/admins' },
      ]
    }
  ];

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      contentContainerStyle={Platform.OS === 'web' ? { paddingBottom: 100 } : undefined}
    >
      <View className="p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
            <Text className="text-green-700 text-2xl font-bold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </Text>
          </View>
          <View className="ml-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{profile?.first_name} {profile?.last_name}</Text>
            <Text className="text-gray-500 capitalize">{profile?.role} Account</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 px-4">
        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-sm font-semibold text-gray-400 mb-2 uppercase ml-2">{section.title}</Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, idx) => (
                <TouchableOpacity 
                  key={item.label}
                  className={`flex-row items-center p-4 ${idx < section.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
                  onPress={() => item.route ? router.push(item.route as any) : item.action?.()}
                >
                  <Ionicons name={item.icon as any} size={22} color={item.active ? '#2E7D32' : '#4B5563'} />
                  <Text className={`flex-1 ml-3 text-base ${item.active ? 'text-green-700 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </Text>
                  {item.active ? (
                    <Ionicons name="checkmark" size={20} color="#2E7D32" />
                  ) : (
                    item.route && <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          className="mt-4 bg-red-50 dark:bg-red-900/20 py-3 rounded-lg flex-row items-center justify-center mb-10"
          onPress={() => {
            if (Platform.OS === 'web') {
              if (confirm(t('auth.sign_out_confirm'))) {
                signOut();
              }
            } else {
              Alert.alert(t('auth.sign_out'), t('auth.sign_out_confirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('auth.sign_out'), style: 'destructive', onPress: signOut },
              ]);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text 
            className="ml-2 text-red-600 font-semibold"
            style={{ flexShrink: 0 }}
          >
            {t('auth.sign_out') || 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
