'use client';

import type { Session as SupabaseSession } from '@supabase/supabase-js';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseAuthProvider } from '@/lib/auth/supabase';
import type {
  AuthCredentials,
  AuthError,
  AuthProvider as CustomAuthProvider,
  Session,
  User,
} from '@/lib/auth/types';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  signIn: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signUp: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signInWithGoogle: () => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signInAsGuest: () => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateUser: (attributes: Partial<User>) => Promise<{
    user: User | null;
    error: AuthError | null;
  }>;
}

// Helper function to get guest session from cookies
function getGuestSession(): SupabaseSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const guestCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('guest-session='));

    if (!guestCookie) return null;

    const guestData = JSON.parse(decodeURIComponent(guestCookie.split('=')[1]));

    // Check if guest session is expired (24 hours)
    const createdAt = new Date(guestData.createdAt);
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    if (new Date() > expiresAt) {
      // Clear expired guest session
      document.cookie =
        'guest-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return null;
    }

    return {
      access_token: `guest_${guestData.id}`,
      refresh_token: `refresh_${guestData.id}`,
      expires_in: 86400,
      expires_at: Date.now() / 1000 + 86400,
      token_type: 'bearer',
      user: {
        id: guestData.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: guestData.email,
        email_confirmed_at: guestData.createdAt,
        phone: '',
        confirmed_at: guestData.createdAt,
        last_sign_in_at: guestData.createdAt,
        app_metadata: {
          provider: 'guest',
          providers: ['guest'],
        },
        user_metadata: {
          user_type: 'guest',
          display_name: guestData.displayName,
          is_temporary: true,
        },
        identities: [],
        created_at: guestData.createdAt,
        updated_at: guestData.createdAt,
      },
    } as SupabaseSession;
  } catch (error) {
    console.error('Failed to parse guest session:', error);
    return null;
  }
}

// Helper function to watch for guest session changes
function _watchGuestSession(
  callback: (session: SupabaseSession | null) => void,
) {
  if (typeof window === 'undefined') return () => {};

  let lastGuestSession = getGuestSession();

  const checkGuestSession = () => {
    const currentGuestSession = getGuestSession();

    // Compare session IDs to detect changes
    const lastId = lastGuestSession?.user?.id;
    const currentId = currentGuestSession?.user?.id;

    if (lastId !== currentId) {
      lastGuestSession = currentGuestSession;
      callback(currentGuestSession);
    }
  };

  // Check every 5 seconds
  const interval = setInterval(checkGuestSession, 5000);

  return () => clearInterval(interval);
}

// Create default authentication provider (Supabase in this case)
const authProvider = new SupabaseAuthProvider({
  redirectUrl:
    typeof window !== 'undefined' ? window.location.origin : undefined,
});

// Create auth context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({
  children,
  customAuthProvider,
}: {
  children: React.ReactNode;
  customAuthProvider?: CustomAuthProvider;
}) {
  // Use the provided auth provider or default to Supabase
  const provider = customAuthProvider || authProvider;

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check for guest session
        const guestSession = getGuestSession();
        if (guestSession) {
          // Convert Supabase session to our Session type
          const guestUser: User = {
            id: guestSession.user.id,
            email: guestSession.user.email || null,
            displayName:
              guestSession.user.user_metadata?.display_name || 'Guest User',
            userType: 'guest',
            metadata: guestSession.user.user_metadata,
          };

          const customSession: Session = {
            user: guestUser,
            accessToken: guestSession.access_token,
            refreshToken: guestSession.refresh_token,
            expiresAt: guestSession.expires_at,
          };

          setSession(customSession);
          setUser(guestUser);
          setIsLoading(false);
          return;
        }

        // Get the current session from Supabase
        const currentSession = await provider.getSession();
        setSession(currentSession);

        // If we have a session, get the user
        if (currentSession?.user) {
          setUser(currentSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [provider]);

  // Set up auth state change listener
  useEffect(() => {
    const { unsubscribe } = provider.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    // Set up guest session watcher
    const unsubscribeGuestWatcher = _watchGuestSession((guestSession) => {
      if (guestSession) {
        // Convert Supabase session to our Session type
        const guestUser: User = {
          id: guestSession.user.id,
          email: guestSession.user.email || null,
          displayName:
            guestSession.user.user_metadata?.display_name || 'Guest User',
          userType: 'guest',
          metadata: guestSession.user.user_metadata,
        };

        const customSession: Session = {
          user: guestUser,
          accessToken: guestSession.access_token,
          refreshToken: guestSession.refresh_token,
          expiresAt: guestSession.expires_at,
        };

        setSession(customSession);
        setUser(guestUser);
      } else {
        // Guest session expired or cleared, only clear if current session is guest
        if (user?.userType === 'guest') {
          setSession(null);
          setUser(null);
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeGuestWatcher();
    };
  }, [provider, user?.userType]);

  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session?.user,
    isGuest: user?.userType === 'guest',
    signIn: provider.signIn.bind(provider),
    signUp: provider.signUp.bind(provider),
    signInWithGoogle: provider.signInWithGoogle.bind(provider),
    signInAsGuest: provider.signInAsGuest.bind(provider),
    signOut: async () => {
      // If guest user, clear guest session
      if (user?.userType === 'guest') {
        if (typeof window !== 'undefined') {
          document.cookie =
            'guest-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        setSession(null);
        setUser(null);
        return { error: null };
      }

      // Otherwise use provider signOut
      return provider.signOut();
    },
    resetPassword: provider.resetPassword.bind(provider),
    updatePassword: provider.updatePassword.bind(provider),
    updateUser: provider.updateUser.bind(provider),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
