'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ChevronRight,
  UserCheck,
  Search,
  Loader2,
  Crown,
  Briefcase,
  ShoppingCart,
  Boxes,
  Calculator,
  Star,
  Shield
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
import { useToast } from '@/context/ToastContext';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';

export default function UsersSettingsPage() {
  const { user } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null when adding new
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState('BILLING_STAFF');
  const [statusInput, setStatusInput] = useState('Active');

  const [customRoles, setCustomRoles] = useState([]);
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState('');

  const loadUsersAndRoles = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.allSettled([
        userService.getUsers(),
        roleService.getRoles()
      ]);

      if (uRes.status === 'fulfilled' && uRes.value) {
        const val = uRes.value;
        setUsersList(val.data || (Array.isArray(val) ? val : []));
      }
      if (rRes.status === 'fulfilled' && rRes.value) {
        const rVal = rRes.value;
        setCustomRoles(rVal.data || (Array.isArray(rVal) ? rVal : []));
      }
    } catch (err) {
      console.error('Failed to load team users:', err);
      toastError(err.message || 'Failed to fetch team users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndRoles();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setNameInput('');
    setEmailInput('');
    setPasswordInput('');
    setPhoneInput('');
    setRoleInput('BILLING_STAFF');
    setSelectedCustomRoleId('');
    setStatusInput('Active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setNameInput(u.name);
    setEmailInput(u.email);
    setPasswordInput('');
    setPhoneInput(u.phone === 'N/A' ? '' : u.phone);
    setRoleInput(u.role);
    setSelectedCustomRoleId(u.custom_role_id || '');
    setStatusInput(u.status || 'Active');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userObj) => {
    if (userObj.role === 'ADMIN' || userObj.email === user?.email) {
      toastError('Cannot delete the primary ADMIN user account.');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Team User Account?',
      message: `Are you sure you want to delete user "${userObj.name}" (${userObj.email})? This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        const res = await userService.deleteUser(userObj.id);
        toastSuccess(res?.message || `User "${userObj.name}" removed successfully.`);
        await loadUsersAndRoles();
      } catch (err) {
        toastError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleSaveUserSubmit = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      toastError('Name and Email are required');
      return;
    }
    if (!editingUser && !passwordInput.trim()) {
      toastError('Password is required for new team user');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          name: nameInput.trim(),
          email: emailInput.trim(),
          phone: phoneInput.trim() || null,
          role: roleInput,
          custom_role_id: selectedCustomRoleId || null,
          status: statusInput
        };
        if (passwordInput.trim()) {
          payload.password = passwordInput.trim();
        }

        await userService.updateUser(editingUser.id, payload);
        toastSuccess(`User "${nameInput.trim()}" updated successfully!`);
      } else {
        const payload = {
          name: nameInput.trim(),
          email: emailInput.trim(),
          password: passwordInput.trim(),
          phone: phoneInput.trim() || null,
          role: roleInput,
          custom_role_id: selectedCustomRoleId || null,
          status: statusInput
        };

        await userService.createUser(payload);
        toastSuccess(`Team user "${nameInput.trim()}" created directly! Login password configured.`);
      }

      setIsModalOpen(false);
      await loadUsersAndRoles();
    } catch (err) {
      toastError(err.message || 'Failed to save team user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
          {/* Top Header */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <Link href="/settings" className="hover:text-blue-600 transition">Settings</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-600 font-bold">Team Users</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span>Users & Team Members</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage accounts, update permissions, and assign custom roles for team members accessing VEXA Invoice.
              </p>
            </div>

            <Button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 sm:py-2.5 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add User
            </Button>
          </div>

          {/* Search Bar */}
          <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
            <Input
              placeholder="Search team users by name, email, role..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md text-xs"
            />
          </Card>

          {/* Users Table */}
          <Card className="p-0 bg-white border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">User Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Email</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Phone</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Assigned Role</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[90px]">Status</th>
                    <th className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">Last Login</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="font-semibold text-xs">Loading team users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 font-medium whitespace-nowrap">
                        No team users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2 whitespace-nowrap">
                          <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="whitespace-nowrap">{u.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">{u.email}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">{u.phone || '-'}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant="indigo" className="bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase whitespace-nowrap">
                            {u.custom_role ? u.custom_role.name : (u.role ? u.role.replace('_', ' ') : 'USER')}
                          </Badge>
                          {u.custom_role && (
                            <span className="block text-[10px] text-blue-600 font-semibold mt-0.5 whitespace-nowrap">
                              Custom Role
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {u.status === 'Active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{u.lastLogin || 'Never'}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center shadow-2xs whitespace-nowrap"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1 text-blue-600" />
                              Edit User
                            </button>
                            {u.role !== 'ADMIN' && u.email !== user?.email && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition flex items-center shadow-2xs shrink-0"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ADD / EDIT USER MODAL */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingUser ? `Edit Team User: ${editingUser.name}` : 'Add New Team User Account'}
            maxWidth="max-w-md"
          >
            <form onSubmit={handleSaveUserSubmit} className="space-y-4 text-xs">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. Ramesh Kumar"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />

              <Input
                label="Email Address *"
                type="email"
                required
                placeholder="ramesh@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />

              <Input
                label={editingUser ? "Password (leave blank to keep existing)" : "Password *"}
                type="password"
                required={!editingUser}
                placeholder={editingUser ? "••••••••" : "Set account login password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />

              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />

              <Select
                label="Assign Role *"
                value={selectedCustomRoleId ? `custom_${selectedCustomRoleId}` : roleInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('custom_')) {
                    const cId = val.replace('custom_', '');
                    setSelectedCustomRoleId(cId);
                    setRoleInput('BILLING_STAFF'); // Safe base fallback role
                  } else {
                    setSelectedCustomRoleId('');
                    setRoleInput(val);
                  }
                }}
                options={[
                  { value: 'ADMIN', label: 'ADMIN (Full Business Owner Access)', icon: Crown },
                  { value: 'BILLING_STAFF', label: 'Cashier / Billing Staff', icon: ShoppingCart },
                  { value: 'MANAGER', label: 'Manager', icon: Briefcase },
                  { value: 'STOCK_STAFF', label: 'Stock Manager', icon: Boxes },
                  { value: 'ACCOUNTANT', label: 'Accountant', icon: Calculator },
                  ...(customRoles && customRoles.length > 0 ? [
                    ...customRoles.map(cr => ({
                      value: `custom_${cr.id}`,
                      label: `Custom Role: ${cr.name}`,
                      icon: Star
                    }))
                  ] : [])
                ]}
              />

              <Select
                label="Account Status *"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                options={[
                  { value: 'Active', label: 'Active Account' },
                  { value: 'Inactive', label: 'Inactive / Suspended' }
                ]}
              />

              {roleInput !== 'ADMIN' && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 text-[11px] font-medium space-y-1">
                  <span className="font-bold block">Role Access Scope:</span>
                  <p className="text-blue-700">
                    {selectedCustomRoleId ? (
                      (() => {
                        const cr = customRoles.find(c => c.id === selectedCustomRoleId);
                        const permCount = cr?.permissions?.length || 0;
                        return `${permCount} custom permissions configured (${cr?.name || 'Custom Role'})`;
                      })()
                    ) : (
                      <>
                        {roleInput === 'BILLING_STAFF' && '11 permissions enabled (GST POS, Invoices, Customers, Quotations)'}
                        {roleInput === 'MANAGER' && '28 permissions enabled (Full Sales, Stock, Reports, Campaigns)'}
                        {roleInput === 'STOCK_STAFF' && '12 permissions enabled (Products, Stock Adjustments, Purchases)'}
                        {roleInput === 'ACCOUNTANT' && '16 permissions enabled (Ledgers, Payments, Financial Reports)'}
                      </>
                    )}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 italic">
                Direct account setup — login credentials take effect immediately without sending email invite links.
              </p>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {submitting ? (
                    <span className="flex items-center space-x-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : editingUser ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
