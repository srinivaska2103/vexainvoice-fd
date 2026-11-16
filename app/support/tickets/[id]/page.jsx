'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ticket,
  ArrowLeft,
  Calendar,
  Clock,
  Send,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Lock,
  User,
  ShieldAlert
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { useToast } from '@/context/ToastContext';
import { getRolePath } from '@/lib/permissions';

export default function TicketDetailPage({ params: propParams }) {
  const router = useRouter();
  const rawParams = useParams() || propParams;
  const ticketId = rawParams?.id || (Array.isArray(rawParams?.subpath) ? rawParams.subpath[2] : null);

  const { user, role, business } = useAuth();
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;
  const { toastSuccess, toastError, confirm } = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadTicketDetails = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await supportService.getTicketDetails(ticketId);
      const data = res?.data !== undefined ? res.data : res;
      setTicket(data);
    } catch (err) {
      console.error('Failed to load ticket:', err);
      toastError(err.message || 'Ticket not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketDetails();
  }, [ticketId]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setReplyAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            base64Data: uploadEvent.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      await supportService.replyTicket(ticketId, {
        message: replyMessage.trim(),
        attachments: replyAttachments
      });
      toastSuccess('Reply dispatched to support team.');
      setReplyMessage('');
      setReplyAttachments([]);
      await loadTicketDetails();
    } catch (err) {
      toastError(err.message || 'Failed to send reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    const isConfirmed = await confirm({
      title: 'Confirm Resolution & Close Ticket?',
      message: 'Are you satisfied that this issue has been resolved? You can close this ticket now.',
      confirmText: 'Yes, Close Ticket',
      cancelText: 'Keep Open'
    });

    if (isConfirmed) {
      try {
        await supportService.closeTicket(ticketId);
        toastSuccess('Ticket marked as closed.');
        await loadTicketDetails();
      } catch (err) {
        toastError(err.message || 'Failed to close ticket.');
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
            <p className="text-xs">Loading Ticket Conversation...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!ticket) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Support Ticket Unavailable</h2>
            <p className="text-xs text-slate-500">You may not have permission to view this ticket or it does not exist.</p>
            <Link
              href={getRolePath(role, userRoleSlug, 'support/tickets')}
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tickets</span>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          {/* Top Breadcrumb & Status Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href={getRolePath(role, userRoleSlug, 'support/tickets')}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Support Tickets</span>
            </Link>

            {ticket.status !== 'CLOSED' && (
              <button
                type="button"
                onClick={handleCloseTicket}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
              >
                Mark Ticket as Resolved
              </button>
            )}
          </div>

          {/* Ticket Overview Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {ticket.ticket_number}
                </span>
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {ticket.status}
                </span>
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                  ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {ticket.priority} Priority
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Created {new Date(ticket.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {ticket.subject}
            </h1>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 block">Initial Issue Description:</span>
              <p className="whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>

            {/* Original Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-600 block mb-2">Original Attachments:</span>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={supportService.getAttachmentDownloadUrl(att.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-xs text-slate-700 font-semibold shadow-2xs transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>{att.file_name}</span>
                      <Download className="w-3 h-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Conversation & Support Updates</h2>

            {ticket.messages && ticket.messages.length > 0 ? (
              <div className="space-y-4">
                {ticket.messages.map((msg) => {
                  const isStaff = msg.sender_type === 'ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`p-5 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                        isStaff
                          ? 'bg-blue-50/50 border-blue-200/80 ml-4 sm:ml-8'
                          : 'bg-white border-slate-200 mr-4 sm:mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isStaff ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isStaff ? 'VT' : 'ME'}
                          </div>
                          <span className="font-bold text-slate-900">{msg.sender_name}</span>
                          {isStaff && (
                            <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                              VEXA TECH
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(msg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-800">{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
                Our support team is reviewing your ticket. You will receive an email and notification when a response is posted.
              </div>
            )}
          </div>

          {/* Reply Form (If Not Closed) */}
          {ticket.status !== 'CLOSED' ? (
            <form onSubmit={handleSendReply} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Reply to Support Team</h3>
              <textarea
                required
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type additional information or reply to the support staff..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Attach additional screenshots / evidence</span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submittingReply || !replyMessage.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Reply</span>
                </button>
              </div>

              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {replyAttachments.map((att, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                      {att.fileName}
                    </span>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-100 text-center text-xs text-slate-500 font-medium">
              This ticket is officially closed. If you need assistance with a new question, please raise a new ticket.
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

