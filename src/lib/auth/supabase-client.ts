import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import Cookies from 'js-cookie';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get a Supabase client instance (creates a singleton)
 *
 * @returns A Supabase client instance
 */
export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  // Use the browser client when in browser environment
  if (typeof window !== 'undefined') {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')?.[1];
        },
        set(name, value, options) {
          Cookies.set(name, value, {
            path: options?.path ?? '/',
            expires: options?.maxAge
              ? new Date(Date.now() + options.maxAge * 1000)
              : new Date(Date.now() + 31536000000),
          });
        },
        remove(name, options) {
          Cookies.remove(name, { path: options?.path ?? '/' });
        },
      },
    });
  } else {
    // For server-side, use the regular client
    // The middleware will use createServerClient separately
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
}
