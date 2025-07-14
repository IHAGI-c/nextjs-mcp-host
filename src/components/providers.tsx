'use client';

// Legacy NextAuth Provider (commented out for migration)
// import { SessionProvider } from 'next-auth/react';

import LanguageWrapper from '@/locales/language-wrapper';
// New Supabase Auth Provider
import { AuthProvider } from './auth-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageWrapper>{children}</LanguageWrapper>
    </AuthProvider>
  );
}
