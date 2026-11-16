'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  Trash2, 
  HelpCircle,
  AlertOctagon
} from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Toast notifier
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toastSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const toastError = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  const toastInfo = useCallback((msg) => showToast(msg, 'info'), [showToast]);
  const toastWarning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);

  // Modern Confirmation Modal Replacement for `window.confirm()`
  const confirm = useCallback(({
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve: (value) => {
          setConfirmDialog(null);
          resolve(value);
        }
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toastSuccess, toastError, toastWarning, toastInfo, confirm }}>
      {children}

      {/* Modern Toast Messages Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-100'
                : t.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : t.type === 'error' ? (
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
              ) : t.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span className="text-xs font-semibold leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white p-1 ml-2 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modern Alert & Confirmation Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {confirmDialog.type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmDialog.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => confirmDialog.resolve(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.resolve(true)}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
