import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getSupabaseClient } from '@/lib/auth/supabase-client';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';

const DEFAULT_CHAT_MODEL = 'gpt-4o';

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
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/api/auth/guest');
  }

  if (chat.visibility === 'private') {
    if (!user) {
      return notFound();
    }

    if (user.id !== chat.userId) {
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
        {/* <Chat
          id={chat.id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={user?.id !== chat.userId}
          session={user}
          autoResume={true}
        />
        <DataStreamHandler /> */}
      </>
    );
  }

  return (
    <>
      {/* <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={user?.id !== chat.userId}
        session={user}
        autoResume={true}
      />
      <DataStreamHandler /> */}
    </>
  );
}
