'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  CheckCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import { emailService } from '@/services/emailService';
import { stockService } from '@/services/stockService';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [notificationsList, setNotificationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealNotifications = async () => {
    setIsLoading(true);
    try {
      const [emailLogsRes, lowStockRes] = await Promise.all([
        emailService.getEmailLogs({ limit: 50 }),
        stockService.getLowStock()
      ]);

      const logs = emailLogsRes?.data || [];
      const lowStockItems = lowStockRes?.data || (Array.isArray(lowStockRes) ? lowStockRes : []);

      const notifList = [];

      // 1. Add real low stock alerts
      lowStockItems.forEach((item) => {
        notifList.push({
          id: `low-${item.id}`,
          title: `Low Stock Alert: ${item.name || item.product_name || 'Product'}`,
          message: `Current inventory count is ${item.stockQuantity || item.quantity || 0} ${item.unit || 'PCS'}. Warning threshold is set to ${item.lowStockWarning || 5} ${item.unit || 'PCS'}.`,
          type: 'LOW_STOCK',
          time: 'Action Required',
          read: false
        });
      });

      // 2. Add real email notification dispatches
      logs.forEach((log) => {
        notifList.push({
          id: `log-${log.id}`,
          title: `${log.email_type === 'SALE_INVOICE' ? 'Sale Invoice Email Dispatched' : log.email_type === 'CUSTOMER_PAYMENT' ? 'Payment Advice Dispatched' : 'Notification Dispatched'}: ${log.reference_number || log.recipient_email}`,
          message: `Dispatched to ${log.recipient_email} - Status: ${log.status || 'SENT'}`,
          type: log.status === 'FAILED' ? 'LOW_STOCK' : 'SALE_CONFIRMED',
          time: new Date(log.created_at || log.sent_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          read: true
        });
      });

      setNotificationsList(notifList);
    } catch (err) {
      console.error('Failed to fetch real notifications:', err);
      toastError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
  }, []);

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    toastSuccess('All notifications marked as read.');
  };

  const handleMarkSingleRead = (id) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <ProtectedRoute permissions={['notifications.view']}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span>Notifications & System Alerts</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                View low-stock warnings, sale invoice dispatches, payment confirmations, and system alerts.
              </p>
            </div>

            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              className="w-full sm:w-auto justify-center text-xs font-bold border-slate-300 py-2.5 rounded-xl whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
              <span>Mark All as Read</span>
            </Button>
          </div>

          {/* Notifications List */}
          <Card className="p-0 bg-white border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-16 text-center">
                <Spinner size="lg" className="text-blue-600 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading system alerts & dispatches...</p>
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-xs font-bold">No notifications available</p>
              </div>
            ) : (
              notificationsList.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition ${
                    n.read ? 'bg-white' : 'bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-amber-50 text-amber-600 border border-amber-100">
                      {n.type === 'LOW_STOCK' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <span>{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                        )}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                      <span className="text-[10.5px] font-medium text-slate-400 mt-1.5 block flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {n.time}
                      </span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(n.id)}
                      className="text-xs text-purple-600 hover:underline font-semibold shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
