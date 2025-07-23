import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

// 환경 변수가 올바르게 설정되었는지 확인
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey)

// 인증 관련 함수들

/**
 * 회원가입
 */
export async function signUp(email, password, metadata = {}) {
    if (!isSupabaseConfigured) {
        return {
            data: null,
            error: { message: 'Supabase 설정이 필요합니다.' }
        }
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('회원가입 오류:', error)
        return { data: null, error }
    }
}

/**
 * 로그인
 */
export async function signIn(email, password) {
    if (!isSupabaseConfigured) {
        return {
            data: null,
            error: { message: 'Supabase 설정이 필요합니다.' }
        }
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('로그인 오류:', error)
        return { data: null, error }
    }
}

/**
 * 로그아웃
 */
export async function signOut() {
    if (!isSupabaseConfigured) {
        return { error: { message: 'Supabase 설정이 필요합니다.' } }
    }

    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('로그아웃 오류:', error)
        return { error }
    }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser() {
    if (!isSupabaseConfigured) {
        return { data: null, error: { message: 'Supabase 설정이 필요합니다.' } }
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        // AuthSessionMissingError 등의 세션 오류는 정상적인 상황으로 처리
        if (error && (
            error.message?.includes('session_not_found') ||
            error.message?.includes('AuthSessionMissingError') ||
            error.message?.includes('Auth session missing')
        )) {
            return { data: null, error: null }
        }

        if (error) throw error
        return { data: user, error: null }
    } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error)

        // 세션 관련 오류는 로그인되지 않은 상태로 처리
        if (error.message?.includes('session_not_found') ||
            error.message?.includes('AuthSessionMissingError') ||
            error.message?.includes('Auth session missing')) {
            return { data: null, error: null }
        }

        return { data: null, error }
    }
}

/**
 * 인증 상태 변화 구독
 */
export function onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
        return {
            data: { subscription: null },
            unsubscribe: () => console.log('더미 인증 구독 해제')
        }
    }

    const { data } = supabase.auth.onAuthStateChange(callback)
    return data
}

/**
 * 비밀번호 재설정 이메일 보내기
 */
export async function resetPassword(email) {
    if (!isSupabaseConfigured) {
        return {
            data: null,
            error: { message: 'Supabase 설정이 필요합니다.' }
        }
    }

    try {
        // 클라이언트 사이드에서만 window.location 사용
        const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo
        })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error)
        return { data: null, error }
    }
}

// 학생 데이터 CRUD 함수들

/**
 * 모든 학생 데이터 가져오기
 */
export async function getAllStudents() {
    if (!isSupabaseConfigured) {
        return { data: [], error: null }
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('table_number', { ascending: true })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('학생 데이터 가져오기 오류:', error)
        return { data: null, error }
    }
}

/**
 * 학생 정보 추가/업데이트
 */
export async function upsertStudent(tableNumber, seatIndex, studentName) {
    if (!isSupabaseConfigured) {
        console.warn('Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.')
        return { data: null, error: { message: 'Supabase 설정이 필요합니다.' } }
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .upsert({
                table_number: tableNumber,
                seat_index: seatIndex,
                student_name: studentName,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'table_number,seat_index'
            })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('학생 정보 저장 오류:', error)
        return { data: null, error }
    }
}

/**
 * 특정 학생 정보 삭제
 */
export async function deleteStudent(tableNumber, seatIndex) {
    if (!isSupabaseConfigured) {
        console.warn('Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.')
        return { data: null, error: { message: 'Supabase 설정이 필요합니다.' } }
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .delete()
            .eq('table_number', tableNumber)
            .eq('seat_index', seatIndex)

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('학생 정보 삭제 오류:', error)
        return { data: null, error }
    }
}

/**
 * 모든 학생 데이터 삭제
 */
export async function deleteAllStudents() {
    if (!isSupabaseConfigured) {
        console.warn('Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.')
        return { data: null, error: { message: 'Supabase 설정이 필요합니다.' } }
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .delete()
            .neq('id', 0) // 모든 레코드 삭제

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('전체 학생 데이터 삭제 오류:', error)
        return { data: null, error }
    }
}

/**
 * 실시간 구독 설정
 */
export function subscribeToStudents(callback) {
    if (!isSupabaseConfigured) {
        console.warn('Supabase가 설정되지 않았습니다. 실시간 구독을 건너뜁니다.')
        // 더미 구독 객체 반환
        return {
            unsubscribe: () => console.log('더미 구독 해제')
        }
    }

    const subscription = supabase
        .channel('students')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'students'
            },
            callback
        )
        .subscribe()

    return subscription
} 