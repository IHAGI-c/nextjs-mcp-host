import { createClient } from './client';
import type { Profile } from './types';

/**
 * 클라이언트 사이드에서 사용자 프로필을 가져옵니다
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

/**
 * 사용자 프로필을 업데이트합니다
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}

/**
 * 게스트 사용자인지 확인합니다
 */
export function isGuestUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.startsWith('guest-');
}

/**
 * 사용자 타입을 결정합니다
 */
export function getUserType(user: any): 'guest' | 'regular' {
  if (!user || !user.email) return 'guest';
  return isGuestUser(user.email) ? 'guest' : 'regular';
}
