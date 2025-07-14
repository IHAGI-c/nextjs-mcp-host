import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './server';

/**
 * 서버 사이드에서 현재 사용자 정보를 가져옵니다
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, profile: null };
    }

    // 프로필 정보도 함께 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile };
  } catch (_error) {
    return { user: null, profile: null };
  }
}
