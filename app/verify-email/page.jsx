'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, CheckCircle2, RefreshCw, AlertCircle, ShieldCheck, Mail, ArrowRight, Building, Sparkles } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [registrationId, setRegistrationId] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const queryId = searchParams.get('id');
    const queryEmail = searchParams.get('email');
    
    let activeId = queryId;
    let activeEmail = queryEmail;

    if (queryId) {
      setRegistrationId(queryId);
    } else if (typeof window !== 'undefined') {
      const storedId = sessionStorage.getItem('vexa_pending_signup_id') || '';
      if (storedId) {
        setRegistrationId(storedId);
        activeId = storedId;
      }
    }

    if (queryEmail) {
      setEmail(queryEmail);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vexa_pending_signup_email', queryEmail);
      }
    } else if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('vexa_pending_signup_email') || '';
      if (stored) {
        setEmail(stored);
        activeEmail = stored;
      }
    }

    // IMMEDIATELY remove email from the address/search bar if present, and replace with id
    if (typeof window !== 'undefined' && queryEmail) {
      const fallbackId = activeId || `reg_${Date.now().toString(36)}`;
      if (!activeId) {
        setRegistrationId(fallbackId);
        sessionStorage.setItem('vexa_pending_signup_id', fallbackId);
      }
      const newUrl = `${window.location.pathname}?id=${encodeURIComponent(activeId || fallbackId)}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchParams]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setApiError('Please enter the 6-digit verification code.');
      return;
    }

    if (!registrationId && !email) {
      setApiError('Registration reference is missing. Please restart signup from /signup.');
      return;
    }

    setIsLoading(true);
    try {
      let clientRegistrationData = null;
      if (typeof window !== 'undefined') {
        try {
          const rawPayload = sessionStorage.getItem('vexa_pending_signup_payload');
          if (rawPayload) clientRegistrationData = JSON.parse(rawPayload);
        } catch (e) {}
      }

      // Calls POST /auth/verify-otp with id, email, otp, and clientRegistrationData as fallback
      const response = await authService.verifyOtp({
        id: registrationId || undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        otp: otpCode.trim(),
        registrationData: clientRegistrationData
      });

      if (response?.data || response?.success) {
        const payload = response.data || response;
        const { user, business, token } = payload;

        if (user && business && token) {
          login(user, business, token);

          // Clear temporary signup storage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('vexa_pending_signup_id');
            sessionStorage.removeItem('vexa_pending_signup_email');
            sessionStorage.removeItem('vexa_pending_signup_name');
            sessionStorage.removeItem('vexa_pending_signup_payload');
          }

          // Evaluate subscription status:
          // During TRIALING or ACTIVE, redirect directly to dashboard
          const hasAccess = business.subscription_status === 'ACTIVE' || business.subscription_status === 'TRIALING' || business.license_status === 'ACTIVE';

          if (hasAccess) {
            router.push('/dashboard');
          } else {
            router.push('/settings/subscription');
          }
          return;
        }
      }
      throw new Error(response?.message || 'Verification succeeded, but session could not be established.');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = email || (typeof window !== 'undefined' && sessionStorage.getItem('vexa_pending_signup_email'));
    if (!targetEmail) {
      setApiError('Email address is missing. Please return to the signup page.');
      return;
    }
    setApiError('');
    setSuccessMessage('');
    setIsResending(true);
    try {
      const storedName = (typeof window !== 'undefined' && sessionStorage.getItem('vexa_pending_signup_name')) || 'Business Owner';
      let storedPayload = null;
      if (typeof window !== 'undefined') {
        try {
          const rawPayload = sessionStorage.getItem('vexa_pending_signup_payload');
          if (rawPayload) storedPayload = JSON.parse(rawPayload);
        } catch (e) {}
      }

      const res = await authService.sendOtp(targetEmail, storedName, storedPayload);
      if (res?.data?.id) {
        setRegistrationId(res.data.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vexa_pending_signup_id', res.data.id);
        }
      }
      setSuccessMessage('A new 6-digit OTP verification code has been dispatched.');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to resend OTP code.');
    } finally {
      setIsResending(false);
    }
  };

  // Mask email for privacy so full email isn't openly exposed
  const getDisplayReference = () => {
    if (email) {
      const parts = email.split('@');
      if (parts.length === 2) {
        const userPart = parts[0];
        const masked = userPart.length > 2 ? `${userPart.slice(0, 2)}***` : `${userPart}***`;
        return `${masked}@${parts[1]}`;
      }
      return email;
    }
    if (registrationId) {
      return `Ref: ${registrationId.slice(0, 16)}...`;
    }
    return 'your registered email';
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/80">
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
          Verify Your Email
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Enter the 6-digit code sent to <span className="font-bold text-slate-800">{getDisplayReference()}</span>
        </p>
      </div>

      {apiError && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-center space-x-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{apiError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in duration-300">
        <div className="text-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <p className="text-xs text-slate-600">
            Dispatched via <strong className="text-slate-900 font-bold">noreply@vexatech.in</strong>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Please check your inbox and spam folder.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 text-center uppercase tracking-wider">
            6-Digit Verification Code
          </label>
          <div className="relative max-w-xs mx-auto">
            <Input
              type="text"
              maxLength={6}
              placeholder="••••••"
              className="text-center text-2xl font-mono tracking-widest font-black"
              icon={KeyRound}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-bold shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 active:scale-[0.99]"
          isLoading={isLoading}
        >
          Verify & Activate Company
          <CheckCircle2 className="w-4 h-4 ml-2" />
        </Button>

        <div className="flex items-center justify-between text-xs pt-2">
          <Link
            href="/signup"
            className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            ← Back to Signup
          </Link>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleResendOtp}
            disabled={isResending}
            className="text-blue-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>Resend Code</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/30 to-indigo-300/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-200/40 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="w-full sm:max-w-md relative z-10">
        <Suspense fallback={<div className="flex justify-center p-8 bg-white rounded-3xl shadow-xl"><Spinner className="w-8 h-8 text-blue-600" /></div>}>
          <VerifyEmailContent />
        </Suspense>

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
