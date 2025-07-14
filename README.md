# NextJS MCP Host

A modern Next.js application with Supabase Authentication, featuring real-time chat functionality and user management.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Shadcn UI
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn
- Supabase account

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd nextjs-mcp-host
pnpm install
```

### 2. Supabase Setup

1. Create a new project at [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Settings > API** and copy your project credentials
3. Create `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration (for email verification redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL script from `src/lib/supabase/schema.sql`
3. This will create the `profiles` table and set up Row Level Security

### 4. Email Authentication Setup

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Under **Auth Settings**, configure:
   - **Enable email confirmations**: ON
   - **Confirm email setting**: **Enable** (강제 이메일 인증)
   - **Double confirm email changes**: ON (이메일 변경 시에도 인증 필요)
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. Under **Email Templates**, customize the confirmation email if needed
4. **중요**: 이메일 인증이 완료되지 않으면 회원가입이 완료되지 않습니다
5. For production, update the Site URL and Redirect URLs accordingly

**⚠️ 중요 사항**: 이메일 인증을 완료하지 않은 사용자는:
- 로그인할 수 없습니다
- 프로필 데이터가 생성되지 않습니다
- 실질적으로 회원가입이 완료되지 않은 상태입니다

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🔐 Authentication Features

- **Email/Password Registration** with profile information (firstName, lastName, username, companyName)
- **Mandatory Email Verification** - Registration is only complete after email verification
- **Email/Password Login** with strict email verification check
- **Guest Mode** for anonymous users (bypasses email verification)
- **Session Management** with automatic token refresh
- **Protected Routes** via middleware
- **Row Level Security** for data protection

### 🔒 Security Model

**Regular Users:**
- Must verify email to complete registration
- Profile data is created only after email verification
- Cannot login without completing email verification
- All user data is protected by Row Level Security

**Guest Users:**
- Immediate access without email verification
- Temporary accounts with limited persistence
- Ideal for trial usage or demos

### 📧 Email Verification Flow

```
Regular User Registration:
1. User fills registration form
2. Supabase creates user account (unverified)
3. Email verification link sent
4. User clicks email link → /auth/callback
5. Profile data created in database
6. Registration complete ✅

Login Process:
1. User enters credentials
2. Check email_confirmed_at field
3. Check profile exists
4. Grant access only if both verified ✅

Guest User Flow:
1. Auto-generate temporary credentials
2. Skip email verification
3. Immediate access (no profile creation)
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   └── (chat)/            # Chat application pages
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── auth-provider.tsx # Supabase Auth provider
├── lib/
│   ├── supabase/         # Supabase configuration & utilities
│   └── db/               # Database queries & schema
└── locales/              # Internationalization
```

## 🧪 Testing Authentication

### Manual Testing Checklist

1. **Registration Flow**:
   - Visit `/register`
   - Fill in all required fields
   - Verify account creation and profile storage

2. **Login Flow**:
   - Visit `/login` 
   - Test with valid credentials
   - Test error handling with invalid credentials

3. **Guest Mode**:
   - Visit `/` without logging in
   - Verify automatic guest user creation

4. **Session Persistence**:
   - Refresh page after login
   - Verify session maintenance

5. **Protected Routes**:
   - Test access to `/chat/[id]` 
   - Verify redirects for unauthenticated users

## 🔧 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production  
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm check        # Run Biome checks
pnpm check:fix    # Fix Biome issues
```

## 📚 Key Documentation

- [Supabase Migration Guide](src/lib/supabase/migration-guide.md)
- [Migration Checklist](src/lib/supabase/migration-checklist.md)
- [Database Schema](src/lib/supabase/schema.sql)

## 🚨 Important Notes

### Environment Variables Required
Make sure to set up your Supabase credentials in `.env.local` before running the application.

### First-Time Setup
1. Create Supabase project
2. Apply database schema 
3. Set environment variables
4. Test authentication flow

### Migration from NextAuth
This project has been migrated from NextAuth.js to Supabase Auth. Legacy authentication functions are marked as deprecated but temporarily maintained for backward compatibility.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test authentication flows
5. Submit a pull request

## 📞 Support

For issues related to:
- **Supabase Setup**: Check the [Supabase Documentation](https://supabase.com/docs)
- **Authentication Flow**: Review the migration checklist
- **Database Issues**: Verify RLS policies in Supabase dashboard

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js and Supabase
