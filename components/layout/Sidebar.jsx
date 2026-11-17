'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  UserCheck,
  CreditCard,
  CalendarCheck,
  Layers,
  PieChart,
  TrendingUp,
  History,
  ShoppingCart,
  ReceiptIndianRupee,
  RotateCcw,
  ScanBarcode,
  Package,
  FolderTree,
  GitFork,
  Tag,
  PackageCheck,
  PackagePlus,
  Building2,
  Wallet,
  MessageSquare,
  Bell,
  Settings,
  Printer,
  ShieldCheck,
  Mail,
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Boxes,
  ArrowLeftRight,
  SlidersHorizontal,
  Layout,
  Users,
  Lock,
  LifeBuoy,
  HelpCircle,
  TicketPlus,
  Ticket,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRoleDashboard, getRolePath } from '@/lib/permissions';
import { cn } from '@/lib/utils';

// Reliable Navigation Configuration Structure
const navigationSections = [
  {
    title: 'MAIN MENU',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.sales' },
      {
        name: 'Sales',
        key: 'sales',
        icon: ShoppingCart,
        permission: 'sales.view',
        children: [
          { name: 'Customer Orders', href: '/sales/orders', icon: Boxes, permission: 'sales.view', adminOnly: true },
          { name: 'New Sale', href: '/sales/new', icon: ShoppingCart, permission: 'sales.create' },
          { name: 'Invoices', href: '/sales', icon: ReceiptIndianRupee, permission: 'sales.view' },
          { name: 'Returns', href: '/sales/returns', icon: RotateCcw, permission: 'sales.return' },
          { name: 'Scanner', href: '/scanner', icon: ScanBarcode, permission: 'scanner.view', adminOnly: true }
        ]
      },
      {
        name: 'Customer Intelligence',
        key: 'customer',
        icon: UserCheck,
        permission: 'crm.view',
        children: [
          { name: 'Overview', href: '/crm', icon: LayoutDashboard, permission: 'crm.view' },
          { name: 'Customer Intelligence', href: '/crm/customers', icon: UserCheck, permission: 'crm.customers_view' },
          { name: 'Customer Payments', href: '/payments?type=customer', icon: CreditCard, permission: 'payments.view' },
          { name: 'Follow-ups', href: '/crm/followups', icon: CalendarCheck, permission: 'crm.followups_view' }
        ]
      },
      {
        name: 'Products',
        key: 'products',
        icon: Package,
        permission: 'products.view',
        children: [
          { name: 'Products', href: '/products', icon: Package, permission: 'products.view' },
          { name: 'Categories', href: '/categories', icon: FolderTree, permission: 'products.categories' },
          { name: 'Variants', href: '/variants', icon: GitFork, permission: 'products.variants' },
          { name: 'Barcode Labels', href: '/products/barcodes', icon: Tag, permission: 'products.view' }
        ]
      },
      {
        name: 'Suppliers',
        key: 'suppliers',
        icon: Building2,
        permission: 'suppliers.view',
        children: [
          { name: 'Suppliers', href: '/suppliers', icon: Building2, permission: 'suppliers.view' },
          { name: 'Purchases', href: '/purchases', icon: PackageCheck, permission: 'purchases.view' },
          { name: 'Supplier Payments', href: '/payments?type=supplier', icon: CreditCard, permission: 'payments.view' },
          { name: 'Supplier Returns', href: '/purchases/returns', icon: RotateCcw, permission: 'purchases.view' }
        ]
      },
      {
        name: 'Stock',
        key: 'stock',
        icon: Boxes,
        permission: 'stock.view',
        children: [
          { name: 'Stock List', href: '/stock', icon: Boxes, permission: 'stock.view' },
          { name: 'Movements', href: '/stock/movements', icon: ArrowLeftRight, permission: 'stock.movements' },
          { name: 'Adjustments', href: '/stock/adjustments', icon: SlidersHorizontal, permission: 'stock.adjustments' }
        ]
      },
      {
        name: 'Finance',
        key: 'finance',
        icon: CreditCard,
        permission: 'payments.view',
        children: [
          { name: 'Payments', href: '/payments', icon: CreditCard, permission: 'payments.view' },
          { name: 'Quotations', href: '/quotations', icon: FileText, permission: 'quotations.view' }
        ]
      },
      {
        name: 'Marketing',
        key: 'marketing',
        icon: MessageSquare,
        permission: 'campaigns.view',
        children: [
          { name: 'WhatsApp Campaigns', href: '/crm/whatsapp/campaigns', icon: MessageSquare, permission: 'campaigns.view' },
          { name: 'Campaigns', href: '/campaigns', icon: Tag, permission: 'campaigns.view' },
          { name: 'Notifications', href: '/notifications', icon: Bell, permission: 'notifications.view' }
        ]
      },
      {
        name: 'Settings',
        key: 'settings',
        icon: Settings,
        permission: 'settings.view',
        children: [
          { name: 'Subscription & Billing', href: '/settings/subscription', icon: CreditCard, adminOnly: true, permission: 'settings.view' },
          { name: 'Business Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
          { name: 'Team Users', href: '/settings/users', icon: UserCheck, permission: 'users.view' },
          { name: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck, permission: 'roles.view' },
          { name: 'Invoice Templates', href: '/settings/templates', icon: Layout, permission: 'settings.view' },
          { name: 'Email & Communication', href: '/settings/email', icon: Mail, permission: 'email.history' },
          { name: 'Printers & Printing', href: '/settings/printers', icon: Printer, permission: 'settings.view' },
          { name: 'Database Backup', href: '/settings/backup', icon: Database, permission: 'settings.view' }
        ]
      },
      {
        name: 'Help & Support',
        key: 'support',
        icon: LifeBuoy,
        children: [
          { name: 'Help Center', href: '/help', icon: BookOpen },
          { name: 'Raise a Ticket', href: '/support/new', icon: TicketPlus },
          { name: 'My Support Tickets', href: '/support/tickets', icon: Ticket },
          { name: 'FAQs', href: '/support/faq', icon: HelpCircle }
        ]
      }
    ]
  }
];

