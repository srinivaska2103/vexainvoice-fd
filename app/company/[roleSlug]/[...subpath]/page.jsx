'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// Lazy dynamic imports for nested role modules
import ProductsPage from '@/app/products/page';
import NewProductPage from '@/app/products/new/page';
import ProductDetailPage from '@/app/products/[id]/page';
import CategoriesPage from '@/app/categories/page';
import VariantsPage from '@/app/variants/page';
import BarcodeLabelsPage from '@/app/products/barcodes/page';
import StockPage from '@/app/stock/page';
import StockMovementsPage from '@/app/stock/movements/page';
import StockAdjustmentsPage from '@/app/stock/adjustments/page';
import PaymentsPage from '@/app/payments/page';
import ReportsPage from '@/app/reports/page';
import SalesHistoryPage from '@/app/sales/page';
import NewSalePage from '@/app/sales/new/page';
import QuickBillPage from '@/app/sales/quick/page';
import CustomerOrdersPage from '@/app/sales/orders/page';
import SalesReturnsPage from '@/app/sales/returns/page';
import ScannerPage from '@/app/scanner/page';
import PurchasesPage from '@/app/purchases/page';
import NewPurchasePage from '@/app/purchases/new/page';
import PurchaseReturnsPage from '@/app/purchases/returns/page';
import SuppliersPage from '@/app/suppliers/page';
import CRMPage from '@/app/crm/page';
import CustomersPage from '@/app/customers/page';
import CrmCustomersPage from '@/app/crm/customers/page';
import CrmFollowupsPage from '@/app/crm/followups/page';
import WhatsAppWalletPage from '@/app/crm/whatsapp/wallet/page';
import WhatsAppCampaignsPage from '@/app/crm/whatsapp/campaigns/page';
import QuotationsPage from '@/app/quotations/page';
import CampaignsPage from '@/app/campaigns/page';
import NotificationsPage from '@/app/notifications/page';
import SettingsPage from '@/app/settings/page';
import RolesSettingsPage from '@/app/settings/roles/page';
import UsersSettingsPage from '@/app/settings/users/page';
import SubscriptionPage from '@/app/settings/subscription/page';
import TemplatesPage from '@/app/settings/templates/page';
import EmailSettingsPage from '@/app/settings/email/page';
import WhatsAppSettingsPage from '@/app/settings/whatsapp/page';
import PrintersSettingsPage from '@/app/settings/printers/page';
import BackupSettingsPage from '@/app/settings/backup/page';
import HelpCenterPage from '@/app/help/page';
import HelpArticleDetailPage from '@/app/help/[slug]/page';
import RaiseSupportTicketPage from '@/app/support/new/page';
import MySupportTicketsPage from '@/app/support/tickets/page';
import TicketDetailPage from '@/app/support/tickets/[id]/page';
import ProductDetailContent from '@/components/ProductDetailContent';
import SupplierDetailContent from '@/components/SupplierDetailContent';
import CustomerDetailContent from '@/components/CustomerDetailContent';
import FaqsPage from '@/app/support/faq/page';

