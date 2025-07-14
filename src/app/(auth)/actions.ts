'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Legacy imports (will be removed after migration)
// import { createUser, getUser } from '@/lib/db/queries';
// import { signIn } from './auth';

// Validation schemas
const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerFormSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(1),
    companyName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Action result interfaces
export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  error?: string;
}

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data'
    | 'passwords_dont_match';
  error?: string;
  emailVerificationRequired?: boolean;
}

/**
 * 로그인 액션 (Supabase Auth 사용)
 */
export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return {
        status: 'failed',
        error: '이메일 또는 비밀번호가 올바르지 않습니다',
      };
    }

    // 이메일 인증 여부 확인 (게스트 사용자 제외)
    const isGuest =
      authData.user?.email?.startsWith('guest-') ||
      authData.user?.user_metadata?.is_guest;

    if (authData.user && !isGuest) {
      // 일반 사용자의 경우 반드시 이메일 인증이 완료되어야 함
      if (!authData.user.email_confirmed_at) {
        // 이메일 인증이 완료되지 않은 경우 즉시 로그아웃 처리
        await supabase.auth.signOut();
        return {
          status: 'failed',
          error: '회원가입이 완료되지 않았습니다. 이메일 인증을 완료해주세요.',
        };
      }

      // 프로필이 존재하는지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!profile) {
        // 프로필이 없는 경우 (이메일 인증은 했지만 프로필 생성 실패)
        await supabase.auth.signOut();
        return {
          status: 'failed',
          error: '계정 설정에 문제가 있습니다. 다시 회원가입해주세요.',
        };
      }
    }

    // 로그인 성공 시 홈페이지로 리다이렉트
    revalidatePath('/');
    redirect('/');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'invalid_data',
        error: '입력한 정보를 확인해 주세요',
      };
    }

    return {
      status: 'failed',
      error: '로그인 중 오류가 발생했습니다',
    };
  }
};

/**
 * 회원가입 액션 (Supabase Auth 사용)
 */
export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = registerFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      username: formData.get('username'),
      companyName: formData.get('companyName'),
    });

    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    // 1. Supabase Auth로 사용자 생성 (이메일 인증 포함)
    const { data: authData, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        // 이메일 인증 완료 후 리다이렉트될 URL 설정
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          username: validatedData.username,
          company_name: validatedData.companyName || null,
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return {
          status: 'user_exists',
          error: '이미 등록된 이메일입니다',
        };
      }

      return {
        status: 'failed',
        error: '회원가입 중 오류가 발생했습니다',
      };
    }

    // 이메일 인증이 완료되지 않은 상태에서는 프로필 생성하지 않음
    // 프로필은 이메일 인증 완료 후 콜백에서 생성됨

    // 사용자 메타데이터에 프로필 정보 저장 (이메일 인증 후 사용)
    if (authData.user) {
      // 이미 signUp에서 메타데이터로 저장했으므로 추가 작업 불필요
      console.log('User created with metadata, awaiting email verification');
    }

    // 회원가입 요청 성공 - 이메일 인증 대기 상태 반환
    return {
      status: 'success',
      emailVerificationRequired: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues;
      if (fieldErrors.some((e) => e.path.includes('confirmPassword'))) {
        return {
          status: 'passwords_dont_match',
          error: '비밀번호가 일치하지 않습니다',
        };
      }
      return {
        status: 'invalid_data',
        error: '입력한 정보를 확인해 주세요',
      };
    }

    return {
      status: 'failed',
      error: '회원가입 중 오류가 발생했습니다',
    };
  }
};

/**
 * 로그아웃 액션 (Supabase Auth 사용)
 */
export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * 게스트 로그인 액션 (Supabase Auth 사용)
 */
export async function signInAsGuest() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // 게스트용 임시 사용자 생성 (이메일 인증 건너뛰기)
  const guestEmail = `guest-${Date.now()}@example.com`;
  const guestPassword = `guest-${Math.random().toString(36).substring(2, 15)}`;

  const { error } = await supabase.auth.signUp({
    email: guestEmail,
    password: guestPassword,
    options: {
      emailRedirectTo: undefined,
      data: {
        is_guest: true,
      },
    },
  });

  if (error) {
    throw new Error('게스트 로그인에 실패했습니다');
  }

  redirect('/');
}
