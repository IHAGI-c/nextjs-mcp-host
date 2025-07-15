import type { Session } from '@supabase/supabase-js';
import type { UIMessagePart } from 'ai';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { type ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';
import { twMerge } from 'tailwind-merge';
import type { User } from '@/lib/auth/types';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return nanoid();
}

export function generateHashedPassword(password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return hash;
}

export function generateDummyPassword() {
  const password = generateId();
  const hashedPassword = generateHashedPassword(password);

  return hashedPassword;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * @returns true if google auth is disabled
 */
export function googleAuthDisabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_DISABLED === 'true';
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: format(message.createdAt, 'MMM d, yyyy'),
    },
  }));
}

export const formatDate = (date: Date) => format(date, 'MMM d, yyyy');

/**
 * Check if a user is a guest user
 */
export function isGuestUser(user: User | null): boolean {
  return user?.userType === 'guest';
}

/**
 * Check if a session belongs to a guest user
 */
export function isGuestSession(session: Session | null): boolean {
  return session?.user?.user_metadata?.user_type === 'guest';
}

/**
 * Get user type from session
 */
export function getUserTypeFromSession(
  session: Session | null,
): 'regular' | 'guest' {
  return session?.user?.user_metadata?.user_type || 'regular';
}

/**
 * Check if a user ID is a guest user ID
 */
export function isGuestUserId(userId: string | null): boolean {
  return userId?.startsWith('guest_') || false;
}

/**
 * Clear guest session from cookies (client-side)
 */
export function clearGuestSession(): void {
  if (typeof window !== 'undefined') {
    document.cookie =
      'guest-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export const generateTitleFromContent = (content: string): string => {
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const firstSentence = sentences[0]?.trim();

  if (!firstSentence) return 'New Chat';

  const words = firstSentence.split(/\s+/);
  const title = words.slice(0, 8).join(' ');

  return title.length > 50 ? `${title.substring(0, 50)}...` : title;
};
