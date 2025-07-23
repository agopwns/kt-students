'use client';

import { useState, useEffect } from 'react';
import { signUp, getCurrentUser } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
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
                // 인증 확인 중 오류가 발생해도 회원가입 페이지를 계속 표시
                console.log('인증 상태 확인 중 오류 (정상):', error);
            } finally {
                setCheckingAuth(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
            toast.error('모든 필드를 입력해주세요.');
            return false;
        }

        if (formData.password.length < 6) {
            toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
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
        const toastId = toast.loading('회원가입 중...');

        try {
            const { data, error } = await signUp(
                formData.email,
                formData.password,
                { name: formData.name }
            );

            if (error) {
                let errorMessage = '회원가입에 실패했습니다.';

                if (error.message.includes('User already registered')) {
                    errorMessage = '이미 등록된 이메일입니다.';
                } else if (error.message.includes('Password should be at least')) {
                    errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
                } else if (error.message.includes('Invalid email')) {
                    errorMessage = '올바른 이메일 형식을 입력해주세요.';
                }

                toast.error(errorMessage, { id: toastId });
                return;
            }

            if (data.user) {
                toast.success('회원가입이 완료되었습니다! 🎉', { id: toastId });

                // 이메일 인증이 필요한 경우
                if (!data.session) {
                    toast.success('이메일로 인증 링크가 전송되었습니다. 이메일을 확인해주세요.', {
                        duration: 5000
                    });
                }

                // 약간의 지연 후 로그인 페이지로 이동
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
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
                            🎓 회원가입
                        </h1>
                        <p className="text-gray-600">
                            학생 좌석 배치표를 사용해보세요
                        </p>
                    </div>

                    {/* 회원가입 폼 */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                이름
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="이름을 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="최소 6자 이상"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 transition-all placeholder-gray-500"
                                disabled={loading}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호 확인
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                                    회원가입 중...
                                </div>
                            ) : (
                                '회원가입'
                            )}
                        </button>
                    </form>

                    {/* 링크 */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            이미 계정이 있으신가요?{' '}
                            <Link
                                href="/login"
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                            >
                                로그인
                            </Link>
                        </p>
                    </div>

                    {/* 개인정보 안내 */}
                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-sm text-green-800 font-medium mb-2">🔒 개인정보 보호</p>
                        <p className="text-xs text-green-700">
                            회원가입 시 입력하신 정보는 안전하게 암호화되어 저장되며,
                            좌석 배치표 서비스 이용 목적으로만 사용됩니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 