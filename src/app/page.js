'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllStudents, upsertStudent, deleteAllStudents, subscribeToStudents, getCurrentUser, signOut, onAuthStateChange } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Supabase 설정 확인
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 교탁 컴포넌트
function TeacherDesk({ teacherName, onTeacherChange, savingStatus }) {
  // 저장 상태 아이콘 컴포넌트
  const SaveStatus = ({ status }) => {
    switch (status) {
      case 'pending':
        return <span className="text-yellow-500 text-xs">⏳</span>;
      case 'saving':
        return <span className="text-blue-500 text-xs animate-spin">⚪</span>;
      case 'saved':
        return <span className="text-green-500 text-xs">✅</span>;
      case 'error':
        return <span className="text-red-500 text-xs">❌</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl shadow-lg p-6 border-2 border-emerald-300 hover:shadow-xl hover:scale-105 transition-all duration-300 max-w-xs mx-auto mb-8">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-emerald-800 bg-white bg-opacity-60 rounded-full py-2 px-4 inline-block">
          🧑‍🏫 교탁 (선생님)
        </h3>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="선생님 성함"
          value={teacherName || ''}
          onChange={(e) => onTeacherChange(e.target.value)}
          className="w-full px-4 py-4 pr-8 text-xl bg-white bg-opacity-80 border border-emerald-400 rounded-lg focus:outline-none focus:ring-3 focus:ring-emerald-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium text-center"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <SaveStatus status={savingStatus['0-0']} />
        </div>
      </div>
    </div>
  );
}

// 개별 테이블 컴포넌트
function Table({ tableNumber, students, onStudentChange, savingStatus, isTeacherView = false }) {
  // 저장 상태 아이콘 컴포넌트
  const SaveStatus = ({ status }) => {
    switch (status) {
      case 'pending':
        return <span className="text-yellow-500 text-xs">⏳</span>;
      case 'saving':
        return <span className="text-blue-500 text-xs animate-spin">⚪</span>;
      case 'saved':
        return <span className="text-green-500 text-xs">✅</span>;
      case 'error':
        return <span className="text-red-500 text-xs">❌</span>;
      default:
        return null;
    }
  };

  // 교탁 시점에서는 학생 좌우 위치를 바꿈
  const leftStudentIndex = isTeacherView ? 1 : 0;
  const rightStudentIndex = isTeacherView ? 0 : 1;
  const leftPlaceholder = isTeacherView ? "학생 2" : "학생 1";
  const rightPlaceholder = isTeacherView ? "학생 1" : "학생 2";

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-5 border-2 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="text-center mb-4">
        <h3 className="text-sm font-bold text-indigo-700 bg-white bg-opacity-60 rounded-full py-1 px-3 inline-block">
          테이블 {tableNumber}
        </h3>
      </div>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={leftPlaceholder}
            value={students[leftStudentIndex] || ''}
            onChange={(e) => onStudentChange(tableNumber, leftStudentIndex, e.target.value)}
            className="w-full px-3 py-3 pr-7 text-xl bg-white bg-opacity-80 border border-blue-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium text-center"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <SaveStatus status={savingStatus[`${tableNumber}-${leftStudentIndex}`]} />
          </div>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={rightPlaceholder}
            value={students[rightStudentIndex] || ''}
            onChange={(e) => onStudentChange(tableNumber, rightStudentIndex, e.target.value)}
            className="w-full px-3 py-3 pr-7 text-xl bg-white bg-opacity-80 border border-blue-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium text-center"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <SaveStatus status={savingStatus[`${tableNumber}-${rightStudentIndex}`]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // 교탁 1개 + 학생 테이블 12개 (각 테이블당 2명) = 선생님 1명 + 학생 24명
  const [studentsData, setStudentsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState({}); // 각 필드별 저장 상태
  const saveTimersRef = useRef({}); // 각 필드별 타이머
  const ignoreRealtimeRef = useRef(false); // 실시간 업데이트 무시 플래그

  // 인증 관련 상태
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // 뷰 모드 상태 (false: 학생 시점, true: 교탁 시점)
  const [isTeacherView, setIsTeacherView] = useState(false);

  // Supabase에서 데이터를 localStorage 형태로 변환하는 함수
  const transformSupabaseData = (supabaseData) => {
    const transformed = {};
    supabaseData?.forEach(student => {
      if (!transformed[student.table_number]) {
        transformed[student.table_number] = {};
      }
      transformed[student.table_number][student.seat_index] = student.student_name;
    });
    return transformed;
  };

  // 컴포넌트 마운트 시 데이터 로드 (인증 후에만)
  useEffect(() => {
    // 인증이 확인되고 (Supabase가 설정되지 않았거나 로그인된 상태) 학생 데이터를 로드
    if (!checkingAuth && (!isSupabaseConfigured || user)) {
      loadStudentsData(false); // 초기 로드

      // Supabase가 설정된 경우에만 실시간 구독 설정
      let subscription = null;
      if (isSupabaseConfigured) {
        subscription = subscribeToStudents((payload) => {
          console.log('실시간 업데이트:', payload);
          // 데이터가 변경되면 다시 로드 (실시간 업데이트)
          loadStudentsData(true);
        });
      }

      // 컴포넌트 언마운트 시 구독 해제 및 타이머 정리
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }

        // 모든 활성 타이머 정리
        Object.values(saveTimersRef.current).forEach(timer => {
          if (timer) clearTimeout(timer);
        });
      };
    }
  }, [checkingAuth, user]);

  // 학생 데이터 로드 (Supabase 또는 localStorage)
  const loadStudentsData = async (isRealtimeUpdate = false) => {
    try {
      // 실시간 업데이트 무시 플래그가 설정되어 있으면 무시
      if (isRealtimeUpdate && ignoreRealtimeRef.current) {
        return;
      }

      // 초기 로드가 아닌 경우 로딩 상태를 표시하지 않음 (깜빡임 방지)
      if (!isRealtimeUpdate) {
        setLoading(true);
      }

      if (isSupabaseConfigured) {
        // Supabase에서 데이터 로드
        const { data, error } = await getAllStudents();

        if (error) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
          console.error(error);
          return;
        }

        const transformedData = transformSupabaseData(data);
        setStudentsData(transformedData);
        setError(null);
      } else {
        // localStorage에서 데이터 로드
        const savedData = localStorage.getItem('studentsSeatingData');
        if (savedData) {
          setStudentsData(JSON.parse(savedData));
        }
        setError(null);
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      if (!isRealtimeUpdate) {
        setLoading(false);
      }
    }
  };

  // 데이터 저장 함수 (Supabase 또는 localStorage)
  const saveToDatabase = async (tableNumber, seatIndex, name) => {
    const fieldKey = `${tableNumber}-${seatIndex}`;

    try {
      setSavingStatus(prev => ({ ...prev, [fieldKey]: 'saving' }));

      if (isSupabaseConfigured) {
        // Supabase에 저장
        // 저장 시작 시 실시간 업데이트 일시 차단
        ignoreRealtimeRef.current = true;

        const { error } = await upsertStudent(tableNumber, seatIndex, name.trim());

        if (error) {
          setSavingStatus(prev => ({ ...prev, [fieldKey]: 'error' }));
          setError('학생 정보를 저장하는 중 오류가 발생했습니다.');
          console.error(error);

          // 에러 토스트 표시
          toast.error('저장 중 오류가 발생했습니다. 다시 시도해주세요.');

          // 에러 시에도 실시간 업데이트 재활성화
          ignoreRealtimeRef.current = false;
          return;
        }

        // 저장 완료 후 500ms 뒤 실시간 업데이트 재활성화 (깜빡임 방지)
        setTimeout(() => {
          ignoreRealtimeRef.current = false;
        }, 500);
      } else {
        // localStorage에 저장
        const currentData = { ...studentsData };
        if (!currentData[tableNumber]) {
          currentData[tableNumber] = {};
        }
        currentData[tableNumber][seatIndex] = name;

        localStorage.setItem('studentsSeatingData', JSON.stringify(currentData));
      }

      setSavingStatus(prev => ({ ...prev, [fieldKey]: 'saved' }));
      setError(null);

      // 성공 토스트 표시
      const personName = name.trim();
      if (personName) {
        if (tableNumber === 0) {
          toast.success(`${personName} 선생님 정보가 저장되었습니다! 🧑‍🏫`);
        } else {
          toast.success(`${personName} 학생 정보가 저장되었습니다! 🎓`);
        }
      } else {
        if (tableNumber === 0) {
          toast.success('선생님 정보가 삭제되었습니다');
        } else {
          toast.success('학생 정보가 삭제되었습니다');
        }
      }

      // 2초 후 저장 완료 상태 제거
      setTimeout(() => {
        setSavingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[fieldKey];
          return newStatus;
        });
      }, 2000);

    } catch (err) {
      setSavingStatus(prev => ({ ...prev, [fieldKey]: 'error' }));
      setError('학생 정보를 저장하는 중 오류가 발생했습니다.');
      console.error(err);

      // 에러 토스트 표시
      toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');

      // 에러 시에도 실시간 업데이트 재활성화
      if (isSupabaseConfigured) {
        ignoreRealtimeRef.current = false;
      }
    }
  };

  // 선생님 이름 변경 핸들러 (debounce 적용)
  const handleTeacherChange = (name) => {
    handleStudentChange(0, 0, name); // 교탁을 0번 테이블로 처리
  };

  // 학생 이름 변경 핸들러 (debounce 적용)
  const handleStudentChange = (tableNumber, seatIndex, name) => {
    const fieldKey = `${tableNumber}-${seatIndex}`;

    // 즉시 로컬 상태 업데이트 (UX 향상)
    setStudentsData(prev => ({
      ...prev,
      [tableNumber]: {
        ...prev[tableNumber],
        [seatIndex]: name
      }
    }));

    // 기존 타이머가 있다면 취소
    if (saveTimersRef.current[fieldKey]) {
      clearTimeout(saveTimersRef.current[fieldKey]);
    }

    // 저장 대기 상태로 설정
    setSavingStatus(prev => ({ ...prev, [fieldKey]: 'pending' }));

    // 2초 후에 데이터베이스에 저장하는 새 타이머 설정
    const newTimer = setTimeout(() => {
      saveToDatabase(tableNumber, seatIndex, name);

      // 타이머 정리
      delete saveTimersRef.current[fieldKey];
    }, 2000);

    // 새 타이머 저장
    saveTimersRef.current[fieldKey] = newTimer;
  };

  // 데이터 초기화 핸들러
  const handleClearAll = async () => {
    if (!confirm('모든 정보를 삭제하시겠습니까? (선생님 + 학생)')) {
      return;
    }

    const toastId = toast.loading('모든 정보를 삭제하는 중... (선생님 + 학생)');

    try {
      setLoading(true);

      if (isSupabaseConfigured) {
        // Supabase에서 삭제
        const { error } = await deleteAllStudents();

        if (error) {
          setError('학생 정보를 삭제하는 중 오류가 발생했습니다.');
          console.error(error);

          // 에러 토스트로 업데이트
          toast.error('삭제 중 오류가 발생했습니다. 다시 시도해주세요.', { id: toastId });
          return;
        }
      } else {
        // localStorage에서 삭제
        localStorage.removeItem('studentsSeatingData');
      }

      setStudentsData({});
      setError(null);

      // 성공 토스트로 업데이트
      toast.success('모든 정보가 삭제되었습니다! (선생님 + 학생) 🗑️', { id: toastId });

    } catch (err) {
      setError('학생 정보를 삭제하는 중 오류가 발생했습니다.');
      console.error(err);

      // 네트워크 에러 토스트로 업데이트
      toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 3x4 그리드 생성
  const createTables = () => {
    const tables = [];

    // 교탁 시점인 경우 테이블 순서를 반전 (뒤에서부터 앞으로, 오른쪽에서 왼쪽으로)
    if (isTeacherView) {
      // 교탁 시점: 12 11 10, 9 8 7, 6 5 4, 3 2 1 순서
      for (let row = 3; row >= 0; row--) {
        for (let col = 2; col >= 0; col--) {
          const tableNumber = row * 3 + col + 1;
          const students = studentsData[tableNumber] || {};
          tables.push(
            <Table
              key={tableNumber}
              tableNumber={tableNumber}
              students={students}
              onStudentChange={handleStudentChange}
              savingStatus={savingStatus}
              isTeacherView={isTeacherView}
            />
          );
        }
      }
    } else {
      // 학생 시점: 1 2 3, 4 5 6, 7 8 9, 10 11 12 순서 (기본)
      let tableNumber = 1;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          const students = studentsData[tableNumber] || {};
          tables.push(
            <Table
              key={tableNumber}
              tableNumber={tableNumber}
              students={students}
              onStudentChange={handleStudentChange}
              savingStatus={savingStatus}
              isTeacherView={isTeacherView}
            />
          );
          tableNumber++;
        }
      }
    }

    return tables;
  };

  // 인증 상태 확인 및 관리
  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseConfigured) {
        // Supabase가 설정되지 않은 경우 로컬 모드로 실행
        setCheckingAuth(false);
        return;
      }

      try {
        const { data: currentUser, error } = await getCurrentUser();
        setUser(currentUser);

        if (!currentUser) {
          // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        // 세션 관련 오류인 경우 로그인 페이지로 리다이렉트
        router.push('/login');
        return;
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // 인증 상태 변화 구독
    let authSubscription = null;
    if (isSupabaseConfigured) {
      authSubscription = onAuthStateChange((event, session) => {
        console.log('인증 상태 변화:', event, session);

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          router.push('/login');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user);
        }
      });
    }

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if (!confirm('로그아웃하시겠습니까?')) {
      return;
    }

    const toastId = toast.loading('로그아웃 중...');

    try {
      const { error } = await signOut();

      if (error) {
        toast.error('로그아웃에 실패했습니다.', { id: toastId });
        return;
      }

      toast.success('로그아웃되었습니다! 👋', { id: toastId });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('네트워크 오류가 발생했습니다.', { id: toastId });
    }
  };

  // 뷰 모드 전환 핸들러
  const toggleViewMode = () => {
    setIsTeacherView(prev => !prev);
    toast.success(
      isTeacherView
        ? '학생 시점으로 전환되었습니다! 👥'
        : '교탁 시점으로 전환되었습니다! 🧑‍🏫',
      { duration: 2000 }
    );
  };

  // 인증 확인 중 로딩 화면
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white border-opacity-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">인증 상태 확인 중...</span>
          </div>
        </div>
      </div>
    );
  }

  // Supabase가 설정되어 있고 로그인되지 않은 경우 (리다이렉트 대기)
  if (isSupabaseConfigured && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white border-opacity-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">로그인 페이지로 이동 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white border-opacity-50">
            {/* 사용자 정보 및 로그아웃 버튼 */}
            {isSupabaseConfigured && user && (
              <div className="flex justify-between items-center mb-6">
                <div className="text-left">
                  <p className="text-sm text-gray-600">안녕하세요!</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {user.user_metadata?.name || user.email} 님
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  로그아웃
                </button>
              </div>
            )}

            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              🎓 학생 좌석 배치표
            </h1>
            <p className="text-gray-700 mb-4 text-lg font-medium">
              교탁 1개 + 학생 테이블 12개 × 2명 = 선생님 1명 + 학생 24명
              {isSupabaseConfigured ? (
                <span className="text-green-600">(Supabase 연동됨)</span>
              ) : (
                <span className="text-orange-600">(로컬 모드)</span>
              )}
            </p>
            <div className="text-sm text-gray-600 mb-6 bg-blue-50 rounded-lg p-3">
              <p className="font-medium mb-2">💡 자동 저장 안내:</p>
              <div className="flex flex-wrap gap-4 justify-center text-xs">
                <span>⏳ 저장 대기중</span>
                <span>⚪ 저장 중...</span>
                <span>✅ 저장 완료</span>
                <span>❌ 저장 실패</span>
              </div>
              <p className="mt-2 text-xs">
                타이핑 종료 후 2초 뒤에 자동으로
                {isSupabaseConfigured ? (
                  <span className="font-medium text-green-600">데이터베이스에 저장</span>
                ) : (
                  <span className="font-medium text-orange-600">브라우저에 저장</span>
                )}되며,
                <span className="font-medium text-blue-600"> 저장 완료 시 토스트 알림</span>이 표시됩니다
              </p>
            </div>

            {/* Supabase 설정 경고 */}
            {!isSupabaseConfigured && (
              <div className="mb-4 p-4 bg-orange-100 border border-orange-300 text-orange-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">⚠️</span>
                  <span className="font-bold">로컬 모드로 실행 중</span>
                </div>
                <p className="text-sm mb-2">
                  데이터가 브라우저에만 저장되며, 새로고침 시 사라집니다.
                </p>
                <p className="text-xs">
                  Supabase 연동을 위해 환경 변수 <code>NEXT_PUBLIC_SUPABASE_URL</code>과
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 설정해주세요.
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            {/* 로딩 상태 */}
            {loading && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                데이터를 불러오는 중...
              </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center items-center">
              {/* 뷰 모드 전환 버튼 */}
              <button
                onClick={toggleViewMode}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100"
              >
                {isTeacherView ? (
                  <>🏃‍♂️ 학생 시점으로 보기</>
                ) : (
                  <>🧑‍🏫 교탁 시점으로 보기</>
                )}
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-red-500 hover:from-pink-500 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100"
              >
                {loading ? '처리 중...' : '모든 정보 삭제'}
              </button>
            </div>
          </div>
        </div>

        {/* 현재 뷰 모드 안내 */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl px-6 py-3 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">
                {isTeacherView ? '🧑‍🏫' : '🏃‍♂️'}
              </span>
              <span className="text-sm font-medium text-blue-800">
                현재 시점: {isTeacherView ? '교탁에서 바라보는 시각' : '학생 시각'}
              </span>
            </div>
          </div>
        </div>

        {/* 좌석 배치 컨테이너 */}
        <div className="transition-all duration-500 ease-in-out">
          {/* 교탁 - 교탁 시점에서는 아래쪽에 위치 */}
          {!isTeacherView && (
            loading ? (
              // 교탁 로딩 스켈레톤
              <div className="max-w-xs mx-auto mb-8">
                <div className="bg-emerald-100 bg-opacity-50 rounded-xl p-6 border-2 border-emerald-200 animate-pulse">
                  <div className="text-center mb-4">
                    <div className="h-8 bg-emerald-300 rounded-full w-32 mx-auto"></div>
                  </div>
                  <div className="h-12 bg-emerald-300 rounded-lg"></div>
                </div>
              </div>
            ) : (
              <TeacherDesk
                teacherName={studentsData[0]?.[0]}
                onTeacherChange={handleTeacherChange}
                savingStatus={savingStatus}
              />
            )
          )}

          {/* 테이블 그리드 */}
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 12 }, (_, index) => (
                <div key={index} className="bg-white bg-opacity-50 rounded-xl p-5 border-2 border-gray-200 animate-pulse">
                  <div className="text-center mb-4">
                    <div className="h-6 bg-gray-300 rounded-full w-20 mx-auto"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-300 rounded-lg"></div>
                    <div className="h-10 bg-gray-300 rounded-lg"></div>
                  </div>
                </div>
              ))
            ) : (
              createTables()
            )}
          </div>

          {/* 교탁 - 교탁 시점에서는 위쪽에 위치 */}
          {isTeacherView && (
            loading ? (
              // 교탁 로딩 스켈레톤
              <div className="max-w-xs mx-auto mt-8">
                <div className="bg-emerald-100 bg-opacity-50 rounded-xl p-6 border-2 border-emerald-200 animate-pulse">
                  <div className="text-center mb-4">
                    <div className="h-8 bg-emerald-300 rounded-full w-32 mx-auto"></div>
                  </div>
                  <div className="h-12 bg-emerald-300 rounded-lg"></div>
                </div>
              </div>
            ) : (
              <TeacherDesk
                teacherName={studentsData[0]?.[0]}
                onTeacherChange={handleTeacherChange}
                savingStatus={savingStatus}
              />
            )
          )}
        </div>

        {/* 통계 정보 */}
        <div className="mt-10 text-center">
          <div className="inline-block bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl shadow-xl p-6 border-2 border-emerald-200">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">📊</span>
              {loading ? (
                <div className="h-6 bg-emerald-300 rounded w-48 animate-pulse"></div>
              ) : (
                <div className="text-lg font-bold text-emerald-800">
                  <p className="mb-1">
                    👨‍🏫 선생님: <span className="text-emerald-600">{studentsData[0]?.[0] ? '1명' : '0명'}</span> / 1명
                  </p>
                  <p>
                    🎓 학생: <span className="text-teal-600">{Object.entries(studentsData).reduce((count, [tableNum, table]) => {
                      if (parseInt(tableNum) === 0) return count; // 교탁 제외
                      return count + Object.values(table).filter(name => name && name.trim()).length;
                    }, 0)}명</span> / <span className="text-emerald-600">24명</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
