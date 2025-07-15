import { cookies } from 'next/headers';
import Script from 'next/script';

import { AppSidebar } from '@/components/app-sidebar';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSupabaseClient } from '@/lib/auth/supabase-client';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseClient();
  const { auth } = supabase;

  const [session, cookieStore] = await Promise.all([auth.getUser(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session.data.user ?? undefined} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
