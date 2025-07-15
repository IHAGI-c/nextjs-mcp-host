import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getSupabaseClient } from '@/lib/auth/supabase-client';
import { generateUUID } from '@/lib/utils';

const DEFAULT_CHAT_MODEL = 'gpt-4o';

export default async function Page() {
  // Get current user from Supabase
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/api/auth/guest');
  }

  const session = {
    user: {
      id: user.id,
      email: user.email || null,
      name: user.user_metadata.name || null,
      firstName: user.user_metadata.first_name || null,
      lastName: user.user_metadata.last_name || null,
      companyName: user.user_metadata.company_name || null,
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
