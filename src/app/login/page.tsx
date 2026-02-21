'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Branding {
  company_name: string;
  company_logo: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [branding, setBranding] = useState<Branding>({
    company_name: 'نظام إدارة المخزون',
    company_logo: null,
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/public/branding`
        );
        setBranding(response.data);
      } catch {
        // Use defaults if branding fails to load
      }
    };
    fetchBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      await login(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Login error full:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      const err = error as { response?: { data?: { message?: string } }, message?: string, code?: string };
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error response:', err.response);
      toast.error(err.response?.data?.message || err.message || 'خطأ في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const logoUrl = branding.company_logo
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${branding.company_logo}`
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={branding.company_name}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 items-center justify-center ${logoUrl ? 'hidden' : 'flex'}`}
            >
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{branding.company_name}</h1>
            <p className="text-gray-500 mt-2">مرحبا بك، قم بتسجيل الدخول</p>
          </div>

          {/* Demo credentials info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-blue-700">بيانات الدخول التجريبية</span>
            </div>
            <p className="text-sm text-gray-600 font-mono">البريد: admin@demo.com</p>
            <p className="text-sm text-gray-600 font-mono">كلمة المرور: demo1234</p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@demo.com');
                setPassword('demo1234');
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              استخدام البيانات التجريبية
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="البريد الإلكتروني"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="spinner w-5 h-5 border-2 border-white border-t-transparent"></span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* تحميل التطبيقات */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4">تحميل التطبيقات التجريبية</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://logistics-demo.symloop.com/Seller V0.1.apk"
                className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                download
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="text-xs font-medium">تطبيق البائع</span>
              </a>
              <a
                href="https://logistics-demo.symloop.com/Livreur V0.1.apk"
                className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                download
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span className="text-xs font-medium">تطبيق التوصيل</span>
              </a>
              <a
                href="https://logistics-demo.symloop.com/Cashvan V0.1.apk"
                className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                download
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">البيع المتنقل</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
