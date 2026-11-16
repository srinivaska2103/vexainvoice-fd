import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  title = 'No records found',
  description = 'Get started by creating a new entry.',
  actionLabel,
  onAction,
  icon: Icon = PackageOpen
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="p-3 bg-white rounded-full shadow-xs mb-3 text-slate-400">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
