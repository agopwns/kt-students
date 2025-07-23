import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

// 환경 변수가 올바르게 설정되었는지 확인
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey)

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