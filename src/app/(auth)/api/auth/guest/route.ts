import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    // 현재 사용자 세션 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // 게스트용 임시 사용자 생성 (이메일 인증 건너뛰기)
    const guestEmail = `guest-${Date.now()}@example.com`;
    const guestPassword = `guest-${Math.random().toString(36).substring(2, 15)}`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        // 게스트는 이메일 인증 건너뛰기
        emailRedirectTo: undefined,
        data: {
          is_guest: true,
        },
      },
    });

    if (authError) {
      console.error('Guest sign up error:', authError);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 게스트 로그인 성공 시 리다이렉트
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Guest authentication error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
