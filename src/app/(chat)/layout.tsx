import { cookies } from 'next/headers';
import Script from 'next/script';

import { AppSidebar } from '@/components/app-sidebar';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

// Legacy NextAuth import (commented out for migration)
// import { auth } from '../(auth)/auth';

// New Supabase Auth import
import { getCurrentUser } from '@/lib/supabase/auth-server';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current user from Supabase
  const { user, profile } = await getCurrentUser();

  // Create user object compatible with existing components
  const legacyUser = user
    ? {
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
      }
    : undefined;

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={legacyUser} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
