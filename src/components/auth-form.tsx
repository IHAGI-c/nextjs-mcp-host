import Form from 'next/form';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  showConfirmPassword = false,
  clientError,
  onPasswordChange,
  onConfirmPasswordChange,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  showConfirmPassword?: boolean;
  clientError?: string;
  onPasswordChange?: (value: string) => void;
  onConfirmPasswordChange?: (value: string) => void;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      {showConfirmPassword && (
        <>
          <div className="flex gap-2">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="firstName"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                className="bg-muted text-md md:text-sm"
                type="text"
                placeholder="John"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="lastName"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                className="bg-muted text-md md:text-sm"
                type="text"
                placeholder="Doe"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              <Label
                htmlFor="companyName"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Company Name
              </Label>
              <p className="text-zinc-500 text-xs dark:text-zinc-400">
                (Optional)
              </p>
            </div>
            <Input
              id="companyName"
              name="companyName"
              className="bg-muted text-md md:text-sm"
              type="text"
              placeholder="Acme Inc."
            />
          </div>
        </>
      )}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
          onChange={(e) => onPasswordChange?.(e.target.value)}
        />
      </div>

      {showConfirmPassword && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="confirmPassword"
            className="text-zinc-600 font-normal dark:text-zinc-400"
          >
            Confirm Password
          </Label>

          <div className="flex flex-col gap-1">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
              onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
            />
            {clientError && (
              <p className="text-red-500 text-xs">{clientError}</p>
            )}
          </div>
        </div>
      )}

      {children}
    </Form>
  );
}
