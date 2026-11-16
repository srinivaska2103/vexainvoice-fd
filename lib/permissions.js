// Centralized Frontend Permission Architecture

export const MODULE_PERMISSIONS = {
  DASHBOARD: {
    VIEW: 'dashboard.view'
  },
  SALES: {
    VIEW: 'sales.view',
    CREATE: 'sales.create',
    EDIT: 'sales.edit',
    CONFIRM: 'sales.confirm',
    CANCEL: 'sales.cancel',
    INVOICES: 'sales.invoices',
    PRINT: 'sales.print',
    EMAIL: 'sales.email',
    RETURN: 'sales.return'
  },
  GST_BILLING: {
    POS: 'gst.pos',
    CREATE: 'gst.create',
    VIEW: 'gst.view',
    REPORTS: 'gst.reports'
  },
  WITHOUT_GST_BILLING: {
    POS: 'without_gst.pos',
    CREATE: 'without_gst.create',
    VIEW: 'without_gst.view',
    REPORTS: 'without_gst.reports',
    RETURN: 'without_gst.return'
  },
  CUSTOMERS: {
    VIEW: 'customers.view',
    CREATE: 'customers.create',
    EDIT: 'customers.edit',
    HISTORY: 'customers.history',
    LEDGER: 'customers.ledger',
    PAYMENT: 'customers.payment'
  },
  SUPPLIERS: {
    VIEW: 'suppliers.view',
    CREATE: 'suppliers.create',
    EDIT: 'suppliers.edit',
    HISTORY: 'suppliers.history',
    LEDGER: 'suppliers.ledger',
    PAYMENT: 'suppliers.payment'
  },
  PRODUCTS: {
    VIEW: 'products.view',
    CREATE: 'products.create',
    EDIT: 'products.edit',
    DEACTIVATE: 'products.deactivate',
    CATEGORIES: 'products.categories',
    VARIANTS: 'products.variants'
  },
  STOCK: {
    VIEW: 'stock.view',
    MOVEMENTS: 'stock.movements',
    ADJUSTMENTS: 'stock.adjustments',
    APPROVE: 'stock.approve'
  },
  PURCHASES: {
    VIEW: 'purchases.view',
    CREATE: 'purchases.create',
    EDIT: 'purchases.edit',
    CONFIRM: 'purchases.confirm',
    CANCEL: 'purchases.cancel'
  },
  PAYMENTS: {
    VIEW: 'payments.view',
    CREATE: 'payments.create',
    HISTORY: 'payments.history'
  },
  QUOTATIONS: {
    VIEW: 'quotations.view',
    CREATE: 'quotations.create',
    EDIT: 'quotations.edit',
    CONVERT: 'quotations.convert',
    CANCEL: 'quotations.cancel'
  },
  REPORTS: {
    SALES: 'reports.sales',
    PURCHASES: 'reports.purchases',
    STOCK: 'reports.stock',
    CUSTOMERS: 'reports.customers',
    SUPPLIERS: 'reports.suppliers',
    PAYMENTS: 'reports.payments',
    EXPORT: 'reports.export'
  },
  NOTIFICATIONS: {
    VIEW: 'notifications.view',
    SETTINGS: 'notifications.settings'
  },
  EMAIL: {
    HISTORY: 'email.history',
    TEST: 'email.test',
    RESEND: 'email.resend',
    SETTINGS: 'email.settings'
  },
  MARKETING: {
    CAMPAIGNS_VIEW: 'campaigns.view',
    CAMPAIGNS_CREATE: 'campaigns.create',
    CAMPAIGNS_EDIT: 'campaigns.edit',
    CAMPAIGNS_SEND: 'campaigns.send',
    CAMPAIGNS_SCHEDULE: 'campaigns.schedule'
  },
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DEACTIVATE: 'users.deactivate',
    CHANGE_ROLE: 'users.change_role'
  },
  ROLES: {
    VIEW: 'roles.view',
    CREATE: 'roles.create',
    EDIT: 'roles.edit',
    DEACTIVATE: 'roles.deactivate',
    DELETE: 'roles.delete',
    MANAGE: 'roles.manage_permissions'
  },
  SETTINGS: {
    VIEW: 'settings.view',
    EDIT: 'settings.edit',
    BILLING: 'settings.billing'
  },
  SCANNER: {
    VIEW: 'scanner.view',
    SCAN: 'scanner.scan'
  },
  CRM: {
    VIEW: 'crm.view',
    CUSTOMERS_VIEW: 'crm.customers_view',
    FOLLOWUPS_VIEW: 'crm.followups_view',
    FOLLOWUPS_CREATE: 'crm.followups_create',
    FOLLOWUPS_EDIT: 'crm.followups_edit',
    FOLLOWUPS_DELETE: 'crm.followups_delete',
    SEGMENTS_VIEW: 'crm.segments_view',
    SEGMENTS_CREATE: 'crm.segments_create',
    PRODUCT_INSIGHTS_VIEW: 'crm.product_insights_view',
    PURCHASE_PATTERNS_VIEW: 'crm.purchase_patterns_view',
    TIMELINE_VIEW: 'crm.timeline_view'
  }
};

