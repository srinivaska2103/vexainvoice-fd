'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  User,
  ShieldCheck,
  Mail,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  KeyRound,
  MapPin,
  Image as ImageIcon,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  QrCode
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import ShopQrModal from '@/components/shop/ShopQrModal';

import { authService } from '@/services/authService';

export default function SettingsPage() {
  const { user, business, updateBusiness, updateUser } = useAuth();
  const { toastSuccess, toastError } = useToast();

  // Business Info Form State
  const [businessName, setBusinessName] = useState(business?.business_name || 'Sai Textiles');
  const [gstin, setGstin] = useState(business?.gstin || '');
  const [phone, setPhone] = useState(business?.phone || '+91 9876543210');
  const [address, setAddress] = useState(business?.address || '123 Textile Market, Main Road, Surat, Gujarat - 395002');
  const [logoPreview, setLogoPreview] = useState(business?.logo || '/logo.png');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Sync state if business changes
  useEffect(() => {
    if (business) {
      if (business.business_name) setBusinessName(business.business_name);
      if (business.gstin) setGstin(business.gstin);
      if (business.phone) setPhone(business.phone);
      if (business.address) setAddress(business.address);
      if (business.logo) setLogoPreview(business.logo);
    }
  }, [business]);

  // Change Email Form State
  const [currentEmail, setCurrentEmail] = useState(user?.email || 'srinivaska2103@gmail.com');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Sync user email
  useEffect(() => {
    if (user?.email) {
      setCurrentEmail(user.email);
    }
  }, [user]);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Business Info Save Feedback
  const [businessSuccess, setBusinessSuccess] = useState('');

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Logo = reader.result;
        setLogoPreview(base64Logo);
        updateBusiness({ logo: base64Logo });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setBusinessSuccess('');
    try {
      const payload = {
        business_name: businessName,
        gst_number: gstin,
        phone,
        address,
        logo_url: logoPreview
      };
      await authService.updateBusiness(payload);
      updateBusiness({
        business_name: businessName,
        gstin,
        phone,
        address,
        logo: logoPreview
      });
      toastSuccess('Business details and logo saved successfully!');
      setBusinessSuccess('Business details and logo saved to database successfully!');
      setTimeout(() => setBusinessSuccess(''), 3500);
    } catch (err) {
      toastError(err.message || 'Failed to save business info');
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Please enter a valid new email address.');
      return;
    }
    if (!emailPassword) {
      setEmailError('Please enter your current password to confirm email change.');
      return;
    }
    setEmailLoading(true);
    try {
      await authService.updateProfile({
        email: newEmail.trim(),
        current_password: emailPassword
      });
      const updatedEmailVal = newEmail.trim();
      updateUser({ email: updatedEmailVal });
      setCurrentEmail(updatedEmailVal);
      setNewEmail('');
      setEmailPassword('');
      setEmailSuccess('Email address updated in database successfully!');
      setTimeout(() => setEmailSuccess(''), 3500);
    } catch (err) {
      setEmailError(err.message || 'Failed to update email address.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      await authService.updateProfile({
        current_password: currentPassword,
        new_password: newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassSuccess('Password updated in database successfully! You can now log in with your new password.');
      setTimeout(() => setPassSuccess(''), 3500);
    } catch (err) {
      setPassError(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <ProtectedRoute permissions={['settings.view']}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Settings className="w-5 h-5" />
                </div>
                <span>Business & Profile Settings</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage business information, company logo, address, account email, and customer catalogue QR code.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQrModalOpen(true)}
              className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold shadow-xs shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4 mr-2 text-indigo-600" />
              Catalogue QR Code
            </Button>
          </div>

          {/* 1. BUSINESS INFO & LOGO CARD */}
          <form onSubmit={handleSaveBusiness} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Business Profile & Logo</span>
            </h2>

            {businessSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{businessSuccess}</span>
              </div>
            )}

            {/* Logo Upload Row */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs flex items-center justify-center shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Business Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <h3 className="text-xs font-bold text-slate-900">Upload Business Logo</h3>
                <p className="text-[11px] text-slate-500">
                  Recommended PNG or JPG file with transparent background. Appears on printed invoices & receipts.
                </p>
                <div className="pt-1 flex items-center space-x-3 justify-center sm:justify-start">
                  <label className="cursor-pointer inline-flex items-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('');
                        updateBusiness({ logo: '' });
                      }}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Type
                </label>
                <input
                  type="text"
                  readOnly
                  value={business?.business_type || 'GARMENT_TEXTILE'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-blue-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 36AABCU9603R1ZM"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Business Full Address</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Street Address, City, State, Zip code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm">
                <Save className="w-4 h-4 mr-1.5" />
                Save Business Info & Logo
              </Button>
            </div>
          </form>

          {/* 2. CHANGE EMAIL CARD */}
          <form onSubmit={handleChangeEmail} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Change Email Address</span>
            </h2>

            {emailSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{emailError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Email
                </label>
                <input
                  type="email"
                  readOnly
                  value={currentEmail}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Email Address *
                </label>
                <input
                  type="email"
                  placeholder="enter.new@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <input
                  type="password"
                  placeholder="Confirm with password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isLoading={emailLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
              >
                Update Email Address
              </Button>
            </div>
          </form>

          {/* 3. CHANGE PASSWORD CARD */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Change Password</span>
            </h2>

            {passSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isLoading={passLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
              >
                Update Password
              </Button>
            </div>
          </form>

          {/* 4. USER PROFILE OVERVIEW CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>User Profile Overview</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wider">User Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.full_name || 'Admin User'}</span>
              </div>

              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wider">Account Email</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{currentEmail}</span>
              </div>

              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wider">Role & Permissions</span>
                <span className="inline-flex items-center mt-1 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {user?.custom_role?.name || user?.display_role || user?.displayRole || (user?.role ? user.role.replace(/_/g, ' ') : 'ADMIN')}
                </span>
              </div>
            </div>
          </div>

          {/* Shop Catalogue QR Modal */}
          <ShopQrModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            shopSlug={business?.company_id || 'sai-textiles'}
            businessName={business?.business_name || 'Sai textiles'}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
