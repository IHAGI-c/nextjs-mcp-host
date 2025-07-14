# Supabase Auth 마이그레이션 가이드

## 🔄 마이그레이션 개요

현재 NextAuth.js + PostgreSQL 구조를 Supabase Auth로 전환하는 과정입니다.

### Before (기존 구조)
```
PostgreSQL User 테이블
├── id (UUID)
├── email (VARCHAR)  
├── password (VARCHAR) - bcrypt 해시
├── firstName (VARCHAR)
├── lastName (VARCHAR)
└── companyName (VARCHAR)
```

### After (Supabase 구조)
```
Supabase auth.users (자동 관리)
├── id (UUID)
├── email (VARCHAR)
└── encrypted_password (자동 해시)

public.profiles (커스텀 테이블)
├── id (UUID) -> auth.users.id 참조
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── company_name (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 📋 마이그레이션 단계

### 1. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. 환경변수 설정:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 2. 데이터베이스 스키마 설정

1. Supabase SQL Editor에서 `src/lib/supabase/schema.sql` 실행
2. Profiles 테이블 및 RLS 정책 생성 확인

### 3. 기존 사용자 데이터 백업

```sql
-- 기존 사용자 데이터 내보내기
SELECT 
  id,
  email,
  "firstName" as first_name,
  "lastName" as last_name, 
  "companyName" as company_name
FROM "User" 
WHERE email NOT LIKE 'guest-%'
ORDER BY email;
```

### 4. Supabase Auth 사용자 생성

**방법 1: Supabase Dashboard 사용**
- Authentication > Users에서 수동으로 사용자 추가
- 각 사용자에게 비밀번호 재설정 이메일 발송

**방법 2: Admin API 사용** (대량 처리시)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Key 필요
)

// 사용자 생성
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'temporary-password',
  email_confirm: true
})
```

### 5. 프로필 데이터 마이그레이션

```sql
-- 프로필 데이터 삽입 (Supabase SQL Editor에서 실행)
INSERT INTO public.profiles (id, first_name, last_name, company_name)
VALUES 
  ('user-uuid-1', 'John', 'Doe', 'Acme Inc'),
  ('user-uuid-2', 'Jane', 'Smith', 'Tech Corp'),
  -- ... 기존 사용자 데이터
;
```

### 6. 관련 테이블 업데이트

기존 Chat 테이블의 userId를 새로운 Supabase user ID로 업데이트:

```sql
-- userId 매핑 테이블 생성 (임시)
CREATE TEMP TABLE user_mapping (
  old_id UUID,
  new_id UUID
);

-- 매핑 데이터 삽입
INSERT INTO user_mapping VALUES 
  ('old-uuid-1', 'new-supabase-uuid-1'),
  ('old-uuid-2', 'new-supabase-uuid-2');

-- Chat 테이블 업데이트
UPDATE "Chat" 
SET "userId" = um.new_id
FROM user_mapping um
WHERE "Chat"."userId" = um.old_id;
```

## ⚠️ 주의사항

### 1. 비밀번호 마이그레이션 불가
- bcrypt 해시를 Supabase로 직접 이전할 수 없음
- 모든 사용자에게 비밀번호 재설정 요청 필요

### 2. 사용자 ID 변경
- PostgreSQL UUID ≠ Supabase UUID
- 모든 관련 테이블의 외래키 업데이트 필요

### 3. 세션 호환성
- 기존 NextAuth 세션 무효화
- 모든 사용자 재로그인 필요

## 🧪 테스트 계획

### 1. 개발환경 테스트
```bash
# 1. 새로운 사용자 회원가입
# 2. 로그인/로그아웃
# 3. 프로필 정보 표시
# 4. 게스트 모드
# 5. 권한 체크
```

### 2. 데이터 검증
```sql
-- 프로필 데이터 확인
SELECT COUNT(*) FROM public.profiles;

-- 채팅 데이터 연결 확인  
SELECT c.*, p.first_name, p.last_name
FROM "Chat" c
JOIN public.profiles p ON c."userId" = p.id
LIMIT 5;
```

## 🚀 배포 계획

### 1. 점진적 마이그레이션
1. **Phase 1**: 새 사용자만 Supabase Auth 사용
2. **Phase 2**: 기존 사용자 마이그레이션 도구 제공
3. **Phase 3**: NextAuth 완전 제거

### 2. 롤백 계획
- 기존 PostgreSQL 스키마 백업 유지
- NextAuth 코드 브랜치 보존
- 빠른 롤백을 위한 환경변수 스위치

## 📞 지원

마이그레이션 중 문제 발생시:
1. Supabase 로그 확인 (Dashboard > Logs)
2. 브라우저 개발자 도구 Network/Console 탭 확인
3. 데이터베이스 연결 및 RLS 정책 확인 