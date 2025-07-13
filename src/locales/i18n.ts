import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './langs/en';
import ko from './langs/ko';

const resources = {
  en: {
    translation: en
  },
  ko: {
    translation: ko
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // 기본 언어
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    react: {
      useSuspense: false // Next.js에서 SSR 지원
    }
  });

export default i18n; 