/**
 * Role Permission Mapping Presets
 */
export const ROLE_PRESETS = {
  ADMIN: Object.values(MODULE_PERMISSIONS).flatMap(group => Object.values(group)),
  USER: [
    'dashboard.view', 'sales.view', 'sales.create', 'sales.confirm', 'sales.invoices', 'sales.print', 'sales.email', 'sales.return',
    'gst.pos', 'gst.create', 'gst.view',
    'customers.view', 'customers.create', 'customers.edit',
    'payments.view', 'payments.create',
    'quotations.view', 'quotations.create',
    'notifications.view',
    'scanner.view', 'scanner.scan'
  ],
  MANAGER: [
    'dashboard.view', 'sales.view', 'sales.create', 'sales.edit', 'sales.confirm', 'sales.cancel', 'sales.invoices', 'sales.print', 'sales.email', 'sales.return',
    'gst.pos', 'gst.create', 'gst.view', 'gst.reports',
    'customers.view', 'customers.create', 'customers.edit', 'customers.history', 'customers.ledger', 'customers.payment',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.history', 'suppliers.ledger', 'suppliers.payment',
    'products.view', 'products.create', 'products.edit', 'products.categories', 'products.variants',
    'stock.view', 'stock.movements', 'stock.adjustments', 'stock.approve',
    'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.confirm',
    'payments.view', 'payments.create', 'payments.history',
    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.convert',
    'reports.sales', 'reports.purchases', 'reports.stock', 'reports.customers', 'reports.suppliers', 'reports.payments', 'reports.export',
    'notifications.view', 'email.history', 'email.resend', 'campaigns.view', 'campaigns.create', 'campaigns.send',
    'scanner.view', 'scanner.scan',
    'crm.view', 'crm.customers_view', 'crm.followups_view', 'crm.followups_create', 'crm.followups_edit', 'crm.followups_delete', 'crm.segments_view', 'crm.segments_create', 'crm.product_insights_view', 'crm.purchase_patterns_view', 'crm.timeline_view'
  ],
  BILLING_STAFF: [
    'dashboard.view', 'sales.view', 'sales.create', 'sales.confirm', 'sales.invoices', 'sales.print', 'sales.email', 'sales.return',
    'gst.pos', 'gst.create', 'gst.view',
    'customers.view', 'customers.create', 'customers.edit',
    'payments.view', 'payments.create',
    'quotations.view', 'quotations.create',
    'notifications.view',
    'scanner.view', 'scanner.scan',
    'crm.view', 'crm.customers_view', 'crm.followups_view', 'crm.followups_create', 'crm.followups_edit', 'crm.segments_view', 'crm.product_insights_view', 'crm.purchase_patterns_view', 'crm.timeline_view'
  ],
  STOCK_STAFF: [
    'dashboard.view',
    'products.view', 'products.create', 'products.edit', 'products.categories', 'products.variants',
    'stock.view', 'stock.movements', 'stock.adjustments',
    'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.confirm',
    'notifications.view',
    'scanner.view', 'scanner.scan'
  ],
  ACCOUNTANT: [
    'dashboard.view', 'sales.view', 'sales.invoices', 'sales.print',
    'customers.view', 'customers.history', 'customers.ledger', 'customers.payment',
    'suppliers.view', 'suppliers.history', 'suppliers.ledger', 'suppliers.payment',
    'payments.view', 'payments.create', 'payments.history',
    'reports.sales', 'reports.purchases', 'reports.stock', 'reports.customers', 'reports.suppliers', 'reports.payments', 'reports.export',
    'notifications.view'
  ]
};