export function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { checkPermission, business, role, user, logout } = useAuth();
  const navRef = useRef(null);

  // Authoritative subscription check:
  // If subscription is expired, cancelled, no subscription, or explicitly not allowed, ALL business modules are locked.
  const isSubRestricted = Boolean(
    business?.subscription_allowed === false ||
    business?.subscription_status === 'EXPIRED' ||
    business?.subscription_status === 'CANCELLED' ||
    business?.subscription_status === 'NO_SUBSCRIPTION' ||
    (business?.subscription_status === 'PENDING' && business?.license_status !== 'ACTIVE')
  );

  // Tier check: STARTER plan cannot access Growth/Lifetime modules (Customer Orders, Self-Shopping)
  const isStarterTier = (business?.subscription_tier === 'STARTER' || !business?.subscription_tier) &&
    business?.self_shopping_status !== 'LIFETIME_ACTIVE' &&
    business?.self_shopping_status !== 'GROWTH_ACTIVE';

  // Active expanded dropdown group (single accordion)
  const [activeGroup, setActiveGroup] = useState(null);

  // Exact route matching helper
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;
  const isRouteActive = (href) => {
    if (!href) return false;
    const cleanPath = (pathname || '').split('?')[0].replace(/\/$/, '') || '/';
    const [targetPath, targetQuery] = href.split('?');
    const cleanTarget = targetPath.replace(/\/$/, '') || '/';

    // Also match role-prefixed version: /company/{slug}/{modulePath}
    const rolePrefixedTarget = getRolePath(role, userRoleSlug, cleanTarget).split('?')[0].replace(/\/$/, '');

    // If target has query params (e.g. ?type=customer or ?type=supplier), verify query match
    if (targetQuery) {
      if (cleanPath !== cleanTarget && cleanPath !== rolePrefixedTarget) return false;
      const targetParams = new URLSearchParams(targetQuery);
      let matches = true;
      targetParams.forEach((val, key) => {
        if (searchParams.get(key) !== val) matches = false;
      });
      return matches;
    }

    // Special check for base /payments (under Finance) when no query param is present
    if (cleanTarget === '/payments' || cleanTarget.endsWith('/payments')) {
      if (cleanPath !== cleanTarget && cleanPath !== rolePrefixedTarget) return false;
      const type = searchParams.get('type');
      // If ?type=customer or ?type=supplier, base /payments is not active
      return !type || (type !== 'customer' && type !== 'supplier');
    }

    // Exact match for base roots so /settings doesn't steal highlight from /settings/roles, /sales from /sales/new, etc.
    const baseRoots = [
      'crm',
      'sales',
      'purchases',
      'stock',
      'products',
      'settings',
      'suppliers',
      'reports',
      'dashboard',
      'payments'
    ];

    const isBaseRoot = baseRoots.some(
      (r) => cleanTarget === `/${r}` || rolePrefixedTarget.endsWith(`/${r}`)
    );

    if (isBaseRoot) {
      return cleanPath === cleanTarget || cleanPath === rolePrefixedTarget;
    }

    // Exact match for any other route unless it is explicitly an ancestor directory
    return cleanPath === cleanTarget || cleanPath === rolePrefixedTarget;
  };

  // Auto-expand parent group containing current route on initial load, refresh, or route navigation
  useEffect(() => {
    if (!pathname) return;

    for (const section of navigationSections) {
      for (const item of section.items) {
        if (item.children) {
          const hasActiveChild = item.children.some(child => isRouteActive(child.href));
          if (hasActiveChild) {
            setActiveGroup(item.key);
            return;
          }
        }
      }
    }
  }, [pathname, searchParams]);

  // Scroll active item into view smoothly
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [pathname, searchParams]);

  // Toggle group accordion (clicking expands/collapses, closes any other parent)
  const toggleGroup = (key) => {
    setActiveGroup(prev => (prev === key ? null : key));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl overflow-hidden',
          // Desktop styling: deep dark navy
          'lg:bg-[#0B1120] lg:text-slate-300 lg:top-0 lg:bottom-0 lg:left-0 lg:border-r lg:border-slate-800/80 lg:rounded-none lg:translate-y-0 lg:h-screen',
          isCollapsed ? 'lg:w-20' : 'lg:w-[288px]',
          // Mobile styling: Light modern theme with floating rounded sheet
          'max-lg:bg-slate-50/98 max-lg:backdrop-blur-2xl max-lg:text-slate-800 max-lg:left-2 max-lg:right-2 max-lg:bottom-2 max-lg:max-h-[85vh] max-lg:rounded-3xl max-lg:border max-lg:border-slate-200/90 max-lg:shadow-2xl max-lg:shadow-slate-900/20',
          isMobileOpen ? 'max-lg:translate-y-0' : 'max-lg:translate-y-full lg:translate-x-0'
        )}
      >
        {/* Mobile Drag Handle Pill */}
        <div className="lg:hidden w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b lg:border-slate-800/80 max-lg:border-slate-200/90 lg:bg-[#070C18] max-lg:bg-white/80 shrink-0 max-lg:rounded-t-2xl">
          <Link
            href={getRoleDashboard(role, user?.custom_role?.slug || user?.role_slug)}
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="flex items-center space-x-3 overflow-hidden"
          >
            <img
              src={business?.logo || "/logo.png"}
              alt="VEXA Tech"
              className="h-9 w-auto object-contain rounded-lg shrink-0 bg-white p-1 border border-slate-200/80"
            />
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold lg:text-white max-lg:text-slate-900 tracking-wide text-sm truncate">
                  {business?.business_name || 'Sai textiles'}
                </span>
                <span className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase truncate">
                  {business?.business_type || 'GARMENT_TEXTILE'}
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 -rotate-90" />
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Hierarchical Scrollable Navigation Menu */}
        <nav ref={navRef} className="flex-1 overflow-y-auto scroll-smooth p-3.5 space-y-1.5 no-scrollbar">
          {navigationSections.map((section) => {
            const isAllowedDuringRestricted = (href) => {
              if (!href) return false;
              // Only Subscription & Billing and Help/Support are accessible when subscription is restricted
              return href === '/settings/subscription' || href.startsWith('/help') || href.startsWith('/support');
            };

            const isAllowedItem = (entry) => {
              if (entry.adminOnly && role !== 'ADMIN') return false;
              if (!entry.permission && !entry.module) return true; // Accessible to all authenticated users (e.g., Help & Support)
              return checkPermission(entry.permission || entry.module);
            };

            const visibleItems = section.items.filter((item) => {
              if (item.children) {
                return item.children.some(child => isAllowedItem(child));
              }
              return isAllowedItem(item);
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5">
                {(!isCollapsed || isMobileOpen) && (
                  <div className="px-3 pt-1 pb-1.5 text-[11px] font-bold lg:text-slate-400 max-lg:text-slate-500 tracking-wider uppercase mb-1">
                    {section.title}
                  </div>
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  // 1. COLLAPSIBLE PARENT ITEM WITH SUBMENU
                  if (item.children) {
                    const visibleChildren = item.children.filter(child => isAllowedItem(child));
                    if (visibleChildren.length === 0) return null;

                    const isGroupOpen = activeGroup === item.key;
                    const hasActiveChild = visibleChildren.some(child => isRouteActive(child.href));
                    const isGroupRestricted = isSubRestricted && !visibleChildren.some(c => isAllowedDuringRestricted(c.href));

                    return (
                      <div key={item.key} className="space-y-1">
                        {/* Parent Group Button */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.key)}
                          title={isCollapsed && !isMobileOpen ? item.name : undefined}
                          className={cn(
                            'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer',
                            isGroupOpen
                              ? 'lg:text-white lg:bg-slate-800/90 lg:border-blue-500/30 max-lg:text-blue-700 max-lg:bg-blue-50/90 max-lg:border max-lg:border-blue-200 shadow-xs'
                              : hasActiveChild
                              ? 'lg:text-white lg:bg-slate-800/40 lg:border-slate-700/50 max-lg:text-slate-900 max-lg:bg-white max-lg:border max-lg:border-slate-200'
                              : isGroupRestricted
                              ? 'lg:text-slate-400 max-lg:text-slate-400 hover:bg-slate-100'
                              : 'lg:text-slate-300 lg:hover:text-white lg:hover:bg-slate-800/50 max-lg:text-slate-700 max-lg:hover:text-slate-900 max-lg:hover:bg-white',
                            (isCollapsed && !isMobileOpen) && 'justify-center px-0'
                          )}
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <Icon
                              className={cn(
                                'w-4 h-4 shrink-0 transition-transform duration-200',
                                (hasActiveChild || isGroupOpen) ? 'text-blue-600' : 'text-slate-400 lg:group-hover:text-white max-lg:group-hover:text-slate-800'
                              )}
                            />
                            {(!isCollapsed || isMobileOpen) && (
                              <span className="truncate font-bold">{item.name}</span>
                            )}
                          </div>

                          {(!isCollapsed || isMobileOpen) && (
                            <div className="flex items-center space-x-1.5">
                              {isGroupRestricted && (
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <ChevronDown
                                className={cn(
                                  'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                                  isGroupOpen && 'rotate-180 text-blue-600'
                                )}
                              />
                            </div>
                          )}
                        </button>

                        {/* Collapsible Submenu Children with Left Connector Line */}
                        {(isGroupOpen || (isCollapsed && !isMobileOpen)) && (!isCollapsed || isMobileOpen) && (
                          <div className="border-l lg:border-slate-700/60 max-lg:border-slate-200 ml-4 pl-3.5 space-y-1 my-1 animate-in fade-in duration-150">
                            {visibleChildren.map((child) => {
                              const rolePrefixedChildHref = getRolePath(role, userRoleSlug, child.href);
                              const isChildRestricted = isSubRestricted && !isAllowedDuringRestricted(child.href);
                              const isCustomerOrdersLocked = child.href === '/sales/orders' && isStarterTier;
                              const isChildLocked = isChildRestricted || isCustomerOrdersLocked;
                              const targetChildHref = isChildLocked
                                ? getRolePath(role, userRoleSlug, 'settings/subscription')
                                : rolePrefixedChildHref;
                              const isActive = isRouteActive(child.href) || (!isChildLocked && isRouteActive(targetChildHref));
                              const ChildIcon = child.icon;

                              return (
                                <Link
                                  key={child.name}
                                  href={child.href === '/sales/new' ? '/sales/quick' : targetChildHref}
                                  target={child.href === '/sales/new' ? '_blank' : undefined}
                                  rel={child.href === '/sales/new' ? 'noopener noreferrer' : undefined}
                                  data-active={isActive ? "true" : "false"}
                                  onClick={() => {
                                    if (setIsMobileOpen) setIsMobileOpen(false);
                                    // Keep parent expanded when clicking child
                                    setActiveGroup(item.key);
                                  }}
                                  className={cn(
                                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 group relative',
                                    isActive
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-extrabold shadow-md shadow-blue-600/35 border border-blue-400/30'
                                      : isChildLocked
                                      ? 'text-slate-400 max-lg:text-slate-400 font-medium'
                                      : 'lg:text-slate-400 lg:hover:text-white lg:hover:bg-slate-800/60 max-lg:text-slate-600 max-lg:hover:text-slate-900 max-lg:hover:bg-white font-semibold'
                                  )}
                                >
                                  <div className="flex items-center space-x-2.5 truncate">
                                    {isActive && (
                                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full shadow-xs" />
                                    )}
                                    <ChildIcon
                                      className={cn(
                                        'w-3.5 h-3.5 shrink-0 transition-transform duration-200',
                                        isActive ? 'text-white scale-110' : (isChildLocked ? 'text-slate-400' : 'text-slate-400 lg:group-hover:text-white max-lg:group-hover:text-slate-800')
                                      )}
                                    />
                                    <span className="truncate">{child.name}</span>
                                  </div>

                                  {isChildLocked && (
                                    <span className="flex items-center space-x-1 shrink-0 ml-1">
                                      {isCustomerOrdersLocked && !isChildRestricted && (
                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                          Growth
                                        </span>
                                      )}
                                      {isChildRestricted && (
                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                          Expired
                                        </span>
                                      )}
                                      <Lock className="w-3 h-3 text-amber-500" />
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 2. DIRECT TOP-LEVEL MENU ITEM (e.g. Dashboard, Reports)
                  const rolePrefixedItemHref = item.href === '/dashboard'
                    ? getRoleDashboard(role, userRoleSlug)
                    : getRolePath(role, userRoleSlug, item.href);
                  const isItemRestricted = isSubRestricted && !isAllowedDuringRestricted(item.href);
                  const targetHref = isItemRestricted
                    ? getRolePath(role, userRoleSlug, 'settings/subscription')
                    : rolePrefixedItemHref;
                  const isActive = isRouteActive(item.href) || (!isItemRestricted && isRouteActive(targetHref));
                  return (
                    <Link
                      key={item.name}
                      href={targetHref}
                      data-active={isActive ? "true" : "false"}
                      onClick={() => {
                        if (setIsMobileOpen) setIsMobileOpen(false);
                        setActiveGroup(null);
                      }}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 group relative',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-extrabold shadow-md shadow-blue-600/35 border border-blue-400/30'
                          : isItemRestricted
                          ? 'lg:text-slate-400 max-lg:text-slate-400 font-semibold'
                          : 'lg:text-slate-300 lg:hover:text-white lg:hover:bg-slate-800/60 max-lg:text-slate-700 max-lg:hover:text-slate-900 max-lg:hover:bg-white font-semibold',
                        (isCollapsed && !isMobileOpen) && 'justify-center px-0'
                      )}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        {isActive && (!isCollapsed || isMobileOpen) && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full shadow-xs" />
                        )}
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-transform duration-200',
                            isActive ? 'text-white scale-110' : (isItemRestricted ? 'text-slate-400' : 'text-slate-400 lg:group-hover:text-white max-lg:group-hover:text-slate-800')
                          )}
                        />
                        {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
                      </div>

                      {isItemRestricted && (!isCollapsed || isMobileOpen) && (
                        <span className="inline-flex items-center text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5 mr-1" /> Locked
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Fixed Logout Footer Section */}
        <div className="p-3.5 border-t lg:border-slate-800/80 max-lg:border-slate-200/90 lg:bg-[#070C18] max-lg:bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              if (setIsMobileOpen) setIsMobileOpen(false);
              logout();
            }}
            title="Logout"
            className={cn(
              'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500/30 group cursor-pointer',
              (isCollapsed && !isMobileOpen) && 'justify-center px-0'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
