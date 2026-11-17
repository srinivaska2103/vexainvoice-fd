'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Plus, LogOut, User, Building, ShieldCheck, ChevronDown, Bell, CheckCheck, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { emailService } from '@/services/emailService';
import { stockService } from '@/services/stockService';
import { subscriptionService } from '@/services/subscriptionService';

export function Header({ setIsMobileOpen }) {
  const { user, business, role, displayRole, logout, updateBusiness } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  const fetchRealNotifications = async () => {
    // If business subscription is restricted/pending, skip fetching stock warnings to avoid 402 errors
    const isRestricted = business?.subscription_status === 'EXPIRED' ||
                         business?.subscription_status === 'CANCELLED' ||
                         (business?.subscription_status === 'PENDING' && business?.license_status !== 'ACTIVE');

    if (isRestricted) {
      setIsLoadingNotifs(false);
      return;
    }

    setIsLoadingNotifs(true);
    try {
      const [emailLogsRes, lowStockRes] = await Promise.all([
        emailService.getEmailLogs({ limit: 10 }).catch(() => ({ data: [] })),
        stockService.getLowStock().catch(() => ({ data: [] }))
      ]);

      const logs = emailLogsRes?.data || [];
      const lowStockItems = lowStockRes?.data || (Array.isArray(lowStockRes) ? lowStockRes : []);

      const notifList = [];

      // 1. Transform real low stock warnings
      lowStockItems.forEach((item) => {
        notifList.push({
          id: `low-${item.id}`,
          title: `Low Stock Alert: ${item.name || item.product_name || 'Product'}`,
          message: `Current stock is ${item.stockQuantity || item.quantity || 0} ${item.unit || 'PCS'}. Warning threshold set to ${item.lowStockWarning || 5} ${item.unit || 'PCS'}.`,
          type: 'LOW_STOCK',
          time: 'Action Required',
          read: false
        });
      });

      // 2. Transform real transaction dispatches & email logs
      logs.forEach((log) => {
        notifList.push({
          id: `log-${log.id}`,
          title: `${log.email_type === 'SALE_INVOICE' ? 'Sale Invoice Dispatched' : log.email_type === 'CUSTOMER_PAYMENT' ? 'Payment Receipt Dispatched' : 'Notification Dispatched'}: ${log.reference_number || log.recipient_email}`,
          message: `Sent to ${log.recipient_email} (${log.status || 'SENT'})`,
          type: log.status === 'FAILED' ? 'LOW_STOCK' : 'SALE_CONFIRMED',
          time: new Date(log.created_at || log.sent_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          read: true
        });
      });

      setNotifications(notifList);
    } catch (err) {
      // If subscription is pending or restricted, don't spam console with 402 errors
      if (err.status !== 402 && err.response?.status !== 402) {
        console.error('Failed to fetch real notifications:', err);
      }
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
  }, [business?.subscription_status, business?.license_status]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkSingleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Subscription indicator state (ADMIN only)
  const [subStatusData, setSubStatusData] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (role === 'ADMIN') {
      setLoadingSub(true);
      subscriptionService.getMyStatus()
        .then((res) => {
          if (!isMounted) return;
          const data = res?.data || res;
          setSubStatusData(data);
          if (data?.company && updateBusiness) {
            updateBusiness({
              subscription_status: data.company.subscription_status,
              license_status: data.company.license_status,
              self_shopping_status: data.company.self_shopping_status,
              subscription_tier: data.access?.tier || data.access_policy?.access_tier || 'STARTER',
              subscription_allowed: data.access?.allowed !== undefined ? data.access.allowed : (data.access_policy?.can_access_application !== undefined ? data.access_policy.can_access_application : true)
            });
          }
        })
        .catch((err) => {
          // If non-admin or error, fail silently without breaking header
          console.debug('Subscription status fetch error:', err?.message);
        })
        .finally(() => {
          if (isMounted) setLoadingSub(false);
        });
    } else {
      setSubStatusData(null);
    }

    return () => {
      isMounted = false;
    };
  }, [role, business?.subscription_status]);

  // Compute accurate subscription badge label and styling for ADMIN
  const getSubscriptionBadge = () => {
    if (!subStatusData) return null;

    const access = subStatusData.access || {};
    const subscription = subStatusData.subscription;
    const company = subStatusData.company;

    // Use access status as authoritative policy state, falling back to subscription status
    const status = access.status || subscription?.status || company?.subscription_status;
    const now = new Date();

    // Helper to calculate whole days remaining accurately from an expiry date
    const computeDaysLeft = (targetDateStr) => {
      if (!targetDateStr) return null;
      const targetDate = new Date(targetDateStr);
      if (isNaN(targetDate.getTime())) return null;
      const msDiff = targetDate.getTime() - now.getTime();
      if (msDiff <= 0) return 0;
      return Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    };

    // 1. 7-Day Free Trial
    if (status === 'TRIALING' || access.isTrial) {
      const trialEndDate = access.trialEnd || subscription?.trial_end_at || subscription?.current_period_end;
      const days = typeof access.daysRemaining === 'number' ? access.daysRemaining : computeDaysLeft(trialEndDate);
      if (days === 0 || days === null) {
        return {
          label: 'Free Trial · Expired',
          variant: 'rose',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
          title: 'Your 7-day free trial has expired'
        };
      }
      return {
        label: `Free Trial · ${days} ${days === 1 ? 'day' : 'days'} left`,
        variant: 'indigo',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs',
        title: `Free Trial active until ${trialEndDate ? new Date(trialEndDate).toLocaleDateString() : 'period end'}`
      };
    }

    // 2. Active Subscription
    if (status === 'ACTIVE') {
      const expiryDate = subscription?.current_period_end || subscription?.next_billing_date;
      const days = computeDaysLeft(expiryDate);
      if (typeof days === 'number' && days > 0) {
        return {
          label: `Subscribed · Ends in ${days} ${days === 1 ? 'day' : 'days'}`,
          variant: days <= 5 ? 'amber' : 'emerald',
          className: days <= 5
            ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs',
          title: expiryDate ? `Active subscription · Renews/Ends on ${new Date(expiryDate).toLocaleDateString()}` : 'Subscription Active'
        };
      }
      return {
        label: 'Subscription Active',
        variant: 'emerald',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs',
        title: expiryDate ? `Active · Renews on ${new Date(expiryDate).toLocaleDateString()}` : 'Active Subscription'
      };
    }

    // 3. Cancellation Scheduled (Active until cycle ends)
    if (status === 'CANCELLATION_SCHEDULED' || status === 'CANCELLED_ACTIVE') {
      const expiryDate = access.effectiveDate || subscription?.effective_cancellation_date || subscription?.current_period_end;
      const days = computeDaysLeft(expiryDate);
      if (typeof days === 'number' && days > 0) {
        return {
          label: `Cancels in ${days} ${days === 1 ? 'day' : 'days'}`,
          variant: 'amber',
          className: 'bg-amber-50 text-amber-800 border-amber-200',
          title: `Access ends on ${new Date(expiryDate).toLocaleDateString()}`
        };
      }
      return {
        label: 'Subscription Expired',
        variant: 'rose',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        title: 'Cancelled and period ended'
      };
    }

    // 4. Grace Period (Renewal Due / Payment Failed)
    if (access.gracePeriodActive || status === 'PAST_DUE' || status === 'PAYMENT_FAILED') {
      const days = typeof access.daysRemaining === 'number' ? access.daysRemaining : computeDaysLeft(access.graceDeadline || subscription?.grace_period_deadline);
      if (typeof days === 'number' && days > 0) {
        return {
          label: `Renewal Due · ${days} ${days === 1 ? 'day' : 'days'} grace`,
          variant: 'orange',
          className: 'bg-orange-50 text-orange-800 border-orange-200 animate-pulse',
          title: 'Payment renewal pending. Grace period active.'
        };
      }
      return {
        label: 'Payment Required',
        variant: 'rose',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        title: 'Subscription payment overdue'
      };
    }

    // 5. Payment Pending
    if (status === 'PENDING' || status === 'PAYMENT_PENDING') {
      return {
        label: 'Payment Pending',
        variant: 'blue',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        title: 'Subscription authorization pending'
      };
    }

    // 6. Suspended
    if (status === 'SUSPENDED') {
      return {
        label: 'Subscription Suspended',
        variant: 'rose',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        title: 'Account suspended'
      };
    }

    // 7. Cancelled
    if (status === 'CANCELLED') {
      return {
        label: 'Subscription Cancelled',
        variant: 'slate',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
        title: 'Subscription is cancelled'
      };
    }

    // 8. Expired or No Subscription
    if (status === 'EXPIRED' || status === 'NO_SUBSCRIPTION') {
      return {
        label: 'Subscription Expired',
        variant: 'rose',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        title: 'Subscription expired. Please subscribe to renew.'
      };
    }

    return null;
  };

  const subBadge = role === 'ADMIN' ? getSubscriptionBadge() : null;

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Business Context & Logo Badge */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <Badge variant="indigo" className="inline-flex shrink-0">
          {business?.business_type || 'GARMENT_TEXTILE'}
        </Badge>

        {/* Subscription Status Indicator (Strictly ADMIN only) */}
        {role === 'ADMIN' && subBadge && (
          <Link
            href="/settings/subscription"
            title={subBadge.title}
            className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all hover:opacity-90 ${subBadge.className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5 shrink-0" />
            <span className="truncate max-w-[200px] md:max-w-none">{subBadge.label}</span>
          </Link>
        )}
      </div>

      {/* Right: Quick Billing Action, Notifications & User Menu */}
      <div className="flex items-center space-x-3">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors relative"
            title="Notifications & Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotificationOpen && (
            <>
              <div
                onClick={() => setIsNotificationOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-[calc(100vw-1rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 flex items-start justify-between gap-3 text-xs transition ${
                          n.read ? 'bg-white opacity-70' : 'bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            n.type === 'LOW_STOCK' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {n.type === 'LOW_STOCK' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs leading-snug">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">{n.time}</span>
                          </div>
                        </div>

                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkSingleRead(n.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    View All Notifications →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <Link href="/sales/quick" target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            New Sale
          </Button>
        </Link>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-sm">
              {(user?.name || user?.full_name || 'Admin User')?.[0]?.toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">{user?.name || user?.full_name || 'Admin User'}</span>
              <span className="text-[10px] text-slate-500 font-medium capitalize">{displayRole}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                onClick={() => setIsDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] max-w-xs sm:w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{user?.name || user?.full_name || 'Admin User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      ROLE: {displayRole}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Building className="w-4 h-4 mr-2 text-slate-400" />
                    Business Settings
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
