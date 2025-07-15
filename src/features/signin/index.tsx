'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/alert';
import { PasswordInput } from '@/components/password-input';
import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { googleAuthDisabled } from '@/lib/utils';
import { useAuthContext } from '@/providers/Auth';

export default function SigninInterface() {
  const { signIn, signInWithGoogle, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showManualRedirect, setShowManualRedirect] = useState<boolean>(false);

  // Handle URL parameters
  useEffect(() => {
    // Check for message parameter
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(urlMessage);
    }

    // Check for error parameter
    const urlError = searchParams.get('error');
    if (urlError) {
      toast({
        type: 'error',
        description: urlError,
      });
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        type: 'error',
        description: 'Please enter both email and password',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn({
        email,
        password,
      });

      if (result.error) {
        toast({
          type: 'error',
          description: result.error.message,
        });
        return;
      }

      // Show success message and set up manual redirect timer
      setIsSuccess(true);

      // Set a timer to show manual redirect button after 5 seconds
      setTimeout(() => {
        setShowManualRedirect(true);
      }, 1000);
    } catch (err) {
      console.error('Sign in error:', err);
      toast({
        type: 'error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    const { error } = await signInWithGoogle();
    if (error) {
      setIsLoading(false);
      toast({
        type: 'error',
        description: error.message,
      });

      return;
    }

    // keep isLoading: true, as we're doing a redirect
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        {message && !isSuccess && (
          <Alert className="mb-4 bg-blue-50 text-blue-800">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {isSuccess && (
          <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
            <AlertDescription className="flex flex-col gap-2">
              <span>Success! We're redirecting you to the dashboard...</span>
              {showManualRedirect && (
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                >
                  Go to Dashboard Now
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="dark:text-zinc-400">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="dark:bg-muted text-md md:text-sm"
              autoComplete="email"
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="dark:text-zinc-400">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-zinc-600 text-sm hover:underline dark:text-zinc-400"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              className="dark:bg-muted text-md md:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="relative"
            disabled={isLoading || isSuccess}
          >
            {isLoading
              ? 'Signing in...'
              : isSuccess
                ? 'Signed In Successfully'
                : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/signup"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </form>

        {!googleAuthDisabled() && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="flex w-full items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isSuccess}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
              </svg>
              Sign in with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
