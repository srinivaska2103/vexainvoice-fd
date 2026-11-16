'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/login';

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid registered email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess('A 6-digit OTP verification code has been sent to your email address!');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the valid 6-digit OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccess('Password updated successfully! Redirecting you to sign in...');
      setTimeout(() => {
        router.push(returnTo);
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center space-x-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Registered Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                suppressHydrationWarning
                placeholder="Enter Your Registered Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              We will send a 6-digit one-time verification code to this email.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <Spinner className="w-4 h-4 text-white" />
                  <span>Sending OTP...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Email:</span>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                Change Email
              </button>
            </div>
            <p className="font-bold text-slate-900 truncate">{email}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6-Digit OTP Code *
            </label>
            <input
              type="text"
              maxLength={6}
              required
              suppressHydrationWarning
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                suppressHydrationWarning
                placeholder="Enter Your New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <Spinner className="w-4 h-4 text-white" />
                  <span>Updating Password...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Update Password & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href={returnTo}
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/30 to-indigo-300/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-200/40 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/80">
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold mb-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Recovery</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Reset Your Password
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Recover access to your VEXA Invoice account securely
            </p>
          </div>

          <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="w-8 h-8 text-blue-600" /></div>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>

        <div className="mt-8 text-center flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all duration-200 group">
            <Sparkles className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold text-slate-600 tracking-wide">
              A <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Vexa Tech</span> Product
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
