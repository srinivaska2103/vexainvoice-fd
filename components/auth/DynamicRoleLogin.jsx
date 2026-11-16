'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
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

export function RoleLoginForm({ roleSlug, roleData, onRoleError }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard';
  const { login, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If the browser URL contains email or password query parameters, strip them immediately
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
      const response = await authService.login(values.email, values.password, roleSlug);
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
            title={showPassword ? 'Hide password' : 'Show password'}
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
            href={`/forgot-password?returnTo=/company/${roleSlug}/login`}
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
          {roleData ? `Sign In as ${roleData.name}` : 'Sign In to Dashboard'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      {/* Role Notice & Security Info (NO Create New Account Link on Role Login) */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
        {!roleSlug && !isAuthenticated && (
          <p className="text-xs text-slate-600 font-medium">
            New to VEXA Invoice?{' '}
            <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              Create Your Business Account
            </Link>
          </p>
        )}
        <p className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          🔑 <span className="font-bold text-slate-700">Role Portal:</span> Access restricted to authorized {roleData?.name || 'team'} accounts configured by the Business Admin.
        </p>
      </div>

    </div>
  );
}

export default function DynamicRoleLoginPage({ roleSlug }) {
  const { user, business, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [roleData, setRoleData] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const fetchRoleConfig = async () => {
      try {
        setLoadingRole(true);
        const { roleService } = await import('@/services/roleService');
        const res = await roleService.getRoleBySlug(roleSlug);
        if (isMounted) {
          if (res?.data) {
            setRoleData(res.data);
          } else {
            setRoleData(res);
          }
        }
      } catch (err) {
        if (isMounted) {
          setRoleError(err.message || 'This role portal does not exist or has been disabled.');
        }
      } finally {
        if (isMounted) {
          setLoadingRole(false);
        }
      }
    };

    if (roleSlug) {
      fetchRoleConfig();
    }
    return () => {
      isMounted = false;
    };
  }, [roleSlug]);

  const resolveLogoUrl = (company) => {
    if (!company) {
      if (typeof window !== 'undefined') {
        try {
          const storedBiz = JSON.parse(localStorage.getItem('vexa_business') || '{}');
          if (storedBiz?.logo_url || storedBiz?.logo) {
            return resolveLogoUrl(storedBiz);
          }
        } catch (e) {}
      }
      return '/logo.png';
    }
    let url = company.logo_url || company.logo;
    if (!url) return '/logo.png';
    if (typeof url === 'string' && url.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(url.trim());
        url = parsed.logo || parsed.logo_url || '/logo.png';
      } catch (e) {}
    }
    return url || '/logo.png';
  };

  const activeCompany = roleData?.company || (mounted ? business : null);
  const logoSrc = mounted ? resolveLogoUrl(activeCompany) : '/logo.png';
  const companyDisplayName = mounted ? (activeCompany?.business_name || '') : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Decorative ambient elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/30 to-indigo-300/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-200/40 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/80">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
              {mounted ? (
                <img
                  src={logoSrc}
                  alt={companyDisplayName || "Company Logo"}
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/logo.png') {
                      e.currentTarget.src = '/logo.png';
                    }
                  }}
                  className="h-20 w-auto object-contain drop-shadow-sm max-w-[200px]"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center" />
              )}
            </div>
            {mounted && companyDisplayName && (
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                {companyDisplayName}
              </p>
            )}
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {loadingRole
                ? 'Sign in to Portal'
                : roleData
                ? `${roleData.name} Login`
                : 'Role Portal'}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {roleData?.description || 'Commercial SaaS Billing, Inventory & ERP System'}
            </p>
          </div>

          {loadingRole ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <Spinner className="w-8 h-8 text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Resolving role configuration...</p>
            </div>
          ) : roleError ? (
            <div className="p-6 bg-rose-50 border border-rose-200/90 rounded-2xl text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-rose-900">Portal Unavailable</h3>
              <p className="text-xs text-rose-700 leading-relaxed">{roleError}</p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ← Go to Standard Login
                </Link>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="w-8 h-8 text-blue-600" /></div>}>
              <RoleLoginForm roleSlug={roleSlug} roleData={roleData} />
            </Suspense>
          )}
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