/**
 * Centralized Role Dashboard Routing Configuration
 */
export const ROLE_DASHBOARDS = {
  ADMIN: '/company/admin/dashboard',
  MANAGER: '/company/manager-role/dashboard',
  BILLING_STAFF: '/company/cashier-role/dashboard',
  ACCOUNTANT: '/company/accountant-role/dashboard',
  STOCK_STAFF: '/company/stock-role/dashboard',
  USER: '/company/cashier-role/dashboard'
};

export const ROLE_ROUTE_PREFIXES = {
  ADMIN: '/company/admin',
  MANAGER: '/company/manager-role',
  BILLING_STAFF: '/company/cashier-role',
  ACCOUNTANT: '/company/accountant-role',
  STOCK_STAFF: '/company/stock-role',
  USER: '/company/cashier-role'
};

/**
 * Canonical helper to generate role-prefixed URLs with query parameter preservation
 * Format: /company/{roleSlug}/{modulePath}/
 */
export function getRolePath(role, customRoleSlug = null, modulePath = '', query = '') {
  let slug = 'admin';
  if (role === 'ADMIN') {
    slug = 'admin';
  } else if (customRoleSlug) {
    slug = String(customRoleSlug).toLowerCase().trim();
  } else if (role) {
    const roleSlugMapping = {
      ADMIN: 'admin',
      MANAGER: 'manager-role',
      BILLING_STAFF: 'cashier-role',
      ACCOUNTANT: 'accountant-role',
      STOCK_STAFF: 'stock-role',
      USER: 'cashier-role'
    };
    slug = roleSlugMapping[role] || 'user';
  }

  // Normalize modulePath (strip query string if embedded, handle leading/trailing slashes)
  let cleanPath = '';
  let embeddedQuery = '';
  if (modulePath) {
    const [pathPart, qPart] = modulePath.split('?');
    cleanPath = pathPart.replace(/^\/+|\/+$/g, '');
    if (qPart) embeddedQuery = qPart;
  }

  const effectiveQuery = query || embeddedQuery;
  const queryString = effectiveQuery ? (effectiveQuery.startsWith('?') ? effectiveQuery : `?${effectiveQuery}`) : '';

  if (!cleanPath || cleanPath === 'dashboard') {
    return `/company/${slug}/dashboard/${queryString}`;
  }

  return `/company/${slug}/${cleanPath}/${queryString}`;
}

/**
 * Get authorized dashboard for a role
 */
export function getRoleDashboard(role, customRoleSlug = null) {
  return getRolePath(role, customRoleSlug, 'dashboard');
}

/**
 * Check if a given user role has a permission code
 * ADMIN has unconditional full access
 */
export function hasPermission(userOrRole, permissionCode) {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'object') {
    if (userOrRole.role === 'ADMIN') return true;
    const customPerms = userOrRole.permissions || userOrRole.custom_role?.permissions;
    if (Array.isArray(customPerms)) {
      if (customPerms.includes('*') || customPerms.includes(permissionCode)) return true;
      if (userOrRole.custom_role_id || userOrRole.custom_role) return false;
    }
    const role = userOrRole.role;
    const permissions = ROLE_PRESETS[role] || [];
    return permissions.includes(permissionCode);
  }

  if (userOrRole === 'ADMIN') return true;
  const permissions = ROLE_PRESETS[userOrRole] || [];
  return permissions.includes(permissionCode);
}
