'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    // 비밀번호 재설정 세션 확인
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('세션 확인 오류:', error);
                    setIsValidSession(false);
                } else if (session) {
                    setIsValidSession(true);
                } else {
                    setIsValidSession(false);
                }
            } catch (error) {
                console.error('세션 확인 중 오류:', error);
                setIsValidSession(false);
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();
    }, []);

    const validateForm = () => {
        if (!password || !confirmPassword) {
            toast.error('모든 필드를 입력해주세요.');
            return false;
        }

        if (password.length < 6) {
            toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
            return false;
        }

        if (password !== confirmPassword) {
            toast.error('비밀번호가 일치하지 않습니다.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const toastId = toast.loading('비밀번호 변경 중...');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                let errorMessage = '비밀번호 변경에 실패했습니다.';

                if (error.message.includes('New password should be different')) {
                    errorMessage = '새 비밀번호는 기존 비밀번호와 달라야 합니다.';
                } else if (error.message.includes('Password should be at least')) {
                    errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
                }

                toast.error(errorMessage, { id: toastId });
                return;
            }

            toast.success('비밀번호가 성공적으로 변경되었습니다! 🎉', { id: toastId });

            // 2초 후 메인 페이지로 이동
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-white border-opacity-50">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-gray-600">세션 확인 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white border-opacity-50 text-center">
                        <div className="mb-6">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">❌</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                유효하지 않은 링크
                            </h1>
                            <p className="text-gray-600 mb-4">
                                비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                <p className="text-sm text-red-800 font-medium mb-2">⚠️ 가능한 원인</p>
                                <ul className="text-xs text-red-700 text-left space-y-1">
                                    <li>• 링크가 24시간을 초과하여 만료됨</li>
                                    <li>• 링크를 이미 사용함</li>
                                    <li>• 잘못된 링크를 클릭함</li>
                                </ul>
                            </div>

                            <Link
                                href="/forgot-password"
                                className="block w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                            >
                                새 재설정 링크 요청
                            </Link>

                            <Link
                                href="/login"
                                className="block w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                            >
                                로그인 페이지로 이동
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
                            🔒 새 비밀번호 설정
                        </h1>
                        <p className="text-gray-600">
                            새로운 비밀번호를 입력해주세요
                        </p>
                    </div>

                    {/* 비밀번호 재설정 폼 */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                새 비밀번호
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="최소 6자 이상"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                새 비밀번호 확인
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호를 다시 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    변경 중...
                                </div>
                            ) : (
                                '비밀번호 변경'
                            )}
                        </button>
                    </form>

                    {/* 안내 */}
                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-sm text-green-800 font-medium mb-2">🔒 보안 안내</p>
                        <ul className="text-xs text-green-700 space-y-1">
                            <li>• 비밀번호는 최소 6자 이상으로 설정하세요</li>
                            <li>• 다른 사이트와 다른 비밀번호를 사용하세요</li>
                            <li>• 주기적으로 비밀번호를 변경하세요</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 