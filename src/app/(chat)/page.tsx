import type { Session } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getSupabaseClient } from '@/lib/auth/supabase-client';
import { generateUUID } from '@/lib/utils';

const DEFAULT_CHAT_MODEL = 'gpt-4o';

export default async function Page() {
  const cookieStore = await cookies();

  // Check for guest session first
  const guestCookie = cookieStore.get('guest-session');
  let session: Session | null = null;
  let _isGuest = false;

  if (guestCookie) {
    try {
      const guestData = JSON.parse(guestCookie.value);

      // Create temporary session object for guest (compatible with Supabase Session type)
      session = {
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
      } as Session;
      _isGuest = true;
    } catch (error) {
      console.error('Failed to parse guest session:', error);
    }
  }

  // If no guest session, check Supabase auth
  if (!session) {
    const supabase = getSupabaseClient();
    const {
      data: { session: supabaseSession },
    } = await supabase.auth.getSession();

    if (!supabaseSession) {
      redirect('/api/auth/guest');
    }

    session = supabaseSession;
    _isGuest = session?.user?.user_metadata?.user_type === 'guest';
  }

  const id = generateUUID();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
