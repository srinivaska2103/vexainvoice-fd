'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Building2,
  Phone,
  Key,
  HelpCircle,
  AlertTriangle,
  Lock,
  PlusCircle,
  LogOut
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { whatsappService } from '@/services/whatsappService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsWhatsAppConnectionPage() {
  const { toastSuccess, toastError } = useToast();
  const { user } = useAuth();

  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Connection form inputs
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [verifiedName, setVerifiedName] = useState(user?.business_name || '');
  const [accessToken, setAccessToken] = useState('');

  // Test message input
  const [recipientPhone, setRecipientPhone] = useState('');
  const [testResult, setTestResult] = useState(null);

  const fetchConnection = async () => {
    setIsLoading(true);
    try {
      const res = await whatsappService.getConnection();
      setConnection(res.data || res);
    } catch (err) {
      toastError(err.message || 'Failed to fetch WhatsApp connection status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumberId || !displayPhoneNumber || !accessToken) {
      toastError('Phone Number ID, Display Phone Number, and Access Token are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await whatsappService.connectAccount({
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
        verifiedName: verifiedName || user?.business_name || 'Business Account',
        accessToken
      });

      toastSuccess('WhatsApp Business Account connected successfully!');
      setIsConnectOpen(false);
      // Reset sensitive fields
      setAccessToken('');
      fetchConnection();
    } catch (err) {
      toastError(err.message || 'Connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!recipientPhone) {
      toastError('Please enter a recipient phone number');
      return;
    }

    setIsSubmitting(true);
    setTestResult(null);
    try {
      const res = await whatsappService.sendTestMessage(recipientPhone);
      setTestResult(res);
      toastSuccess(`Test message sent successfully!`);
    } catch (err) {
      toastError(err.message || 'Failed to send test message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp Business? Automated invoice messages and campaigns will stop.')) return;

    setIsDisconnecting(true);
    try {
      await whatsappService.disconnectAccount();
      toastSuccess('WhatsApp Business Account disconnected.');
      fetchConnection();
    } catch (err) {
      toastError(err.message || 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <MessageSquare className="w-4 h-4" />
                <span>Multi-Company WhatsApp Infrastructure</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Business Settings</h1>
              <p className="text-slate-500 text-xs mt-1">
                Connect your business&apos;s WhatsApp account to send invoices, receipts, return confirmations, and marketing campaigns.
              </p>
            </div>
            <Button size="xs" variant="secondary" onClick={fetchConnection} isLoading={isLoading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-bold">
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Refresh Status
            </Button>
          </div>

          {/* Connection Status Card */}
          <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Company WhatsApp Connection State</span>
              </h3>
              {connection?.isConnected ? (
                <Badge variant="emerald" className="font-bold">
                  ● CONNECTED
                </Badge>
              ) : (
                <Badge variant="rose" className="font-bold">
                  ○ NOT CONNECTED
                </Badge>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <Spinner size="lg" className="mx-auto text-indigo-600" />
              </div>
            ) : connection?.isConnected ? (
              <div className="space-y-6">
                {/* Connected Info Panel */}
                <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                        WA
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{connection.businessName}</h4>
                        <p className="text-xs font-mono font-bold text-emerald-800">{connection.displayPhoneNumber}</p>
                      </div>
                    </div>
                    <Badge variant="emerald" className="font-bold text-xs">
                      Active Sender
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-emerald-200/60 font-medium">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Meta Phone Number ID</span>
                      <span className="font-mono text-slate-900 font-bold">{connection.phoneNumberId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Security Token</span>
                      <span className="font-mono text-slate-600 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" /> AES-256 Encrypted on Server
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enabled Capabilities */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Invoices ON</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Returns ON</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Receipts ON</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Campaigns ON</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                  <Button type="button" onClick={() => setIsTestOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Send Test Message
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsConnectOpen(true)} className="text-xs font-bold border-slate-300">
                    Replace Credentials
                  </Button>
                  <Button type="button" variant="secondary" isLoading={isDisconnecting} onClick={handleDisconnect} className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50">
                    <LogOut className="w-3.5 h-3.5 mr-1.5" /> Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="text-sm font-extrabold text-slate-900">Connect Your WhatsApp Business Account</h4>
                  <p className="text-xs text-slate-500">
                    Connect your own business phone number so your customers receive WhatsApp messages directly from your brand.
                  </p>
                </div>
                <Button type="button" onClick={() => setIsConnectOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md">
                  <PlusCircle className="w-4 h-4 mr-2" /> Connect WhatsApp Business
                </Button>
              </div>
            )}
          </Card>

          {/* Connect Account Modal */}
          {isConnectOpen && (
            <Card className="p-6 bg-white border-2 border-indigo-600 rounded-2xl shadow-xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Connect WhatsApp Business Account</h3>
                </div>
                <Button size="xs" variant="secondary" onClick={() => setIsConnectOpen(false)}>
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Business Name *</label>
                    <Input
                      type="text"
                      placeholder="e.g. Mayuri Saree"
                      value={verifiedName}
                      onChange={(e) => setVerifiedName(e.target.value)}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Display Phone Number *</label>
                    <Input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={displayPhoneNumber}
                      onChange={(e) => setDisplayPhoneNumber(e.target.value)}
                      className="text-xs font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Meta Phone Number ID *</label>
                    <Input
                      type="text"
                      placeholder="e.g. 109827364512"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      className="text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Business Account ID (WABA ID)</label>
                    <Input
                      type="text"
                      placeholder="e.g. 981273645012"
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Permanent Access Token *</label>
                  <textarea
                    rows={3}
                    placeholder="Paste Meta Permanent System User Access Token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" /> Security Note: Tokens are encrypted server-side using AES-256-GCM and never returned to the frontend.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setIsConnectOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                    Verify & Connect Account
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Test Message Modal */}
          {isTestOpen && (
            <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600" /> Send Test WhatsApp Message
                </h3>
                <Button size="xs" variant="secondary" onClick={() => setIsTestOpen(false)}>
                  Close
                </Button>
              </div>

              <form onSubmit={handleSendTestMessage} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Phone Number (with Country Code)</label>
                  <Input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="font-mono text-xs font-bold"
                  />
                </div>

                {testResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Test Message Dispatched!
                    </p>
                    <p className="text-[11px] text-emerald-800">{testResult.message}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setIsTestOpen(false)}>
                    Close
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    Dispatch Test Message
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
