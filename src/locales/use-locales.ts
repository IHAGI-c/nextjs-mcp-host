import { useTranslation } from 'react-i18next';
import { changeLanguage, supportedLanguages } from './translate.utils';

export function useLocales() {
  const { t, i18n } = useTranslation();

  // 현재 언어
  const currentLanguage = i18n.language;

  // 언어 변경
  const setLanguage = async (languageCode: string) => {
    await changeLanguage(languageCode);
  };

  // 번역 함수 (useTranslation의 t 함수 사용)
  const translate = (key: string, options?: any): string => {
    return t(key, options) as string;
  };

  // 지원되는 언어 목록
  const languages = supportedLanguages;

  // 현재 언어 정보
  const currentLanguageInfo = languages.find(
    (lang) => lang.code === currentLanguage,
  );

  return {
    t: translate,
    currentLanguage,
    currentLanguageInfo,
    setLanguage,
    languages,
    isReady: i18n.isInitialized,
  };
}

// 간편한 번역 훅
export function useT() {
  const { t } = useTranslation();
  return (key: string, options?: any): string => t(key, options) as string;
}
