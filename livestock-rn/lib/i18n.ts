import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './translations/en.json';
import fil from './translations/fil.json';
import bis from './translations/bis.json';

const resources = {
  en: { translation: en },
  fil: { translation: fil },
  bis: { translation: bis },
};

const LANGUAGE_KEY = 'user-language';

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!savedLanguage) {
    // Try to match device language or fallback to English
    const deviceLanguage = Localization.getLocales()[0].languageCode;
    savedLanguage = resources[deviceLanguage as keyof typeof resources] ? deviceLanguage : 'en';
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;
