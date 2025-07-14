import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 이메일 인증 성공 - 프로필 데이터 생성
      try {
        // 사용자 메타데이터에서 프로필 정보 추출
        const metadata = data.user.user_metadata || {};

        // 프로필이 이미 존재하는지 확인
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // 프로필이 존재하지 않는 경우에만 생성
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              first_name: metadata.first_name || null,
              last_name: metadata.last_name || null,
              username: metadata.username || null,
              email: data.user.email,
              company_name: metadata.company_name || null,
            });

          if (profileError) {
            console.error(
              'Profile creation error after email verification:',
              profileError,
            );
            // 프로필 생성 실패해도 로그인은 허용 (나중에 프로필 편집에서 생성 가능)
          } else {
            console.log(
              'Profile created successfully after email verification',
            );
          }
        }
      } catch (profileCreationError) {
        console.error('Error during profile creation:', profileCreationError);
        // 프로필 생성 실패해도 로그인은 허용
      }

      // 이메일 인증 및 프로필 설정 완료 - 홈페이지로 리다이렉트
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // 인증 실패 시 에러와 함께 로그인 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL('/login?error=이메일 인증에 실패했습니다', request.url),
  );
}
