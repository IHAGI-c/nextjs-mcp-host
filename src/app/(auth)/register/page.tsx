'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { toast } from '@/components/toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLocales } from '@/locales/use-locales';
import { type RegisterActionState, register } from '../actions';

export default function Page() {
  const { t } = useLocales();
  const [email, setEmail] = useState('');
  const [emailVerificationRequired, setEmailVerificationRequired] =
    useState(false);
  const [isSuccessful, _setIsSuccessful] = useState(false);
  const [clientError, setClientError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  // 비밀번호 실시간 검증을 위한 핸들러
  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
  };

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({
        type: 'error',
        description: state.error || 'Account already exists!',
      });
    } else if (state.status === 'failed') {
      toast({
        type: 'error',
        description: state.error || 'Failed to create account!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: state.error || 'Failed validating your submission!',
      });
    } else if (state.status === 'passwords_dont_match') {
      toast({
        type: 'error',
        description: state.error || 'Passwords do not match!',
      });
    } else if (state.status === 'success' && state.emailVerificationRequired) {
      setEmailVerificationRequired(true);
      toast({
        type: 'success',
        description:
          '이메일 인증 링크를 발송했습니다! 이메일을 확인하여 회원가입을 완료해주세요.',
      });
    }
  }, [state]);

  // 비밀번호와 확인 비밀번호가 변경될 때마다 일치 여부 확인
  useEffect(() => {
    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        setClientError('Passwords do not match!');
      } else {
        setClientError('');
      }
    } else {
      setClientError('');
    }
  }, [password, confirmPassword]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  if (emailVerificationRequired) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl">
          <Card className="w-full border-0 bg-card">
            <CardHeader className="text-center">
              <h1 className="text-xl font-semibold dark:text-zinc-50">
                {t('auth.checkEmail')}
              </h1>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
                  <strong>{email}</strong>로 인증 이메일을 발송했습니다.
                </p>
                <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
                  이메일의 인증 링크를 클릭하여 회원가입을 완료해주세요.
                </p>
                <p className="text-center text-xs text-gray-500 dark:text-zinc-500">
                  이메일 인증을 완료하지 않으면 로그인할 수 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            {t('auth.createAccount')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('auth.createAccountDescription')}
          </p>
        </div>
        <AuthForm
          action={handleSubmit}
          defaultEmail={email}
          showConfirmPassword={true}
          clientError={clientError}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
        >
          <SubmitButton isSuccessful={isSuccessful}>
            {t('auth.signUp')}
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              {t('auth.signIn')}
            </Link>{' '}
            {t('auth.here')}.
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
