-- ============================================================================
-- Supabase Auth + Profiles 테이블 설정
-- ============================================================================

-- 1. Profiles 테이블 생성 (사용자 추가 정보 저장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  company_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성
-- 사용자는 자신의 프로필만 읽기 가능
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 삽입 가능
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(first_name, last_name);

-- 5. updated_at 자동 업데이트 함수 및 트리거
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. 회원가입 시 자동으로 프로필 생성하는 함수 (선택사항)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 회원가입 시 프로필 자동 생성 트리거 (비활성화)
-- 주의: 이메일 인증 완료 후에만 프로필이 생성되도록 하기 위해 비활성화
-- 프로필 생성은 이메일 인증 콜백(/auth/callback)에서 처리됨
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users  
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. 기존 프로필 테이블에 username, email 컬럼 추가 (이미 테이블이 존재하는 경우)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ============================================================================
-- 기존 Chat 테이블 Supabase와 연동
-- ============================================================================

-- 기존 Chat 테이블이 있다면 auth.users를 참조하도록 수정
-- 주의: 기존 데이터가 있다면 데이터 마이그레이션이 필요합니다

-- Chat 테이블 외래키 업데이트 (기존 테이블이 있는 경우)
-- ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";
-- ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_profiles_id_fk" 
--   FOREIGN KEY ("userId") REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- 데이터 마이그레이션 가이드
-- ============================================================================

/*
기존 PostgreSQL User 테이블에서 Supabase로 데이터 마이그레이션:

1. 기존 사용자 내보내기:
   SELECT id, email, "firstName", "lastName", "companyName" 
   FROM "User" 
   WHERE email NOT LIKE 'guest-%';

2. Supabase Auth에 사용자 생성:
   - Supabase Dashboard 또는 Admin API 사용
   - 각 사용자에 대해 auth.users 레코드 생성
   - 비밀번호는 재설정 요청하도록 안내

3. 프로필 데이터 삽입:
   INSERT INTO public.profiles (id, first_name, last_name, company_name)
   VALUES (...);

4. 관련 테이블 userId 업데이트:
   - Chat 테이블의 userId를 새로운 Supabase user ID로 업데이트
   - 기타 사용자 참조 테이블들도 동일하게 업데이트
*/ 