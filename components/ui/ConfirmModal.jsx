'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="text-center pt-2 pb-1 space-y-4">
        {/* Animated Warning Icon Header */}
        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
          isDanger 
            ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-500/10 ring-4 ring-rose-50' 
            : 'bg-amber-50 text-amber-600 border border-amber-100 shadow-amber-500/10 ring-4 ring-amber-50'
        }`}>
          {isDanger ? (
            <Trash2 className="w-7 h-7 stroke-[2.2]" />
          ) : (
            <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 text-xs font-extrabold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl text-white shadow-md transition-all ${
              isDanger
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/25'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25'
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
