import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { generateUUID } from '@/lib/utils';

// Legacy NextAuth import (commented out for migration)
// import { auth } from '../(auth)/auth';

// New Supabase Auth import
import { getCurrentUser } from '@/lib/supabase/auth-server';

// Temporary default chat model (should be moved to proper constants file)
const DEFAULT_CHAT_MODEL = 'gpt-4';

export default async function Page() {
  // Get current user from Supabase
  const { user, profile } = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/guest');
  }

  // Create session object compatible with existing components
  const session = {
    user: {
      id: user.id,
      email: user.email || null,
      name: profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : user.email || null,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      companyName: profile?.company_name || null,
      type: user.email?.startsWith('guest-')
        ? ('guest' as const)
        : ('regular' as const),
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  };

  const id = generateUUID();

  const cookieStore = await cookies();
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
