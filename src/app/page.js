'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllStudents, upsertStudent, deleteAllStudents, subscribeToStudents } from '../lib/supabase';
import toast from 'react-hot-toast';

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
          className="w-full px-4 py-4 pr-8 text-base bg-white bg-opacity-80 border border-emerald-400 rounded-lg focus:outline-none focus:ring-3 focus:ring-emerald-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium text-center"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <SaveStatus status={savingStatus['0-0']} />
        </div>
      </div>
    </div>
  );
}

// 개별 테이블 컴포넌트
function Table({ tableNumber, students, onStudentChange, savingStatus }) {
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
            placeholder="학생 1"
            value={students[0] || ''}
            onChange={(e) => onStudentChange(tableNumber, 0, e.target.value)}
            className="w-full px-3 py-3 pr-7 text-sm bg-white bg-opacity-80 border border-blue-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium text-center"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <SaveStatus status={savingStatus[`${tableNumber}-0`]} />
          </div>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="학생 2"
            value={students[1] || ''}
            onChange={(e) => onStudentChange(tableNumber, 1, e.target.value)}
            className="w-full px-3 py-3 pr-7 text-sm bg-white bg-opacity-80 border border-blue-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium text-center"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <SaveStatus status={savingStatus[`${tableNumber}-1`]} />
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

  // 컴포넌트 마운트 시 Supabase에서 데이터 로드
  useEffect(() => {
    loadStudentsData(false); // 초기 로드

    // 실시간 구독 설정
    const subscription = subscribeToStudents((payload) => {
      console.log('실시간 업데이트:', payload);
      // 데이터가 변경되면 다시 로드 (실시간 업데이트)
      loadStudentsData(true);
    });

    // 컴포넌트 언마운트 시 구독 해제 및 타이머 정리
    return () => {
      subscription.unsubscribe();

      // 모든 활성 타이머 정리
      Object.values(saveTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Supabase에서 학생 데이터 로드
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

      const { data, error } = await getAllStudents();

      if (error) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error(error);
        return;
      }

      const transformedData = transformSupabaseData(data);
      setStudentsData(transformedData);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      if (!isRealtimeUpdate) {
        setLoading(false);
      }
    }
  };

  // 실제 데이터베이스 저장 함수
  const saveToDatabase = async (tableNumber, seatIndex, name) => {
    const fieldKey = `${tableNumber}-${seatIndex}`;

    try {
      setSavingStatus(prev => ({ ...prev, [fieldKey]: 'saving' }));

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

      // 저장 완료 후 500ms 뒤 실시간 업데이트 재활성화 (깜빡임 방지)
      setTimeout(() => {
        ignoreRealtimeRef.current = false;
      }, 500);

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
      ignoreRealtimeRef.current = false;
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
      const { error } = await deleteAllStudents();

      if (error) {
        setError('학생 정보를 삭제하는 중 오류가 발생했습니다.');
        console.error(error);

        // 에러 토스트로 업데이트
        toast.error('삭제 중 오류가 발생했습니다. 다시 시도해주세요.', { id: toastId });
        return;
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
          />
        );
        tableNumber++;
      }
    }

    return tables;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white border-opacity-50">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              🎓 학생 좌석 배치표
            </h1>
            <p className="text-gray-700 mb-4 text-lg font-medium">
              교탁 1개 + 학생 테이블 12개 × 2명 = 선생님 1명 + 학생 24명 (Supabase 연동)
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
                타이핑 종료 후 2초 뒤에 자동으로 저장되며,
                <span className="font-medium text-blue-600"> 저장 완료 시 토스트 알림</span>이 표시됩니다
              </p>
            </div>

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

            <button
              onClick={handleClearAll}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-red-500 hover:from-pink-500 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100"
            >
              {loading ? '처리 중...' : '모든 정보 삭제'}
            </button>
          </div>
        </div>

        {/* 교탁 */}
        {loading ? (
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
