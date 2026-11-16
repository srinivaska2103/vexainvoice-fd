'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  Link2,
  Copy,
  ExternalLink
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { MODULE_PERMISSIONS, ROLE_PRESETS } from '@/lib/permissions';
import { useToast } from '@/context/ToastContext';
import { roleService } from '@/services/roleService';

export default function RolesSettingsPage() {
  const { role, user } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();

  const INITIAL_ROLES = [
    {
      id: 'role-admin',
      name: 'ADMIN',
      description: 'Business owner with full unrestricted access to all modules and settings.',
      usersCount: 1,
      status: 'Active',
      isSystem: true,
      permissions: ROLE_PRESETS.ADMIN
    },
    {
      id: 'role-manager',
      name: 'Manager',
      description: 'Manages sales, purchases, customers, inventory, payments, and reporting.',
      usersCount: 2,
      status: 'Active',
      isSystem: false,
      permissions: ROLE_PRESETS.MANAGER
    },
    {
      id: 'role-billing',
      name: 'Cashier / Billing Staff',
      description: 'Handles customer sales billing, POS invoices, and quotations.',
      usersCount: 4,
      status: 'Active',
      isSystem: false,
      permissions: ROLE_PRESETS.BILLING_STAFF
    },
    {
      id: 'role-stock',
      name: 'Stock Manager',
      description: 'Manages products, categories, stock levels, adjustments, and purchases.',
      usersCount: 1,
      status: 'Active',
      isSystem: false,
      permissions: ROLE_PRESETS.STOCK_STAFF
    },
    {
      id: 'role-accountant',
      name: 'Accountant',
      description: 'Manages customer ledgers, supplier payments, financial ledgers, and reports.',
      usersCount: 1,
      status: 'Active',
      isSystem: false,
      permissions: ROLE_PRESETS.ACCOUNTANT
    }
  ];

  const [rolesList, setRolesList] = useState(INITIAL_ROLES);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const loadBackendRoles = async () => {
    try {
      setLoadingRoles(true);
      const res = await roleService.getRoles();
      const items = res?.data || (Array.isArray(res) ? res : []);
      if (items.length > 0) {
        setRolesList(items);
      }
    } catch (err) {
      console.warn('Using local fallback for roles', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  React.useEffect(() => {
    loadBackendRoles();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // null when creating new
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleStatus, setRoleStatus] = useState('Active');
  const [preset, setPreset] = useState('BILLING_STAFF');
  const [selectedPermissions, setSelectedPermissions] = useState(ROLE_PRESETS.BILLING_STAFF);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleStatus('Active');
    setPreset('BILLING_STAFF');
    setSelectedPermissions(ROLE_PRESETS.BILLING_STAFF);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r) => {
    setEditingRole(r);
    setRoleName(r.name);
    setRoleDescription(r.description || '');
    setRoleStatus(r.status || (r.is_active ? 'Active' : 'Inactive'));
    setPreset('');
    setSelectedPermissions(r.permissions || []);
    setIsModalOpen(true);
  };

  const handleToggleRoleStatus = async (r) => {
    if (r.name?.toUpperCase() === 'ADMIN' || r.id === 'role-admin' || r.slug === 'admin') {
      toastError('System ADMIN role cannot be deactivated.');
      return;
    }

    try {
      const nextActive = !r.is_active;
      await roleService.updateRole(r.id, {
        is_active: nextActive,
        status: nextActive ? 'Active' : 'Inactive'
      });
      toastSuccess(`Role "${r.name}" is now ${nextActive ? 'Active' : 'Deactivated'}.`);
      await loadBackendRoles();
    } catch (err) {
      toastError(err.message || 'Failed to update role status');
    }
  };

  const handleDeleteRole = async (r) => {
    if (r.name?.toUpperCase() === 'ADMIN' || r.id === 'role-admin' || r.slug === 'admin') {
      toastError('System ADMIN role cannot be deleted.');
      return;
    }

    if (r.usersCount > 0) {
      toastError(`Cannot delete role "${r.name}" because ${r.usersCount} user(s) are currently assigned to it. Please reassign the user(s) in Team Users first.`);
      return;
    }

    const isConfirmed = await confirm({
      title: `Delete Role "${r.name}"?`,
      message: `Are you sure you want to delete the "${r.name}" role? This action cannot be undone.`,
      confirmText: 'Delete Role',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await roleService.deleteRole(r.id);
        await loadBackendRoles();
        toastSuccess(`Role "${r.name}" deleted successfully.`);
      } catch (err) {
        toastError(err.message || 'Failed to delete role');
      }
    }
  };

  const handleApplyPreset = (presetName) => {
    setPreset(presetName);
    setSelectedPermissions(ROLE_PRESETS[presetName] || []);
  };

  const togglePermission = (permCode) => {
    setSelectedPermissions((prev) =>
      prev.includes(permCode) ? prev.filter((p) => p !== permCode) : [...prev, permCode]
    );
  };

  const handleCopyLoginUrl = (loginUrl) => {
    const fullUrl = `${window.location.origin}${loginUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toastSuccess('Role login URL copied to clipboard!');
  };

  const handleSaveRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toastError('Please enter a valid role name');
      return;
    }

    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          name: roleName.trim(),
          description: roleDescription.trim() || 'Custom role configured by Admin.',
          status: roleStatus,
          is_active: roleStatus === 'Active',
          permissions: selectedPermissions
        });
        toastSuccess(`Role "${roleName.trim()}" updated successfully!`);
      } else {
        await roleService.createRole({
          name: roleName.trim(),
          description: roleDescription.trim() || 'Custom role created by Admin.',
          status: roleStatus,
          is_active: roleStatus === 'Active',
          permissions: selectedPermissions
        });
        toastSuccess(`Role "${roleName.trim()}" created successfully with unique URL link!`);
      }
      await loadBackendRoles();
      setIsModalOpen(false);
    } catch (err) {
      toastError(err.message || 'Failed to save custom role');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
          {/* Top Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <Link href="/settings" className="hover:text-blue-600 transition">Settings</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-600 font-bold">Roles & Permissions</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span>Roles & Url links</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Create custom employee roles, configure module permissions, and provision unique role Url links.
              </p>
            </div>

            <Button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Role
            </Button>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesList.map((r) => {
              const isAdmin = r.name?.toUpperCase() === 'ADMIN' || r.id === 'role-admin' || r.slug === 'admin';
              const loginPath = r.login_url || (isAdmin ? '/login' : `/company/${r.slug || r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/login`);
              return (
                <Card key={r.id} className="p-5 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        <span>{r.name}</span>
                        {r.isSystem && (
                          <Badge variant="indigo" className="text-[10px] bg-slate-100 text-slate-600 font-mono">
                            System Role
                          </Badge>
                        )}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          r.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                            : 'bg-slate-100 text-slate-600 border-slate-300 text-[10px]'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                      {r.description}
                    </p>
                  </div>

                  {/* Url link Widget */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="flex items-center text-blue-700">
                        <Link2 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Dedicated Login URL:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyLoginUrl(loginPath)}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-semibold transition cursor-pointer"
                        title="Copy Login URL"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-600 truncate mr-2">
                        {loginPath}
                      </span>
                      <Link
                        href={loginPath}
                        target="_blank"
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white transition"
                        title="Open Login Page in New Tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-slate-400" /> Assigned Users:</span>
                      <span className="font-bold text-slate-900">{r.usersCount || 0} users</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" /> Enabled Permissions:</span>
                      <span className="font-bold text-blue-700">{r.permissions ? r.permissions.length : 0} enabled</span>
                    </div>

                    <div className="pt-2 flex items-center justify-end space-x-2 flex-wrap gap-y-1">
                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleToggleRoleStatus(r)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center shadow-2xs cursor-pointer ${
                            r.status === 'Active'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title={r.status === 'Active' ? 'Deactivate Role' : 'Activate Role'}
                        >
                          {r.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(r)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center shadow-2xs cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Edit Permissions
                      </button>
                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition flex items-center shadow-2xs cursor-pointer"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* CREATE / EDIT ROLE MODAL */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingRole ? `Edit Role Permissions: ${editingRole.name}` : 'Create Custom Role & Configure Permissions'}
            maxWidth="max-w-3xl"
          >
            <form onSubmit={handleSaveRoleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cashier, Senior Accountant"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Permission Preset
                  </label>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                    {['BILLING_STAFF', 'MANAGER', 'STOCK_STAFF', 'ACCOUNTANT'].map((pKey) => (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => handleApplyPreset(pKey)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition border ${
                          preset === pKey
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {pKey.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Select
                    label="Role Status"
                    value={roleStatus}
                    onChange={(e) => setRoleStatus(e.target.value)}
                    options={[
                      {
                        value: 'Active',
                        label: 'Active (Eligible users can log in)',
                        icon: CheckCircle2
                      },
                      {
                        value: 'Inactive',
                        label: 'Inactive (Portal and access suspended)',
                        icon: XCircle
                      }
                    ]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe what responsibilities this role handles..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Module Permissions Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Module Access Permissions ({selectedPermissions.length} selected)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermissions.length > 0) {
                        setSelectedPermissions([]);
                      } else {
                        setSelectedPermissions(ROLE_PRESETS.ADMIN);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {selectedPermissions.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
                  {Object.entries(MODULE_PERMISSIONS).map(([groupKey, groupObj]) => (
                    <div key={groupKey} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">{groupKey.replace('_', ' ')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(groupObj).map(([key, val]) => {
                          const isChecked = selectedPermissions.includes(val);
                          return (
                            <label
                              key={val}
                              className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition border text-xs font-medium ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(val)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate">{key.replace('_', ' ')}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20">
                  {editingRole ? 'Save Permissions' : 'Create Role'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
