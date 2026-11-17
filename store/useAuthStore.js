import { create } from 'zustand';
import { authService } from '@/services/authService';

let initPromise = null;

// Tab-scoped session helpers:
// Prioritizes sessionStorage so each browser tab maintains its own independent authenticated session context.
export const getSessionToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('vexa_token') || localStorage.getItem('vexa_token');
};

export const getSessionUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('vexa_user') || localStorage.getItem('vexa_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
};

export const getSessionBusiness = () => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('vexa_business') || localStorage.getItem('vexa_business');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
};

const sanitizeLogo = (b) => {
  if (!b) return b;
  let logo = b.logo;
  if (typeof logo === 'string' && logo.startsWith('{')) {
    try {
      const p = JSON.parse(logo);
      logo = p.logo || p.logo_url || '/logo.png';
    } catch (e) {}
  }
  return { ...b, logo: logo || '/logo.png' };
};

export const useAuthStore = create((set, get) => ({
  user: null,
  business: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize session: Tab-scoped isolation with backend DB verification
  initialize: async () => {
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        if (typeof window === 'undefined') {
          set({ isLoading: false });
          return;
        }

        // 1. Read tab-scoped credentials first; fallback to localStorage if tab was newly duplicated
        let savedToken = sessionStorage.getItem('vexa_token');
        let savedUser = sessionStorage.getItem('vexa_user');
        let savedBusiness = sessionStorage.getItem('vexa_business');

        if (!savedToken) {
          savedToken = localStorage.getItem('vexa_token');
          savedUser = localStorage.getItem('vexa_user');
          savedBusiness = localStorage.getItem('vexa_business');
          // If migrated from localStorage to tab, promote to this tab's sessionStorage
          if (savedToken) {
            sessionStorage.setItem('vexa_token', savedToken);
            if (savedUser) sessionStorage.setItem('vexa_user', savedUser);
            if (savedBusiness) sessionStorage.setItem('vexa_business', savedBusiness);
          }
        }

        if (!savedToken) {
          // No session present in this tab
          sessionStorage.removeItem('vexa_user');
          sessionStorage.removeItem('vexa_business');
          set({
            token: null,
            user: null,
            business: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        // Temporary hydration from storage while backend profile is fetched
        let initialUser = null;
        let initialBusiness = null;
        if (savedUser) {
          try {
            initialUser = JSON.parse(savedUser);
            if (savedBusiness) initialBusiness = sanitizeLogo(JSON.parse(savedBusiness));
          } catch (e) {}
        }

        if (initialUser && initialUser.role) {
          set({
            token: savedToken,
            user: initialUser,
            business: initialBusiness,
            isAuthenticated: true,
            isLoading: true
          });
        }

        // 2. Authoritative verification: Fetch current authenticated user & role directly from backend /auth/me
        try {
          const meRequest = authService.getMe();
          const timeoutRequest = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth profile request timed out')), 6000);
          });

          const meRes = await Promise.race([meRequest, timeoutRequest]);

          if (meRes?.data?.user) {
            const authoritativeUser = meRes.data.user;
            const authoritativeBusiness = sanitizeLogo(meRes.data.business || initialBusiness);

            // Save to tab's sessionStorage (tab-scoped isolation!)
            sessionStorage.setItem('vexa_token', savedToken);
            sessionStorage.setItem('vexa_user', JSON.stringify(authoritativeUser));
            if (authoritativeBusiness) {
              sessionStorage.setItem('vexa_business', JSON.stringify(authoritativeBusiness));
            }

            set({
              token: savedToken,
              user: authoritativeUser,
              business: authoritativeBusiness,
              isAuthenticated: true,
              isLoading: false
            });
          } else if (initialUser) {
            set({ isLoading: false });
          }
        } catch (err) {
          // If the token is invalid or rejected (401/403), clear this tab's session cleanly
          if (err?.status === 401 || err?.response?.status === 401 || err?.status === 403 || err?.response?.status === 403) {
            sessionStorage.removeItem('vexa_token');
            sessionStorage.removeItem('vexa_user');
            sessionStorage.removeItem('vexa_business');
            localStorage.removeItem('vexa_token');
            localStorage.removeItem('vexa_user');
            localStorage.removeItem('vexa_business');
            set({
              token: null,
              user: null,
              business: null,
              isAuthenticated: false,
              isLoading: false
            });
          } else if (initialUser) {
            // Transient network failure: keep existing authenticated session with initial user
            set({
              token: savedToken,
              user: initialUser,
              business: initialBusiness,
              isAuthenticated: true,
              isLoading: false
            });
          }
        }
      } finally {
        set({ isLoading: false });
        initPromise = null;
      }
    })();

    return initPromise;
  },

  // Login: Stores session in tab-scoped sessionStorage, allowing multiple independent accounts in different tabs
  login: (user, business, token) => {
    const sanitizedBusiness = sanitizeLogo(business);
    if (typeof window !== 'undefined') {
      // Tab-scoped storage
      sessionStorage.setItem('vexa_token', token);
      sessionStorage.setItem('vexa_user', JSON.stringify(user));
      sessionStorage.setItem('vexa_business', JSON.stringify(sanitizedBusiness));

      // Also set localStorage as fallback for new tab opening
      localStorage.setItem('vexa_token', token);
      localStorage.setItem('vexa_user', JSON.stringify(user));
      localStorage.setItem('vexa_business', JSON.stringify(sanitizedBusiness));
    }
    set({
      user,
      business: sanitizedBusiness,
      token,
      isAuthenticated: true,
      isLoading: false
    });
  },

  updateBusiness: (updatedFields) => {
    const currentBusiness = get().business || {};
    let logo = updatedFields.logo !== undefined ? updatedFields.logo : currentBusiness.logo;
    if (typeof logo === 'string' && logo.startsWith('{')) {
      try { const p = JSON.parse(logo); logo = p.logo || p.logo_url || '/logo.png'; } catch (e) {}
    }
    const newBusiness = { ...currentBusiness, ...updatedFields, logo: logo || '/logo.png' };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vexa_business', JSON.stringify(newBusiness));
      localStorage.setItem('vexa_business', JSON.stringify(newBusiness));
    }
    set({ business: newBusiness });
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user || {};
    // Never allow updating authoritative fields (role, id, business_id) via updateUser client state
    const { role, id, business_id, permissions, ...allowedFields } = updatedFields;
    const newUser = { ...currentUser, ...allowedFields };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vexa_user', JSON.stringify(newUser));
      localStorage.setItem('vexa_user', JSON.stringify(newUser));
    }
    set({ user: newUser });
  },

  // Logout: Invalidate only this tab's session (multi-tab isolation)
  logout: (options = {}) => {
    const currentUser = get().user;
    let targetRedirect = '/login';

    if (currentUser && currentUser.role !== 'ADMIN') {
      const roleSlugMapping = {
        BILLING_STAFF: 'cashier-role',
        ACCOUNTANT: 'accountant-role',
        MANAGER: 'manager-role',
        STOCK_STAFF: 'stock-role',
        USER: 'cashier-role'
      };
      const roleSlug =
        currentUser.custom_role?.slug ||
        currentUser.role_slug ||
        roleSlugMapping[currentUser.role];

      if (roleSlug && roleSlug !== 'admin') {
        targetRedirect = `/company/${roleSlug}/login`;
      }
    } else if (currentUser && currentUser.role === 'ADMIN') {
      targetRedirect = '/company/admin/login';
    }

    if (typeof window !== 'undefined') {
      // Clear this tab's session storage
      sessionStorage.removeItem('vexa_token');
      sessionStorage.removeItem('vexa_user');
      sessionStorage.removeItem('vexa_business');

      // Always clear localStorage as well so logging out clears persistent login credentials
      localStorage.removeItem('vexa_token');
      localStorage.removeItem('vexa_user');
      localStorage.removeItem('vexa_business');

      if (options.redirect !== false) {
        window.location.href = options.targetUrl || targetRedirect;
      }
    }

    set({
      user: null,
      business: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });

    return targetRedirect;
  }
}));
