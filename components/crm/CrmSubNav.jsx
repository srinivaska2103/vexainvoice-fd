'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck
} from 'lucide-react';

export function CrmSubNav() {
  const pathname = usePathname();

  const crmTabs = [
    { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
    { name: 'Customers', href: '/crm/customers', icon: Users },
    { name: 'Follow-ups', href: '/crm/followups', icon: CalendarCheck }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-xs mb-6 overflow-x-auto">
      <div className="flex items-center space-x-1 min-w-max">
        {crmTabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/crm' && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default CrmSubNav;
