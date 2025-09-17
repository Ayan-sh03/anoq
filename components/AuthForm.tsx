'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/context';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from './ui/use-toast';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    family_name: '',
    given_name: '',
  });
  const [loading, setLoading] = useState(false);
  const { login, register, loading: authLoading } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
          family_name: formData.family_name || undefined,
          given_name: formData.given_name || undefined,
        });
      }

      if (onSuccess) {
        onSuccess();
        toast.toast({
          title: 'Success',
          description: 'You have successfully signed in!',
        });
      }
    } catch (error) {
      // Error is handled by the auth library's logging
      toast.toast({
        title: 'Error',
        description: 'There was a problem with your authentication. Please try again.',
      });
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Decorative background elements matching landing page */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl blur-lg opacity-50"></div>

      <form onSubmit={handleSubmit} className="relative space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
        {/* Form Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600">
            {mode === 'login' ? 'Sign in to your account' : 'Join Anoq to start collecting feedback'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading || authLoading}
              className="bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading || authLoading}
              className="bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">Username (optional)</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading || authLoading}
                  className="bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="given_name" className="text-gray-700 font-medium">First Name (optional)</Label>
                  <Input
                    id="given_name"
                    name="given_name"
                    type="text"
                    placeholder="First name"
                    value={formData.given_name}
                    onChange={handleInputChange}
                    disabled={loading || authLoading}
                    className="bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family_name" className="text-gray-700 font-medium">Last Name (optional)</Label>
                  <Input
                    id="family_name"
                    name="family_name"
                    type="text"
                    placeholder="Last name"
                    value={formData.family_name}
                    onChange={handleInputChange}
                    disabled={loading || authLoading}
                    className="bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <Button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 h-12"
          disabled={loading || authLoading}
        >
          {loading || authLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'login' ? 'Logging in...' : 'Creating account...'}
            </>
          ) : (
            mode === 'login' ? 'Login' : 'Register'
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Register here
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Login here
                </Link>
              </>
            )}
          </p>
        </div>
      </form>
    </div>
  );
}