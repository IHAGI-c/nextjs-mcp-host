'use client';

import { SessionProvider } from 'next-auth/react';
import LanguageWrapper from '@/locales/language-wrapper';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageWrapper>
        {children}
      </LanguageWrapper>
    </SessionProvider>
  );
} 