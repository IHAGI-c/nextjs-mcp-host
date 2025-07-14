'use client';

import type { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile, getUserType, isGuestUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import type { AuthContextType, Profile } from '@/lib/supabase/types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  userType: 'guest',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인
    async function getInitialSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (mounted) {
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setProfile(null);
        } else if (session?.user) {
          setUser(session.user);
          // 프로필 정보 가져오기
          if (!isGuestUser(session.user.email)) {
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    }

    getInitialSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          // 프로필 정보 가져오기
          if (!isGuestUser(session.user.email)) {
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const userType = user ? getUserType(user) : 'guest';

  return (
    <AuthContext.Provider value={{ user, profile, loading, userType }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// NextAuth 호환성을 위한 별칭
export const useSession = () => {
  const { user, profile, loading, userType } = useAuth();

  return {
    data: user
      ? {
          user: {
            id: user.id,
            email: user.email,
            name: profile
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : user.email,
            firstName: profile?.first_name || null,
            lastName: profile?.last_name || null,
            companyName: profile?.company_name || null,
            type: userType,
          },
        }
      : null,
    status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated',
    update: async () => {
      // 세션 갱신 로직 (필요시 구현)
    },
  };
};
