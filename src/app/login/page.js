'use client';

import { useState, useEffect } from 'react';
import { signIn, getCurrentUser } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();

    // 이미 로그인된 사용자인지 확인
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: user, error } = await getCurrentUser();
                if (user) {
                    router.push('/');
                }
            } catch (error) {
                // 인증 확인 중 오류가 발생해도 로그인 페이지를 계속 표시
                console.log('인증 상태 확인 중 오류 (정상):', error);
            } finally {
                setCheckingAuth(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('로그인 중...');

        try {
            const { data, error } = await signIn(email, password);

            if (error) {
                let errorMessage = '로그인에 실패했습니다.';

                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = '이메일 인증을 완료해주세요.';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = '너무 많은 시도가 감지되었습니다. 잠시 후 다시 시도해주세요.';
                }

                toast.error(errorMessage, { id: toastId });
                return;
            }

            if (data.user) {
                toast.success('로그인되었습니다! 🎉', { id: toastId });
                router.push('/');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-white border-opacity-50">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-gray-600">인증 상태 확인 중...</span>
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
                            🎓 로그인
                        </h1>
                        <p className="text-gray-600">
                            학생 좌석 배치표에 접속하세요
                        </p>
                    </div>

                    {/* 로그인 폼 */}
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
                                placeholder="example@email.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    로그인 중...
                                </div>
                            ) : (
                                '로그인'
                            )}
                        </button>
                    </form>

                    {/* 링크 */}
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-sm text-gray-600">
                            계정이 없으신가요?{' '}
                            <Link
                                href="/signup"
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                                회원가입
                            </Link>
                        </p>

                        <p className="text-sm text-gray-600">
                            비밀번호를 잊으셨나요?{' '}
                            <Link
                                href="/forgot-password"
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                                비밀번호 찾기
                            </Link>
                        </p>
                    </div>

                    {/* 데모 계정 안내 */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-2">💡 데모 안내</p>
                        <p className="text-xs text-blue-700">
                            테스트를 위해 임시 계정을 만들어보세요.
                            회원가입 후 바로 로그인하여 좌석 배치표를 사용할 수 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 