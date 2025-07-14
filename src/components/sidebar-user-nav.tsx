'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

// Legacy NextAuth imports (commented out for migration)
// import type { User } from 'next-auth';
// import { signOut, useSession } from 'next-auth/react';

import { signOut } from '@/app/(auth)/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { isGuestUser } from '@/lib/supabase/auth';
// New Supabase Auth imports
import { useAuth } from './auth-provider';
import { LoaderIcon } from './icons';
import { toast } from './toast';

// Legacy User type interface (for compatibility)
interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  type?: 'guest' | 'regular';
}

export function SidebarUserNav({ user: legacyUser }: { user: User }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();

  // Supabase Auth 사용자 정보 우선 사용, fallback으로 legacy user 사용
  const currentUser = user || legacyUser;
  const isGuest = currentUser?.email ? isGuestUser(currentUser.email) : true;
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : legacyUser?.name || currentUser?.email;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        type: 'error',
        description: 'Sign out failed. Please try again.',
      });
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {loading ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
              >
                <Image
                  src={`https://avatar.vercel.sh/${currentUser?.email}`}
                  alt={currentUser?.email ?? 'User Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span data-testid="user-email" className="truncate">
                  {isGuest ? 'Guest' : displayName || currentUser?.email}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (loading) {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });
                    return;
                  }

                  if (isGuest) {
                    router.push('/login');
                  } else {
                    handleSignOut();
                  }
                }}
              >
                {isGuest ? 'Login to your account' : 'Sign out'}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
