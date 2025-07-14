'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useState } from 'react';

import { loginSchema, LoginFormValues } from '@/lib/schemas';
import { useAuth } from '@/hooks/use-auth';
import { useLocales } from '@/locales/use-locales';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

export default function Page() {
  const router = useRouter();
  const { login, loginLoading } = useAuth();
  const { t } = useLocales();
  const [isSuccessful, setIsSuccessful] = useState(false);
  // 폼 제출 로직
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // useAuth의 login 함수 사용
      const result = await login({
        email,
        password,
      });

      // 결과 처리
      if (result.success) {
        toast.success(result.message);
        setIsSuccessful(true);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        // 서버 에러 처리
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(t('auth.signInProcessError'));
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">{t('auth.signIn')}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('auth.signInDescription')}
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail="">
          <SubmitButton isSuccessful={isSuccessful || loginLoading}>
            {t('auth.signIn')}
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {t('auth.dontHaveAccount')}{' '}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              {t('auth.signUp')}
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
