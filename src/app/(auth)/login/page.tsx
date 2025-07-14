'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { toast } from '@/components/toast';
import { useLocales } from '@/locales/use-locales';
import { type LoginActionState, login } from '../actions';

export default function Page() {
  const { t } = useLocales();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSuccessful, _setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    // URL 파라미터에서 에러 메시지 확인 (이메일 인증 실패 등)
    const errorFromUrl = searchParams.get('error');
    if (errorFromUrl) {
      toast({
        type: 'error',
        description: errorFromUrl,
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: state.error || 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: state.error || 'Failed validating your submission!',
      });
    }
    // 성공 처리는 서버 액션에서 리다이렉트로 처리됨
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            {t('auth.signIn')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('auth.signInDescription')}
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
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
