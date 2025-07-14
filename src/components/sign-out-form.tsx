import Form from 'next/form';
import { useAuthContext } from '@/providers/Auth';

export const SignOutForm = () => {
  const { signOut } = useAuthContext();
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        await signOut();
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
