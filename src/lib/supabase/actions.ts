'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from './server';

// Validation schemas
const signUpSchema = z
  .object({
    email: z.string().email('유효한 이메일 주소를 입력해주세요'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, '이름을 입력해주세요'),
    lastName: z.string().min(1, '성을 입력해주세요'),
    companyName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

const signInSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

// Action result types
export interface ActionResult {
  success?: boolean;
  error?: string;
  status?:
    | 'idle'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'user_exists'
    | 'passwords_dont_match';
}

/**
 * 회원가입 액션
 */
export async function signUpAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // 폼 데이터 검증
    const validatedData = signUpSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      companyName: formData.get('companyName'),
    });

    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    // 1. Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      // 이미 존재하는 사용자인 경우
      if (authError.message.includes('already registered')) {
        return { status: 'user_exists', error: '이미 존재하는 이메일입니다' };
      }
      return { status: 'failed', error: authError.message };
    }

    // 2. 프로필 정보 저장
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        company_name: validatedData.companyName || null,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // 사용자는 생성되었지만 프로필 생성 실패
        // 나중에 프로필을 다시 생성할 수 있도록 함
      }
    }

    revalidatePath('/');
    return { status: 'success', success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const passwordMismatchError = error.issues.find(
        (err) => err.path[0] === 'confirmPassword',
      );

      if (passwordMismatchError) {
        return {
          status: 'passwords_dont_match',
          error: '비밀번호가 일치하지 않습니다',
        };
      }

      return {
        status: 'invalid_data',
        error: '입력 데이터가 올바르지 않습니다',
      };
    }

    console.error('Sign up error:', error);
    return { status: 'failed', error: '회원가입에 실패했습니다' };
  }
}

/**
 * 로그인 액션
 */
export async function signInAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const validatedData = signInSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return {
        status: 'failed',
        error: '이메일 또는 비밀번호가 올바르지 않습니다',
      };
    }

    revalidatePath('/');
    return { status: 'success', success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'invalid_data',
        error: '입력 데이터가 올바르지 않습니다',
      };
    }

    console.error('Sign in error:', error);
    return { status: 'failed', error: '로그인에 실패했습니다' };
  }
}

/**
 * 로그아웃 액션
 */
export async function signOutAction() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/login');
}

/**
 * 게스트 로그인 액션
 */
export async function signInAsGuestAction() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // 게스트용 임시 이메일과 비밀번호 생성
  const guestEmail = `guest-${Date.now()}@example.com`;
  const guestPassword = `guest-${Math.random().toString(36).substring(2, 15)}`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: guestEmail,
    password: guestPassword,
  });

  if (authError) {
    console.error('Guest sign up error:', authError);
    return { error: '게스트 로그인에 실패했습니다' };
  }

  // 게스트는 별도 프로필 생성하지 않음
  revalidatePath('/');
  return { success: true };
}
