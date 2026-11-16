import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  return <Loader2 className={cn('animate-spin text-indigo-600', sizes[size], className)} />;
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
