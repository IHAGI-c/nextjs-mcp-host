import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile extends User {
  profile?: Profile;
}

export type UserType = 'guest' | 'regular';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  userType: UserType;
}
