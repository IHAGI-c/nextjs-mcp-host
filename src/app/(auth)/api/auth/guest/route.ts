import { NextResponse } from 'next/server';
import { generateUUID } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirectUrl') || '/';

    // Create guest session data
    const guestId = generateUUID();
    const guestData = {
      id: guestId,
      email: `guest_${guestId}@example.com`,
      userType: 'guest',
      displayName: 'Guest User',
      isTemporary: true,
      createdAt: new Date().toISOString(),
    };

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Set guest session cookie
    response.cookies.set('guest-session', JSON.stringify(guestData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Guest auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
