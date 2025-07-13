'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

interface LanguageWrapperProps {
  children: React.ReactNode;
}

export default function LanguageWrapper({ children }: LanguageWrapperProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 언어 설정 가져오기
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['en', 'ko'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }
    
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return null; // 또는 로딩 컴포넌트
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
} 