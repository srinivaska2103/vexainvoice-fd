'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Eye,
  Mail,
  Calendar,
  UserCheck,
  Tag
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import { emailService } from '@/services/emailService';

export default function CampaignsPage() {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [campaignsList, setCampaignsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campName, setCampName] = useState('');
  const [audienceType, setAudienceType] = useState('ALL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // View Details Modal
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await emailService.getCampaigns();
      if (Array.isArray(res)) {
        setCampaignsList(res);
      } else if (res && res.success) {
        setCampaignsList(res.data || []);
      } else if (res && Array.isArray(res.data)) {
        setCampaignsList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      toastError(err.message || 'Failed to load marketing campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!campName.trim() || !subject.trim()) {
      toastError('Campaign Name and Subject line are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: campName.trim(),
        audienceType: audienceType || 'ALL',
        audience: 'All Registered Customers',
        subject: subject.trim(),
        message: message.trim(),
        recipientsCount: 145,
        status: 'Sent',
        createdBy: user?.name || 'Admin'
      };

      const res = await emailService.createCampaign(payload);
      if (res && res.success) {
        toastSuccess(`Marketing campaign "${campName.trim()}" created and dispatched!`);
        setIsModalOpen(false);
        setCampName('');
        setSubject('');
        setMessage('');
        fetchCampaigns();
      }
    } catch (err) {
      toastError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCampaigns = campaignsList.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.audience || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute permissions={['campaigns.view', 'campaigns.create', 'campaigns.send']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
          {/* Top Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Megaphone className="w-6 h-6" />
                </div>
                <span>Customer Marketing Campaigns</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Create and dispatch promotional email offers, festival discounts, and textile stock updates to your customer base.
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Campaign
            </Button>
          </div>

          {/* Search Card */}
          <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
            <Input
              placeholder="Search campaigns by name, audience or subject..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md text-xs"
            />
          </Card>

          {/* Campaigns Table */}
          <Card className="p-0 bg-white border-slate-200/80 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center">
                <Spinner size="lg" className="text-blue-600 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading marketing campaigns...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No campaigns found"
                description="Launch promotional email dispatches to reach your wholesale and retail customers."
                actionLabel="Launch First Campaign"
                onAction={() => setIsModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Campaign Name</th>
                      <th className="py-3.5 px-4">Target Audience</th>
                      <th className="py-3.5 px-4">Recipients</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Dispatch Date</th>
                      <th className="py-3.5 px-4">Created By</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{c.audience || (c.channel && c.channel !== 'Email' ? c.channel : 'All Registered Customers')}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-700">{c.recipientsCount || c.sentCount || 0} customers</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {c.status || 'Sent'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{c.date || new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{c.createdBy || 'Admin'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCampaign(c);
                              setIsDetailModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs active:scale-95 cursor-pointer ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* VIEW DETAILS MODAL */}
          {selectedCampaign && (
            <Modal
              isOpen={isDetailModalOpen}
              onClose={() => setIsDetailModalOpen(false)}
              title="Campaign Broadcast Details"
              maxWidth="max-w-lg"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-700 font-bold uppercase">{selectedCampaign.id}</span>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {selectedCampaign.status || 'Sent'}
                    </Badge>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedCampaign.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Target Audience</span>
                    <p className="font-semibold text-slate-800">{selectedCampaign.audience || (selectedCampaign.channel && selectedCampaign.channel !== 'Email' ? selectedCampaign.channel : 'All Registered Customers')}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Dispatched Recipients</span>
                    <p className="font-bold text-blue-700">{selectedCampaign.recipientsCount || selectedCampaign.sentCount || 0} Customers</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Dispatch Date</span>
                    <p className="font-medium text-slate-700 font-mono">{selectedCampaign.date || new Date(selectedCampaign.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Initiated By</span>
                    <p className="font-semibold text-slate-800">{selectedCampaign.createdBy || 'Admin'}</p>
                  </div>
                </div>

                {selectedCampaign.subject && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Subject Line</span>
                    <p className="font-semibold text-slate-900 text-xs">{selectedCampaign.subject}</p>
                  </div>
                )}

                {selectedCampaign.message && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Message Body Snippet</span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200/70">
                      {selectedCampaign.message}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* CREATE CAMPAIGN MODAL */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Create & Send Customer Campaign"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              <Input
                label="Campaign Name *"
                required
                placeholder="e.g. Festival Special Discount Offer"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
              />

              <Select
                label="Target Audience *"
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Registered Customers' }
                ]}
              />

              <Input
                label="Email Subject Line *"
                required
                placeholder="Exclusive 10% Discount on New Textile Orders!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campaign Message Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter message text for your customers..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  <Send className="w-4 h-4 mr-1.5" />
                  Send Campaign Now
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

