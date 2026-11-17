'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const signupSchema = z
  .object({
    business_name: z.string().min(2, 'Company name must be at least 2 characters'),
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  });

export default function SignupPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If user explicitly visits /signup, clear any existing session so they can register a new account cleanly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasToken = sessionStorage.getItem('vexa_token') || localStorage.getItem('vexa_token');
      if (hasToken) {
        sessionStorage.removeItem('vexa_token');
        sessionStorage.removeItem('vexa_user');
        sessionStorage.removeItem('vexa_business');
        localStorage.removeItem('vexa_token');
        localStorage.removeItem('vexa_user');
        localStorage.removeItem('vexa_business');
        logout({ redirect: false });
      }
    }
  }, [logout]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      business_name: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: ''
    }
  });

  const onSubmit = async (values) => {
    setApiError('');
    setIsLoading(true);
    try {
      const payload = {
        business_name: values.business_name.trim(),
        admin_name: values.name.trim(),
        owner_name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password
      };

      const res = await authService.sendOtp(payload.email, payload.admin_name, payload);

      if (res.success || res.data) {
        const regId = res.data?.id || res.id;
        // Store pending signup data in sessionStorage for /verify-email and resend support
        if (typeof window !== 'undefined') {
          if (regId) sessionStorage.setItem('vexa_pending_signup_id', regId);
          sessionStorage.setItem('vexa_pending_signup_email', payload.email);
          sessionStorage.setItem('vexa_pending_signup_name', payload.admin_name);
          sessionStorage.setItem('vexa_pending_signup_payload', JSON.stringify(payload));
        }
        if (regId) {
          router.push(`/verify-email?id=${encodeURIComponent(regId)}`);
        } else {
          router.push('/verify-email');
        }
      }
    } catch (err) {
      setApiError(err.message || 'Failed to submit registration. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-300/30 to-blue-300/30 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-sky-200/40 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="w-full sm:max-w-xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/80">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3 transform hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="VEXA TECH"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/vexa-logo.png') {
                    e.currentTarget.src = '/vexa-logo.png';
                  }
                }}
                className="h-16 w-auto object-contain drop-shadow-md"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Create Your Business Account
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Register your company to get started with VEXA Invoice
            </p>
          </div>

          {apiError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Company Name */}
              <Input
                label="Company Name *"
                placeholder="e.g. Mayuri Saree"
                icon={Building}
                error={errors.business_name?.message}
                {...register('business_name')}
              />

              {/* 2. Full Name (Owner) */}
              <Input
                label="Full Name (Company Owner) *"
                placeholder="Enter Your Full Name"
                icon={User}
                error={errors.name?.message}
                {...register('name')}
              />

              {/* 3. Email Address */}
              <Input
                label="Email Address *"
                type="email"
                placeholder="owner@yourcompany.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              {/* 4. Phone Number */}
              <Input
                label="Phone Number *"
                type="tel"
                placeholder="10-digit mobile number"
                icon={Phone}
                error={errors.phone?.message}
                {...register('phone')}
              />

              {/* 5. Password */}
              <div className="relative">
                <Input
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 6. Confirm Password */}
              <div className="relative">
                <Input
                  label="Confirm Password *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  icon={Lock}
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold shadow-lg shadow-blue-500/25 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 active:scale-[0.99]"
              isLoading={isLoading}
            >
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              Existing account?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>
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
