'use client';

import { useState, useEffect } from 'react';

// 개별 테이블 컴포넌트
function Table({ tableNumber, students, onStudentChange }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-5 border-2 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="text-center mb-4">
        <h3 className="text-sm font-bold text-indigo-700 bg-white bg-opacity-60 rounded-full py-1 px-3 inline-block">
          테이블 {tableNumber}
        </h3>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="학생 1 이름"
          value={students[0] || ''}
          onChange={(e) => onStudentChange(tableNumber, 0, e.target.value)}
          className="w-full px-4 py-3 text-sm bg-white bg-opacity-80 border border-blue-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium"
        />
        <input
          type="text"
          placeholder="학생 2 이름"
          value={students[1] || ''}
          onChange={(e) => onStudentChange(tableNumber, 1, e.target.value)}
          className="w-full px-4 py-3 text-sm bg-white bg-opacity-80 border border-blue-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:bg-white transition-all placeholder-gray-500 text-gray-800 font-medium"
        />
      </div>
    </div>
  );
}

export default function Home() {
  // 20개 테이블, 각 테이블당 2명 = 총 40명의 학생 데이터
  const [studentsData, setStudentsData] = useState({});

  // 컴포넌트 마운트 시 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const savedData = localStorage.getItem('studentsSeatingData');
    if (savedData) {
      setStudentsData(JSON.parse(savedData));
    }
  }, []);

  // 학생 이름 변경 핸들러
  const handleStudentChange = (tableNumber, seatIndex, name) => {
    setStudentsData(prev => {
      const newData = {
        ...prev,
        [tableNumber]: {
          ...prev[tableNumber],
          [seatIndex]: name
        }
      };

      // 로컬 스토리지에 저장
      localStorage.setItem('studentsSeatingData', JSON.stringify(newData));

      return newData;
    });
  };

  // 데이터 초기화 핸들러
  const handleClearAll = () => {
    if (confirm('모든 학생 정보를 삭제하시겠습니까?')) {
      setStudentsData({});
      localStorage.removeItem('studentsSeatingData');
    }
  };

  // 5x4 그리드 생성
  const createTables = () => {
    const tables = [];
    let tableNumber = 1;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const students = studentsData[tableNumber] || {};
        tables.push(
          <Table
            key={tableNumber}
            tableNumber={tableNumber}
            students={students}
            onStudentChange={handleStudentChange}
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
            <p className="text-gray-700 mb-6 text-lg font-medium">
              총 20개 테이블 × 2명 = 40명의 학생
            </p>
            <button
              onClick={handleClearAll}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-red-500 hover:from-pink-500 hover:to-red-600 text-white rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              모든 정보 삭제
            </button>
          </div>
        </div>

        {/* 테이블 그리드 */}
        <div className="grid grid-cols-5 gap-4 max-w-6xl mx-auto">
          {createTables()}
        </div>

        {/* 통계 정보 */}
        <div className="mt-10 text-center">
          <div className="inline-block bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl shadow-xl p-6 border-2 border-emerald-200">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">📊</span>
              <p className="text-lg font-bold text-emerald-800">
                입력된 학생 수: <span className="text-teal-600">{Object.values(studentsData).reduce((count, table) => {
                  return count + Object.values(table).filter(name => name && name.trim()).length;
                }, 0)}명</span> / <span className="text-emerald-600">40명</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
