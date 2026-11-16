'use client';

import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, HardDrive, Calendar, Clock, FileText, RotateCcw, FileSpreadsheet } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/axios';

export default function BackupRestorePage() {
  const { toastSuccess, toastError } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBackupData, setSelectedBackupData] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Revert State
  const [revertInfo, setRevertInfo] = useState({ exists: false });
  const [isReverting, setIsReverting] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);

  // Daily Backups State
  const [dailyBackups, setDailyBackups] = useState([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);
  const [isTriggeringDaily, setIsTriggeringDaily] = useState(false);

  const fetchDailyBackups = async () => {
    setIsLoadingDaily(true);
    try {
      const res = await api.get('/backup/list');
      const list = res.data || res || [];
      setDailyBackups(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch daily backups:', err);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  const fetchRevertStatus = async () => {
    try {
      const res = await api.get('/backup/revert-status');
      const data = res.data || res;
      setRevertInfo(data || { exists: false });
    } catch (err) {
      console.error('Failed to fetch revert status:', err);
    }
  };

  useEffect(() => {
    fetchDailyBackups();
    fetchRevertStatus();
  }, []);

  const handleTriggerDailyBackup = async () => {
    setIsTriggeringDaily(true);
    try {
      await api.post('/backup/trigger-daily');
      toastSuccess("Today's automatic daily backup generated successfully!");
      fetchDailyBackups();
    } catch (err) {
      toastError(err.message || 'Failed to trigger daily backup');
    } finally {
      setIsTriggeringDaily(false);
    }
  };

  const handleDownloadDailyFile = async (filename) => {
    try {
      const res = await api.get(`/backup/download/${encodeURIComponent(filename)}`, { responseType: 'blob' });
      const blob = res.data || res;
      const isXlsx = filename.endsWith('.xlsx');
      const mimeType = isXlsx
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/octet-stream';

      const fileBlob = new Blob([blob], { type: mimeType });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toastSuccess(`Daily snapshot ${filename} downloaded successfully!`);
    } catch (err) {
      toastError(err.message || 'Failed to download daily snapshot file');
    }
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Handle Export Manual Backup (JSON / .vexa)
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/backup/export', { responseType: 'blob' });
      const blob = res.data || res;
      const filename = `VEXA_Backup_${new Date().toISOString().split('T')[0]}.vexa`;

      if (typeof window !== 'undefined' && window.electronAPI?.exportBackupFile) {
        const text = await blob.text();
        const savePath = await window.electronAPI.exportBackupFile(filename);
        if (savePath) {
          const fileBlob = new Blob([text], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(fileBlob);
          a.download = filename;
          a.click();
          toastSuccess('Database Backup exported successfully to desktop!');
        }
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toastSuccess('Database Backup file downloaded successfully!');
      }
    } catch (err) {
      toastError(err.message || 'Failed to export database backup');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export Excel (.xlsx) Backup
  const handleExportExcelBackup = async () => {
    setIsExportingExcel(true);
    try {
      const res = await api.get('/backup/export?format=excel', { responseType: 'blob' });
      const blob = res.data || res;
      const filename = `VEXA_Database_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toastSuccess('Excel Backup Workbook (.xlsx) downloaded successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to export Excel backup');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handle File Selection for Restore (Strictly Excel .xlsx / .xls Only)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      toastError('Only Excel (.xlsx / .xls) backup files are supported for database restore.');
      e.target.value = '';
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        setSelectedBackupData({ fileBase64: base64, fileName: file.name, isExcel: true });
        setIsConfirmModalOpen(true);
      } catch (err) {
        toastError('Failed to read selected Excel backup file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Confirmed Restore
  const handleConfirmRestore = async () => {
    if (!selectedBackupData) return;
    setIsRestoring(true);
    try {
      await api.post('/backup/restore', selectedBackupData);
      toastSuccess('Database restored successfully! Reloading system...');
      setIsConfirmModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toastError(err.message || 'Failed to restore database backup');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Undo & Revert Last Restore
  const handleRevertRestore = async () => {
    setIsReverting(true);
    try {
      await api.post('/backup/revert');
      toastSuccess('Database reverted back to state before last restore! Reloading...');
      setIsRevertModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toastError(err.message || 'Failed to revert database restore');
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-4 sm:p-6 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 sm:p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                <Database className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">DATABASE BACKUP & RESTORE</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    Daily Auto Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Automatic daily database snapshots, manual Excel backup exports, and safe data restoration
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleTriggerDailyBackup}
              disabled={isTriggeringDaily}
              className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 sm:py-2.5 rounded-xl shadow-xs transition shrink-0"
            >
              {isTriggeringDaily ? (
                <>
                  <Spinner size="sm" className="text-white mr-1.5" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  <span>+ Create Daily Backup Now</span>
                </>
              )}
            </Button>
          </div>

          {/* SECTION 1: DAILY AUTOMATIC BACKUPS TABLE */}
          <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Automatic Daily Backups Log
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Retention: 30 Days Auto Snapshot History
              </span>
            </div>

            <div className="overflow-x-auto">
              {isLoadingDaily ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" className="text-blue-600" />
                </div>
              ) : dailyBackups.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No daily backup snapshots found yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Daily backups are generated automatically on application startup and daily schedule.
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                      <th className="p-3 whitespace-nowrap min-w-[220px]">Backup File</th>
                      <th className="p-3 whitespace-nowrap min-w-[140px]">Created Date</th>
                      <th className="p-3 whitespace-nowrap min-w-[90px]">File Size</th>
                      <th className="p-3 whitespace-nowrap min-w-[110px]">Status</th>
                      <th className="p-3 text-right whitespace-nowrap min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyBackups.map((item) => (
                      <tr key={item.filename} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-900 flex items-center space-x-2.5 whitespace-nowrap">
                          {item.filename.endsWith('.xlsx') ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-sans text-[11px] font-bold border border-emerald-200 shrink-0">
                              <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
                              EXCEL
                            </span>
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span className="truncate">{item.filename}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                          {item.formattedSize}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {item.isToday ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full inline-flex items-center border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Today's Snapshot
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full whitespace-nowrap">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDownloadDailyFile(item.filename)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition inline-flex items-center cursor-pointer shadow-2xs border border-emerald-200 whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Download Excel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* SECTION 2: REVERT LAST RESTORE SAFETY SNAPSHOT (IF AVAILABLE) */}
          {revertInfo?.exists && (
            <Card className="p-6 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-amber-100 border border-amber-200 rounded-xl text-amber-700 shrink-0 mt-0.5">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                      REVERT LAST DATABASE RESTORE
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 font-extrabold text-[10px] rounded-full uppercase">
                      Safety Snapshot Ready
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    A safety snapshot was saved automatically before your last restore on{' '}
                    <span className="font-extrabold text-amber-950">{revertInfo.formattedDate}</span>. Click revert if wrong data was uploaded.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsRevertModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition shrink-0 flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>Undo & Revert Last Restore</span>
              </Button>
            </Card>
          )}

          {/* SECTION 3: MANUAL EXPORT & RESTORE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EXPORT CARD */}
            <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-blue-600 font-extrabold text-sm uppercase">
                  <Download className="w-5 h-5" />
                  <span>EXPORT MANUAL BACKUP</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate an instant Excel backup workbook (`.xlsx`) containing all products, variants, stock transactions, sales, customer ledgers, and settings.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-1">
                  <p className="font-bold flex items-center">
                    <HardDrive className="w-3.5 h-3.5 mr-1" /> External Storage Backup
                  </p>
                  <p>Save backups safely to local hard drives, external USB pen drives, or secondary backup storage.</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleExportExcelBackup}
                disabled={isExportingExcel}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 mt-4"
              >
                {isExportingExcel ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    <span>Exporting Excel Workbook...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    <span>Download Excel (.xlsx) Backup</span>
                  </>
                )}
              </Button>
            </Card>

            {/* RESTORE CARD */}
            <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-600 font-extrabold text-sm uppercase">
                  <Upload className="w-5 h-5" />
                  <span>RESTORE DATABASE BACKUP</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Restore company database from an uploaded Excel (`.xlsx`) backup file. Excel is the only supported restore format.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                  <p className="font-bold flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Auto Safety Snapshot
                  </p>
                  <p>Restoring will overwrite current database records. A safety snapshot is automatically created so you can undo if needed.</p>
                </div>
              </div>

              <label className="w-full cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition shadow-md flex items-center justify-center space-x-2 text-xs text-center mt-4">
                  <Upload className="w-4 h-4 mr-1" />
                  <span>Select Excel Backup (.xlsx) to Restore</span>
                </div>
              </label>
            </Card>
          </div>
        </div>

        {/* CONFIRM RESTORE MODAL */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Database Restore"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-1">
            <div className="flex items-center space-x-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <ShieldAlert className="w-6 h-6 shrink-0 text-rose-600" />
              <div>
                <p className="font-extrabold text-xs">Overwrite Warning</p>
                <p className="text-[11px] mt-0.5">
                  Are you sure you want to restore database from <span className="font-bold font-mono">{selectedFileName}</span>?
                </p>
              </div>
            </div>

            {selectedBackupData && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="text-slate-500 text-[10px] font-bold uppercase">Backup Selected</p>
                <p className="font-bold text-slate-800">File Name: {selectedFileName}</p>
                <p className="text-slate-600 font-medium">Format: Excel (.xlsx) Workbook</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isRestoring ? (
                  <>
                    <Spinner size="sm" className="text-white mr-2" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Yes, Restore Database</span>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* REVERT RESTORE CONFIRMATION MODAL */}
        <Modal
          isOpen={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          title="Undo & Revert Last Database Restore"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-1">
            <div className="flex items-center space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              <RotateCcw className="w-6 h-6 shrink-0 text-amber-600" />
              <div>
                <p className="font-extrabold text-xs">Rollback Pre-Restore State</p>
                <p className="text-[11px] mt-0.5">
                  Are you sure you want to undo your last restore and bring back database records as they were on <span className="font-bold">{revertInfo?.formattedDate}</span>?
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsRevertModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRevertRestore}
                disabled={isReverting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isReverting ? (
                  <>
                    <Spinner size="sm" className="text-white mr-2" />
                    <span>Reverting...</span>
                  </>
                ) : (
                  <span>Yes, Undo & Revert</span>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
