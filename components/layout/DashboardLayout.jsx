'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Boxes, Users, Menu, AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/store/useAuthStore';
import { getRoleDashboard } from '@/lib/permissions';

export function DashboardLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const business = useAuthStore((state) => state.business);
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  // Evaluate if subscription access is restricted
  const isSubRestricted = business?.subscription_status === 'EXPIRED' ||
                          business?.subscription_status === 'CANCELLED' ||
                          (business?.subscription_status === 'PENDING' && business?.license_status !== 'ACTIVE');

  // Allowed pages during restricted state (only Subscription & Billing is open)
  const isSettingsOrBilling = pathname?.includes('/settings/subscription');

  const homeHref = getRoleDashboard(role, user?.custom_role?.slug);

  const mobileTabs = [
    { name: 'Home', href: homeHref, icon: LayoutDashboard },
    { name: 'Sale', href: '/sales/new', icon: ShoppingCart },
    { name: 'Stock', href: '/stock', icon: Boxes },
    { name: 'Customers', href: '/crm/customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex pb-24 lg:pb-0">
      {/* Sidebar Navigation (Left on desktop | Bottom Sheet Drawer on mobile) */}
      <React.Suspense fallback={<aside className="hidden lg:block w-[288px] bg-[#0B1120] h-screen" />}>
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      </React.Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-[288px]">
        <Header setIsMobileOpen={setIsMobileOpen} />
        
        {/* If subscription is restricted and user is attempting to navigate to restricted module */}
        {isSubRestricted && !isSettingsOrBilling ? (
          <main className="flex-1 p-4 sm:p-8 w-full mx-auto max-w-4xl flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xl p-8 sm:p-10 text-center max-w-lg w-full">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Subscription Required
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Full access to sales, invoicing, inventory, CRM, and financial reports requires an active company subscription to <span className="font-bold text-slate-800">VEXA Invoice Monthly</span>.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-left mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</span>
                  <span className="text-xs font-extrabold text-blue-600 uppercase">Monthly Renewal</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-slate-900">VEXA Invoice Monthly</span>
                  <span className="text-2xl font-black text-slate-900">₹1<span className="text-xs font-semibold text-slate-500">/mo</span></span>
                </div>
              </div>

              <Link
                href="/settings/subscription"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Subscribe Now — ₹1/month
              </Link>
            </div>
          </main>
        ) : (
          <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full mx-auto max-w-[1600px] overflow-x-hidden pb-24 lg:pb-6">
            {children}
          </main>
        )}
      </div>

      {/* Floating Bottom Mobile Navigation Bar */}
      <div className="fixed bottom-2.5 left-2.5 right-2.5 sm:left-6 sm:right-6 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl px-2 py-1 flex items-center justify-around lg:hidden shadow-xl shadow-slate-300/40 ring-1 ring-slate-900/5">
        {mobileTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`mobile-nav-item flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all ${
                isActive ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight font-bold">{tab.name}</span>
            </Link>
          );
        })}

        {/* Menu bar button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className={`mobile-nav-item flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all cursor-pointer ${
            isMobileOpen ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="p-1 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/30">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[9px] mt-0.5 font-bold text-slate-700">Menu</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardLayout;


