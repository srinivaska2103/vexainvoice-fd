'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, CheckCircle2, AlertCircle, Sparkles, Building2, Layers } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { getRoleDashboard } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If the browser URL contains email or password query parameters (e.g. from an unprevented default GET submission),
    // immediately strip them from the browser address bar without a page reload for security.
    if (typeof window !== 'undefined' && (window.location.search.includes('email=') || window.location.search.includes('password='))) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values, event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setApiError('');
    setIsLoading(true);
    try {
      const response = await authService.login(values.email, values.password);
      if (response.success && response.data) {
        const { user, business, token } = response.data;
        login(user, business, token);
        const destination = redirect && redirect !== '/dashboard' 
          ? redirect 
          : getRoleDashboard(user?.role, user?.custom_role?.slug || user?.role_slug);
        router.push(destination);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {apiError && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-medium text-rose-700 flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{apiError}</span>
        </div>
      )}

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }} 
        action="#"
        method="POST"
        className="space-y-4"
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter Your Email Address"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter Your Password"
            icon={Lock}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-[38px] text-slate-400 hover:text-blue-600 transition-colors duration-150 p-1 rounded-md"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center space-x-2 text-slate-600 cursor-pointer group">
            <input
              type="checkbox"
              suppressHydrationWarning
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 transition-all duration-150 cursor-pointer"
            />
            <span className="group-hover:text-slate-900 transition-colors">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold shadow-lg shadow-blue-500/20 mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 active:scale-[0.99]"
          isLoading={isLoading}
        >
          Sign In to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
        {!isAuthenticated && (
          <p className="text-xs text-slate-600 font-medium">
            New to VEXA Invoice?{' '}
            <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              Create Your Business Account
            </Link>
          </p>
        )}
      </div>

    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role, user } = useAuth();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(getRoleDashboard(role, user?.custom_role?.slug));
    }
  }, [isAuthenticated, isLoading, role, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Decorative light background visual elements & soft ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/30 to-indigo-300/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-200/40 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/80">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="VEXA TECH"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/vexa-logo.png') {
                    e.currentTarget.src = '/vexa-logo.png';
                  }
                }}
                className="h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sign in to VEXA Invoice
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Commercial SaaS Billing, Inventory & ERP System
            </p>
          </div>

          <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="w-8 h-8 text-blue-600" /></div>}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-8 text-center flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all duration-200 group">
            <Sparkles className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold text-slate-700 tracking-wide">
              A <span className="text-blue-600 font-bold">Vexa Tech</span> Product
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
