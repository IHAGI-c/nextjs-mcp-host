import { getSupabaseClient } from './supabase-client';
import type {
  AuthCredentials,
  AuthError,
  AuthProvider,
  AuthProviderOptions,
  AuthStateChangeCallback,
  Session,
  User,
} from './types';

export class SupabaseAuthProvider implements AuthProvider {
  private supabase;
  private options: AuthProviderOptions;

  constructor(options: AuthProviderOptions = {}) {
    this.supabase = getSupabaseClient();
    this.options = {
      shouldPersistSession: true,
      redirectUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/api/auth/callback`
          : undefined,
      ...options,
    };
  }

  // Helper to convert Supabase User to our User interface
  private formatUser(supabaseUser: any): User | null {
    if (!supabaseUser) return null;

    // Extract metadata from user_metadata
    const metadata = supabaseUser.user_metadata || {};

    // Determine name - prefer explicit first_name/last_name from our app
    // but fall back to name from Google/OAuth or email username
    const firstName =
      metadata.first_name || metadata.name?.split(' ')[0] || null;
    const lastName =
      metadata.last_name ||
      metadata.name?.split(' ').slice(1).join(' ') ||
      null;

    // Construct display name from available data
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : metadata.name || supabaseUser.email?.split('@')[0] || null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName,
      firstName,
      lastName,
      companyName: metadata.company_name || null,
      avatarUrl: metadata.avatar_url || null,
      metadata,
      userType: metadata.user_type || 'regular',
    };
  }

  // Helper to convert Supabase Session to our Session interface
  private formatSession(supabaseSession: any): Session | null {
    if (!supabaseSession) return null;

    return {
      user: this.formatUser(supabaseSession.user),
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: supabaseSession.expires_at,
    };
  }

  // Convert Supabase error to our AuthError format
  private formatError(error: any): AuthError | null {
    if (!error) return null;

    console.error('Auth error:', error);

    return {
      message: error.message || 'An unknown error occurred',
      status: error.status,
      code: error.code,
    };
  }

  async signUp(credentials: AuthCredentials) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: this.options.redirectUrl,
          data: credentials.metadata || {},
        },
      });

      if (error) throw error;

      return {
        user: this.formatUser(data?.user),
        session: this.formatSession(data?.session),
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: this.formatError(error),
      };
    }
  }

  async signIn(credentials: AuthCredentials) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      return {
        user: this.formatUser(data?.user),
        session: this.formatSession(data?.session),
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: this.formatError(error),
      };
    }
  }

  async signInWithGoogle() {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.options.redirectUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;

      return {
        user: null,
        session: null,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: this.formatError(error),
      };
    }
  }

  async signInAsGuest() {
    try {
      // Use Supabase's anonymous user feature
      const { data, error } = await this.supabase.auth.signInAnonymously({
        options: {
          data: {
            user_type: 'guest',
            display_name: 'Guest User',
            is_temporary: true,
            is_anonymous: true,
          },
        },
      });

      if (error) throw error;

      return {
        user: this.formatUser(data?.user),
        session: this.formatSession(data?.session),
        error: null,
      };
    } catch (error) {
      console.warn(
        'Anonymous sign-in failed, trying alternative method:',
        error,
      );

      // Fallback: Create temporary guest user with valid email
      try {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const guestEmail = `${guestId}@example.com`;
        const guestPassword = Math.random().toString(36).substr(2, 15);

        const { data, error: signUpError } = await this.supabase.auth.signUp({
          email: guestEmail,
          password: guestPassword,
          options: {
            data: {
              user_type: 'guest',
              display_name: 'Guest User',
              is_temporary: true,
            },
            emailRedirectTo: undefined,
          },
        });

        if (signUpError) throw signUpError;

        // If session is null due to email confirmation requirement, create a temporary local session
        if (!data?.session && data?.user) {
          const tempSession = {
            access_token: `temp_${Date.now()}`,
            refresh_token: `refresh_${Date.now()}`,
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: data.user,
          };

          return {
            user: this.formatUser(data.user),
            session: this.formatSession(tempSession),
            error: null,
          };
        }

        return {
          user: this.formatUser(data?.user),
          session: this.formatSession(data?.session),
          error: null,
        };
      } catch (fallbackError) {
        // Last resort: Create completely local guest session
        console.warn(
          'Fallback signup failed, creating local guest session:',
          fallbackError,
        );

        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempUser = {
          id: guestId,
          email: `${guestId}@example.com`,
          user_metadata: {
            user_type: 'guest',
            display_name: 'Guest User',
            is_temporary: true,
          },
          created_at: new Date().toISOString(),
        };

        const tempSession = {
          access_token: `temp_${Date.now()}`,
          refresh_token: `refresh_${Date.now()}`,
          expires_in: 3600,
          expires_at: Date.now() / 1000 + 3600,
          token_type: 'bearer',
          user: tempUser,
        };

        return {
          user: this.formatUser(tempUser),
          session: this.formatSession(tempSession),
          error: null,
        };
      }
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: this.formatError(error) };
    }
  }

  async getSession() {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) throw error;

      return this.formatSession(data.session);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) throw error;

      return this.formatSession(data.session);
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) throw error;

      return this.formatUser(data.user);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateUser(attributes: Partial<User>) {
    try {
      // Convert our User attributes to Supabase format
      const metadata: Record<string, any> = {
        ...attributes.metadata,
      };

      // Handle specific fields for our application
      if (attributes.firstName !== undefined)
        metadata.first_name = attributes.firstName;
      if (attributes.lastName !== undefined)
        metadata.last_name = attributes.lastName;
      if (attributes.companyName !== undefined)
        metadata.company_name = attributes.companyName;
      if (attributes.avatarUrl !== undefined)
        metadata.avatar_url = attributes.avatarUrl;

      // If first and last name are provided, update the name field too
      if (attributes.firstName && attributes.lastName) {
        metadata.name = `${attributes.firstName} ${attributes.lastName}`.trim();
      } else if (attributes.displayName) {
        metadata.name = attributes.displayName;
      }

      const supabaseAttributes: any = {
        email: attributes.email,
        data: metadata,
      };

      const { data, error } =
        await this.supabase.auth.updateUser(supabaseAttributes);

      if (error) throw error;

      return {
        user: this.formatUser(data.user),
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: this.formatError(error),
      };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.options.redirectUrl}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: this.formatError(error) };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: this.formatError(error) };
    }
  }

  onAuthStateChange(callback: AuthStateChangeCallback) {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(this.formatSession(session));
    });

    return {
      unsubscribe: () => {
        data.subscription.unsubscribe();
      },
    };
  }
}
