'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorative elements matching landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Navigation Bar */}
        <nav className="py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-xl">Anoq</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Home</Link>
            <Link href="/register" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Register</Link>
          </div>
        </nav>

        {/* Login Section */}
        <main className="flex min-h-[calc(100vh-100px)] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <AuthForm mode="login" onSuccess={() => router.replace('/dashboard')} />
          </div>
        </main>
      </div>
    </div>
  );
}