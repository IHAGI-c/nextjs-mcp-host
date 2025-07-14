// Legacy NextAuth types (replaced with Supabase Auth)
// This file is kept for backward compatibility with existing components

export interface User {
  id: string;
  email: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  type: 'guest' | 'regular';
}

export interface Session {
  user: User;
  expires: string;
  error?: string;
}

// For components that still use NextAuth-style session
export interface SessionData {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<void>;
}

// Legacy NextAuth declarations (commented out for migration)
/*
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string | null;
      firstName?: string | null;
      lastName?: string | null;
      companyName?: string | null;
      type: 'guest' | 'regular';
    };
    error?: string;
  }

  interface User {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    type: 'guest' | 'regular';
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    type: 'guest' | 'regular';
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
*/
