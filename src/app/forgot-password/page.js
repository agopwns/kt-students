'use client';

import { useState } from 'react';
import { resetPassword } from '../../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('이메일을 입력해주세요.');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('비밀번호 재설정 이메일 전송 중...');

        try {
            const { error } = await resetPassword(email);

            if (error) {
                let errorMessage = '비밀번호 재설정 이메일 전송에 실패했습니다.';

                if (error.message.includes('Invalid email')) {
                    errorMessage = '올바른 이메일 형식을 입력해주세요.';
                } else if (error.message.includes('User not found')) {
                    errorMessage = '등록되지 않은 이메일입니다.';
                }

                toast.error(errorMessage, { id: toastId });
                return;
            }

            toast.success('비밀번호 재설정 이메일이 전송되었습니다! 📧', { id: toastId });
            setEmailSent(true);

        } catch (error) {
            console.error('비밀번호 재설정 오류:', error);
            toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white border-opacity-50 text-center">
                        <div className="mb-6">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">📧</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                이메일이 전송되었습니다!
                            </h1>
                            <p className="text-gray-600">
                                <span className="font-medium">{email}</span>로<br />
                                비밀번호 재설정 링크를 보냈습니다.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm text-blue-800 font-medium mb-2">📋 다음 단계</p>
                                <ol className="text-xs text-blue-700 text-left space-y-1">
                                    <li>1. 이메일 받은편지함을 확인하세요</li>
                                    <li>2. 스팸함도 확인해보세요</li>
                                    <li>3. 링크를 클릭하여 새 비밀번호를 설정하세요</li>
                                </ol>
                            </div>

                            <button
                                onClick={() => setEmailSent(false)}
                                className="w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                다른 이메일로 재전송
                            </button>

                            <Link
                                href="/login"
                                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                            >
                                로그인 페이지로 돌아가기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white border-opacity-50">
                    {/* 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            🔑 비밀번호 찾기
                        </h1>
                        <p className="text-gray-600">
                            등록하신 이메일로 재설정 링크를 보내드립니다
                        </p>
                    </div>

                    {/* 비밀번호 재설정 폼 */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="등록하신 이메일을 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    전송 중...
                                </div>
                            ) : (
                                '재설정 이메일 보내기'
                            )}
                        </button>
                    </form>

                    {/* 링크 */}
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-sm text-gray-600">
                            비밀번호가 기억나셨나요?{' '}
                            <Link
                                href="/login"
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                                로그인
                            </Link>
                        </p>

                        <p className="text-sm text-gray-600">
                            계정이 없으신가요?{' '}
                            <Link
                                href="/signup"
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                                회원가입
                            </Link>
                        </p>
                    </div>

                    {/* 안내 */}
                    <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <p className="text-sm text-purple-800 font-medium mb-2">ℹ️ 안내사항</p>
                        <ul className="text-xs text-purple-700 space-y-1">
                            <li>• 이메일이 오지 않으면 스팸함을 확인해주세요</li>
                            <li>• 링크는 24시간 동안 유효합니다</li>
                            <li>• 문제가 지속되면 관리자에게 문의해주세요</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 