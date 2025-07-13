'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useAuth } from '@/hooks/use-auth';
import { signupSchema, SignupFormValues } from '@/lib/schemas';
import { useLocales } from '@/locales/use-locales';

export default function Page() {
  const router = useRouter();
  const { register: registerUser, registerLoading } = useAuth();
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const { t } = useLocales();
  
  // useForm 설정
  const {
    formState: { errors },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 폼 제출 로직
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // 클라이언트 측 비밀번호 확인
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    try {
      // useAuth의 register 함수 사용
      const result = await registerUser({
        email,
        password,
      });

      // 결과 처리
      if (result.success) {
        // 이메일 확인이 필요한 경우
        if (result.message.includes('이메일') && result.message.includes('인증')) {
          setEmailVerificationRequired(true);
          toast.success(t('auth.signUpSuccess'));
        } else {
          // 일반적인 회원가입 성공
          toast.success(result.message);
          setIsSuccessful(true);
          setTimeout(() => {
            router.push("/");
          }, 1000);
        }
      } else {
        // 서버 에러 처리
        toast.error(result.message);
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      toast.error("회원가입 처리 중 오류가 발생했습니다.");
    }
  };

  // 이메일 확인 안내 화면
  if (emailVerificationRequired) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 pb-2">
            <h1 className="text-2xl font-bold tracking-tight dark:text-gray-100">{t('auth.emailVerification.title')}</h1>
            <p className="text-sm text-muted-foreground dark:text-gray-300">{t('auth.emailVerification.subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>{t('auth.emailVerification.message')}</strong>
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('auth.emailVerification.description')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground dark:text-gray-300 text-center">
                {t('auth.emailVerification.emailNotReceived')}
              </p>
            </div>
            <button 
              className="w-full bg-black dark:bg-white dark:text-black text-white hover:bg-black/90 dark:hover:bg-white/90 px-4 py-2 rounded-md"
              onClick={() => router.push("/login")}
            >
              {t('auth.emailVerification.goToLogin')}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">{t('auth.signUp')}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('auth.signUpDescription')}
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail="" showConfirmPassword={true}>
          <SubmitButton isSuccessful={isSuccessful || registerLoading}>
            {t('auth.signUpButton')}
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              {t('auth.signIn')}
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
