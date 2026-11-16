'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRoleDashboard } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';

export default function AccessDeniedPage() {
  const { user, role, displayRole, logout } = useAuth();
  const authorizedDashboard = getRoleDashboard(role, user?.custom_role?.slug || user?.role_slug);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl border border-rose-200/80 shadow-2xl p-8 sm:p-12 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
        
        <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Access Restricted
        </h1>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your account role <span className="font-bold text-slate-900">({displayRole || role || 'User'})</span> is not authorized to access this route or administrative resource.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6 text-left space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Account:</span>
            <span className="font-semibold text-slate-800">{user?.name || user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Role:</span>
            <span className="font-bold text-rose-700 uppercase">{displayRole || role || 'GUEST'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link href={authorizedDashboard} className="block w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Go to My Authorized Dashboard</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={() => logout()}
            className="w-full text-slate-600 hover:text-slate-900 border-slate-200 font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

