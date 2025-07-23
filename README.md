# 🎓 학생 좌석 배치표

선생님과 학생들의 이름을 기억하는 좌석 배치 시스템입니다.

## ✨ 주요 기능

- 🧑‍🏫 **교탁**: 선생님 자리 (1명)
- 🎓 **학생 테이블**: 3×4 배치 (24명)
- 💾 **자동 저장**: 타이핑 종료 후 2초 뒤 자동 저장
- 🔄 **실시간 동기화**: 여러 사용자 동시 편집 가능
- 🍞 **토스트 알림**: 저장 완료/실패 알림
- 📱 **반응형 디자인**: 모든 기기에서 사용 가능

## 🚀 빠른 시작

### 1. 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인하세요.

### 2. 로컬 모드 vs Supabase 모드

**로컬 모드 (기본)**

- 데이터가 브라우저에만 저장됩니다
- 새로고침 시 데이터가 유지됩니다
- 인터넷 연결이 불필요합니다

**Supabase 모드 (권장)**

- 데이터가 클라우드 데이터베이스에 저장됩니다
- 여러 기기에서 동일한 데이터에 접근 가능합니다
- 실시간 협업이 가능합니다

## ⚙️ Supabase 설정 (선택사항)

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 회원가입
2. "New Project" 클릭하여 프로젝트 생성
3. 프로젝트 이름과 비밀번호 설정

### 2. 데이터베이스 테이블 생성

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- students 테이블 생성
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL,
  seat_index INTEGER NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(table_number, seat_index)
);

-- 모든 사용자 접근 허용
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for everyone" ON students FOR ALL USING (true);

-- 실시간 업데이트 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE students;
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase 설정 (Dashboard > Settings > API에서 확인)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 개발 서버 재시작

```bash
npm run dev
```

## 🌐 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 코드 업로드
2. Environment Variables에 Supabase 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy 버튼 클릭

### 다른 플랫폼

- Netlify, AWS, 등 어떤 플랫폼에서도 배포 가능
- 환경 변수만 올바르게 설정하면 됩니다

## 🛠️ 기술 스택

- **Framework**: Next.js 15
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS
- **Notifications**: React Hot Toast
- **Realtime**: Supabase Realtime

## 📖 사용법

1. **선생님 이름 입력**: 상단 교탁에 선생님 성함 입력
2. **학생 이름 입력**: 각 테이블에 학생 이름 입력
3. **자동 저장**: 타이핑 종료 후 2초 뒤 자동 저장
4. **저장 상태 확인**: 입력 필드 옆 아이콘으로 저장 상태 확인
5. **전체 삭제**: "모든 정보 삭제" 버튼으로 모든 데이터 초기화

## 🔧 문제 해결

### 빌드 에러 (Invalid URL)

환경 변수가 설정되지 않으면 자동으로 로컬 모드로 작동합니다. Supabase 연동이 필요한 경우 위의 환경 변수 설정을 따라하세요.

### 실시간 업데이트가 안 됨

1. Supabase RLS 정책이 올바르게 설정되었는지 확인
2. Realtime이 활성화되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## 📄 라이선스

MIT License

---

> 💡 **Tip**: 로컬 모드로도 충분히 사용 가능하지만, 여러 기기에서 사용하거나 데이터를 영구 보존하려면 Supabase 설정을 권장합니다!
