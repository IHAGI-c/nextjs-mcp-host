import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';

// Legacy NextAuth import (commented out for migration)
// import { auth } from '@/app/(auth)/auth';

// New Supabase Auth import
import { getCurrentUser } from '@/lib/supabase/auth-server';

// Temporary default chat model (should be moved to proper constants file)
const DEFAULT_CHAT_MODEL = 'gpt-4o';

// Temporary convertToUIMessages function (should be moved to proper utils file)
function convertToUIMessages(messages: any[]) {
  // Simple implementation - should be replaced with proper logic
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }));
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

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

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