export default function CompanyRoleSubpathPage() {
  const params = useParams();
  const router = useRouter();
  const roleSlug = String(params?.roleSlug || '').toLowerCase().trim();
  const subpathSegments = params?.subpath || [];
  const fullSubpath = Array.isArray(subpathSegments) ? subpathSegments.join('/') : String(subpathSegments);
  const cleanSubpath = fullSubpath.toLowerCase().replace(/\/$/, '');

  const { user, role, isLoading, isAuthenticated, checkPermission } = useAuth();

  // Mapping from roleSlug to allowed system roles
  const roleSlugMap = {
    'admin': ['ADMIN'],
    'admin-role': ['ADMIN'],
    'stock-role': ['STOCK_STAFF'],
    'stock-manager': ['STOCK_STAFF'],
    'stock-staff': ['STOCK_STAFF'],
    'cashier-role': ['BILLING_STAFF', 'USER'],
    'cashier': ['BILLING_STAFF', 'USER'],
    'cashier-billing-staff': ['BILLING_STAFF', 'USER'],
    'billing-staff': ['BILLING_STAFF', 'USER'],
    'billing': ['BILLING_STAFF', 'USER'],
    'manager-role': ['MANAGER'],
    'manager': ['MANAGER'],
    'accountant-role': ['ACCOUNTANT'],
    'accountant': ['ACCOUNTANT'],
    'sales-role': ['BILLING_STAFF', 'USER'],
    'sales': ['BILLING_STAFF', 'USER'],
    'sales-representative': ['BILLING_STAFF', 'USER']
  };

  let allowedRoles = roleSlugMap[roleSlug] || [];
  if (user?.custom_role && user.custom_role.slug === roleSlug) {
    allowedRoles = [user.role, ...(allowedRoles.length ? allowedRoles : [])];
  }

  // 1. Role Scope Verification: ADMIN has global access; otherwise user's slug or role must match
  const isRoleMatch = role === 'ADMIN' || 
    (allowedRoles.length > 0 && allowedRoles.includes(role)) ||
    (user?.custom_role?.slug === roleSlug) ||
    (user?.role_slug === roleSlug);

  // 2. Subpath permission resolution dictionary
  const subpathConfig = {
    'products': { component: <ProductsPage />, perm: 'products.view' },
    'products/new': { component: <NewProductPage />, perm: 'products.create' },
    'products/categories': { component: <CategoriesPage />, perm: 'products.categories' },
    'categories': { component: <CategoriesPage />, perm: 'products.categories' },
    'products/variants': { component: <VariantsPage />, perm: 'products.variants' },
    'variants': { component: <VariantsPage />, perm: 'products.variants' },
    'products/barcodes': { component: <BarcodeLabelsPage />, perm: 'products.view' },

    'stock': { component: <StockPage />, perm: 'stock.view' },
    'stock/movements': { component: <StockMovementsPage />, perm: 'stock.movements' },
    'stock/adjustments': { component: <StockAdjustmentsPage />, perm: 'stock.adjustments' },

    'finance': { component: <PaymentsPage />, perm: 'payments.view' },
    'payments': { component: <PaymentsPage />, perm: 'payments.view' },
    'reports': { component: <ReportsPage />, perm: 'reports.sales' },

    'sales': { component: <SalesHistoryPage />, perm: 'sales.view' },
    'sales/new': { component: <NewSalePage />, perm: 'sales.create' },
    'sales/quick': { component: <QuickBillPage />, perm: 'sales.create' },
    'sales/orders': { component: <CustomerOrdersPage />, perm: 'sales.view', adminOnly: true },
    'sales/returns': { component: <SalesReturnsPage />, perm: 'sales.return' },
    'scanner': { component: <ScannerPage />, perm: 'scanner.view', adminOnly: true },

    'purchases': { component: <PurchasesPage />, perm: 'purchases.view' },
    'purchases/new': { component: <NewPurchasePage />, perm: 'purchases.create' },
    'purchases/returns': { component: <PurchaseReturnsPage />, perm: 'purchases.view' },
    'suppliers': { component: <SuppliersPage />, perm: 'suppliers.view' },

    'crm': { component: <CRMPage />, perm: 'crm.view' },
    'crm/customers': { component: <CrmCustomersPage />, perm: 'crm.customers_view' },
    'crm/followups': { component: <CrmFollowupsPage />, perm: 'crm.followups_view' },
    'crm/whatsapp/wallet': { component: <WhatsAppWalletPage />, perm: 'campaigns.view' },
    'crm/whatsapp/campaigns': { component: <WhatsAppCampaignsPage />, perm: 'campaigns.view' },
    'customers': { component: <CustomersPage />, perm: 'customers.view' },

    'quotations': { component: <QuotationsPage />, perm: 'quotations.view' },
    'campaigns': { component: <CampaignsPage />, perm: 'campaigns.view' },
    'notifications': { component: <NotificationsPage />, perm: 'notifications.view' },

    'settings': { component: <SettingsPage />, perm: 'settings.view' },
    'settings/subscription': { component: <SubscriptionPage />, perm: 'settings.view', adminOnly: true },
    'settings/roles': { component: <RolesSettingsPage />, perm: 'roles.view', adminOnly: true },
    'settings/users': { component: <UsersSettingsPage />, perm: 'users.view', adminOnly: true },
    'settings/templates': { component: <TemplatesPage />, perm: 'settings.view' },
    'settings/email': { component: <EmailSettingsPage />, perm: 'email.history' },
    'settings/whatsapp': { component: <WhatsAppSettingsPage />, perm: 'settings.view' },
    'settings/printers': { component: <PrintersSettingsPage />, perm: 'settings.view' },
    'settings/backup': { component: <BackupSettingsPage />, perm: 'settings.view' },

    // Help & Support Routes (Accessible to all authenticated roles)
    'help': { component: <HelpCenterPage /> },
    'support/new': { component: <RaiseSupportTicketPage /> },
    'support/tickets': { component: <MySupportTicketsPage /> },
    'support/faq': { component: <FaqsPage /> }
  };

  // Dynamic parameterized subpath matching (e.g. help/:slug, support/tickets/:id, products/:id, suppliers/:id, customers/:id)
  let dynamicMatchedComponent = null;
  if (cleanSubpath.startsWith('help/') && cleanSubpath !== 'help') {
    const slugPart = cleanSubpath.replace('help/', '');
    dynamicMatchedComponent = <HelpArticleDetailPage params={{ slug: slugPart }} />;
  } else if (cleanSubpath.startsWith('support/tickets/') && cleanSubpath !== 'support/tickets') {
    const idPart = cleanSubpath.replace('support/tickets/', '');
    dynamicMatchedComponent = <TicketDetailPage params={{ id: idPart }} />;
  } else if (cleanSubpath.startsWith('suppliers/') && cleanSubpath !== 'suppliers') {
    const supplierId = cleanSubpath.replace('suppliers/', '');
    dynamicMatchedComponent = <SupplierDetailContent supplierId={supplierId} />;
  } else if (cleanSubpath.startsWith('customers/') && cleanSubpath !== 'customers') {
    const customerId = cleanSubpath.replace('customers/', '');
    dynamicMatchedComponent = <CustomerDetailContent customerId={customerId} />;
  } else if (cleanSubpath.startsWith('products/') && !['products/new', 'products/categories', 'products/variants', 'products/barcodes'].includes(cleanSubpath)) {
    const prodId = cleanSubpath.replace('products/', '');
    dynamicMatchedComponent = <ProductDetailContent productId={prodId} />;
  }

  const matched = subpathConfig[cleanSubpath];
  const isPermitted = dynamicMatchedComponent || !matched || role === 'ADMIN' || (
    (!matched.adminOnly || role === 'ADMIN') &&
    (!matched.perm || checkPermission(matched.perm))
  );

  return (
    <ProtectedRoute>
      {!isLoading && isAuthenticated && (!isRoleMatch || !isPermitted) ? (
        <AccessDeniedRedirect />
      ) : dynamicMatchedComponent ? (
        dynamicMatchedComponent
      ) : matched ? (
        matched.component
      ) : (
        <ProductsPage />
      )}
    </ProtectedRoute>
  );
}

function AccessDeniedRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/access-denied');
  }, [router]);
  return null;
}
