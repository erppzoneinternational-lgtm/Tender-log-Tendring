import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage, Profile, ThemeMode } from '@/types/database';
import {
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabaseClient';
import {
  supabase as erpSupabase,
  syncErpAllowlistUsers,
} from '@/lib/supabase';
import {
  authorizeGoogleUser,
  backfillRecentMissedNewTenderNotifications,
  connectRealtimeCloudSync,
  getNotificationsForUser,
  getProfiles,
  hydrateStoreFromCloud,
  normalizeGoogleEmail,
  subscribeDataStore,
} from '@/lib/dataStore';
import {
  registerPwaServiceWorker,
  showDeviceNotification,
} from '@/lib/pwaNotifications';
import {
  isFirebaseGoogleBridgeConfigured,
  requestGoogleIdTokenViaFirebase,
} from '@/lib/firebaseAuthBridge';

export const isDemoModeEnabled = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export const googleClientId =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';

export const isGoogleClientConfigured = Boolean(googleClientId);

const ADMIN_SWITCH_STORAGE_KEY = 'pzone_admin_switch_user_id';

/**
 * Pure security resolver for App Admin–only user switching:
 * - Non-admin accounts (`role !== 'app_admin'`) NEVER get `isRealAppAdmin = true`
 *   and ANY `switchedUserId` is strictly ignored so non-admins can never switch users.
 * - Active `app_admin` accounts can switch to any active user profile while keeping
 *   `isRealAppAdmin = true` so they can switch back at any time.
 */
export function resolveEffectiveActiveUser(
  authenticatedUser: Profile | null,
  switchedUserId: string | null,
  profiles: Profile[]
): {
  user: Profile | null;
  isRealAppAdmin: boolean;
  isSwitchingUser: boolean;
} {
  if (!authenticatedUser) {
    return { user: null, isRealAppAdmin: false, isSwitchingUser: false };
  }

  const latestSelf =
    profiles.find(
      (p) =>
        p.id === authenticatedUser.id ||
        normalizeGoogleEmail(p.email) === normalizeGoogleEmail(authenticatedUser.email)
    ) || authenticatedUser;

  if (!latestSelf.active) {
    return { user: null, isRealAppAdmin: false, isSwitchingUser: false };
  }

  const isRealAppAdmin = latestSelf.role === 'app_admin';
  if (!isRealAppAdmin) {
    return {
      user: latestSelf,
      isRealAppAdmin: false,
      isSwitchingUser: false,
    };
  }

  if (switchedUserId && switchedUserId !== latestSelf.id) {
    const target = profiles.find((p) => p.id === switchedUserId && p.active);
    if (target) {
      return {
        user: target,
        isRealAppAdmin: true,
        isSwitchingUser: true,
      };
    }
  }

  return {
    user: latestSelf,
    isRealAppAdmin: true,
    isSwitchingUser: false,
  };
}

function decodeGoogleJwtPayload(token: string): {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function linkProfileAuthUserIdIfNeeded(
  profile: Profile & { auth_user_id?: string | null },
  authUserId?: string | null
): Promise<Profile> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (
    !authUserId ||
    !uuidRegex.test(authUserId) ||
    profile.auth_user_id === authUserId
  ) {
    return profile;
  }

  try {
    await supabase
      .from('profiles')
      .update({ auth_user_id: authUserId })
      .eq('id', profile.id);
  } catch {
    // Non-blocking: `tr_auth_users_link_profile` trigger already links `auth_user_id` on insert
  }

  return profile;
}

async function syncAllDb1ProfilesToErpAllowlist(): Promise<void> {
  try {
    const [{ data: dbProfiles }, { data: matrixRows }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase
        .from('lookup_values')
        .select('code, metadata')
        .eq('category', 'user_access_matrix'),
    ]);

    const matrixByEmail = new Map<string, Record<string, unknown>>();
    if (Array.isArray(matrixRows)) {
      for (const m of matrixRows) {
        if (typeof m?.code === 'string' && m.metadata && typeof m.metadata === 'object') {
          matrixByEmail.set(
            m.code.trim().toLowerCase(),
            m.metadata as Record<string, unknown>
          );
        }
      }
    }

    const sourceProfiles =
      Array.isArray(dbProfiles) && dbProfiles.length > 0 ? dbProfiles : getProfiles();

    const merged = sourceProfiles.map((p: Record<string, unknown>) => {
      const em = typeof p.email === 'string' ? p.email.trim().toLowerCase() : '';
      const meta = em ? matrixByEmail.get(em) : undefined;
      return {
        ...p,
        role: (meta?.role_preset as string) || p.role,
        module_permissions:
          (meta?.module_permissions as Record<string, string>) || p.module_permissions,
      };
    });

    await syncErpAllowlistUsers(merged);
  } catch (err) {
    console.warn('[Auth] Warning syncing ERP allowlist:', err);
  }
}

function buildAllowlistErrorMessage(
  email: string,
  reason?: 'invalid_email' | 'not_in_list' | 'inactive'
): string {
  const clean = normalizeGoogleEmail(email || '');
  if (reason === 'invalid_email') {
    return 'Please enter a valid Gmail or Google email address (e.g. name@gmail.com).';
  }
  if (reason === 'inactive') {
    return `Access denied: '${clean}' is deactivated. Please ask an App Admin to re-activate your account in Admin → Users.`;
  }
  return `Access denied: '${clean}' is not in the authorized Gmail list. An App Admin must add your Gmail in Admin → Users before you can sign in.`;
}

interface AppContextValue {
  /** Effective active profile (either `authenticatedUser` or the user selected by an App Admin) */
  user: Profile | null;
  /** Underlying real signed-in Google user profile */
  authenticatedUser: Profile | null;
  /** True ONLY when the real signed-in user is an active `app_admin` */
  isRealAppAdmin: boolean;
  /** True when an `app_admin` is currently viewing/acting as another user */
  isSwitchingUser: boolean;
  authError: string | null;
  clearAuthError: () => void;
  theme: ThemeMode;
  resolvedDark: boolean;
  language: AppLanguage;
  lang: AppLanguage;
  isRtl: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;
  unreadNotificationsCount: number;
  setTheme: (mode: ThemeMode) => void;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  /** Restricted exclusively to real `app_admin` users; no-op for all other roles */
  switchActiveUser: (userId: string | null) => void;
  resetSwitchedUser: () => void;
  signInWithGoogle: (emailForLocalFlow?: string) => Promise<{ error?: string }>;
  signInWithGoogleCredential: (jwtCredential: string) => Promise<{ error?: string }>;
  loginWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [authError, setAuthError] = useState<string | null>(null);

  const [authenticatedUser, setAuthenticatedUser] = useState<Profile | null>(() => {
    try {
      if (localStorage.getItem('pzone_signed_out') === 'true') {
        return null;
      }

      // When Supabase Cloud Auth is configured, require a real Google / Supabase JWT session
      // so Row-Level Security (RLS) loads all real Gmail users & data from Supabase PostgreSQL.
      if (!isSupabaseConfigured) {
        const savedEmail = localStorage.getItem('pzone_session_email');
        if (!savedEmail) {
          return null;
        }
        const check = authorizeGoogleUser(savedEmail);
        if (check.allowed && check.profile) {
          return check.profile;
        }
        localStorage.removeItem('pzone_session_email');
        return null;
      }
    } catch {
      // ignore storage errors
    }

    return null;
  });

  const [switchedUserId, setSwitchedUserId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SWITCH_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem('pzone_theme') as ThemeMode) || 'light';
    } catch {
      return 'light';
    }
  });

  const [resolvedDark, setResolvedDark] = useState<boolean>(false);

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      return (localStorage.getItem('pzone_lang') as AppLanguage) || 'en';
    } catch {
      return 'en';
    }
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [storeTick, setStoreTick] = useState(0);
  const seenNotifIdsRef = useRef<{ userId: string | null; ids: Set<string> }>({
    userId: null,
    ids: new Set(),
  });

  useEffect(() => {
    void registerPwaServiceWorker();
    return subscribeDataStore(() => setStoreTick((n) => n + 1));
  }, []);

  const profiles = useMemo(() => {
    void storeTick;
    return getProfiles();
  }, [storeTick]);

  // Keep active authenticated session synced with Admin Users allowlist changes
  useEffect(() => {
    if (!authenticatedUser) return;
    const live = profiles.find(
      (p) =>
        p.id === authenticatedUser.id ||
        normalizeGoogleEmail(p.email) === normalizeGoogleEmail(authenticatedUser.email)
    );
    if (!live || !live.active) {
      if (!isSupabaseConfigured) {
        setAuthenticatedUser(null);
        setSwitchedUserId(null);
        setAuthError(
          buildAllowlistErrorMessage(
            authenticatedUser.email,
            !live ? 'not_in_list' : 'inactive'
          )
        );
        try {
          localStorage.removeItem('pzone_session_email');
          sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
          localStorage.setItem('pzone_signed_out', 'true');
        } catch {
          // ignore
        }
      }
      return;
    }

    if (
      live.id !== authenticatedUser.id ||
      live.full_name !== authenticatedUser.full_name ||
      live.full_name_ar !== authenticatedUser.full_name_ar ||
      live.email !== authenticatedUser.email ||
      live.role !== authenticatedUser.role ||
      live.team !== authenticatedUser.team ||
      live.phone !== authenticatedUser.phone ||
      live.can_access_commercial_overheads !==
        authenticatedUser.can_access_commercial_overheads ||
      JSON.stringify(live.module_permissions || {}) !==
        JSON.stringify(authenticatedUser.module_permissions || {})
    ) {
      setAuthenticatedUser({
        ...live,
        avatar_url: authenticatedUser.avatar_url || live.avatar_url,
      });
      if (live.role !== 'app_admin') {
        setSwitchedUserId(null);
        try {
          sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      try {
        localStorage.setItem('pzone_session_email', live.email);
      } catch {
        // ignore
      }
    }
  }, [profiles, authenticatedUser]);

  const { user, isRealAppAdmin, isSwitchingUser } = useMemo(
    () => resolveEffectiveActiveUser(authenticatedUser, switchedUserId, profiles),
    [authenticatedUser, switchedUserId, profiles]
  );

  // Hydrate cloud data, start Supabase Realtime sync, and run automatic focus + 15s live sync
  // so newly registered tenders & notifications arrive even if Supabase Realtime publication isn't configured
  useEffect(() => {
    if (!isSupabaseConfigured || !authenticatedUser) return;
    let stopRealtime: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let active = true;

    const refreshLiveTables = () => {
      if (!active || document.visibilityState !== 'visible') return;
      void hydrateStoreFromCloud([
        'profiles',
        'lookup_values',
        'tenders',
        'proposal_components',
        'tender_assignments',
        'tasks',
        'task_comments',
        'notifications',
      ]).then(() => {
        if (active && authenticatedUser?.id) {
          backfillRecentMissedNewTenderNotifications(authenticatedUser.id);
        }
      });
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshLiveTables();
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return;
      void hydrateStoreFromCloud().then(() => {
        if (active && authenticatedUser?.id) {
          backfillRecentMissedNewTenderNotifications(authenticatedUser.id);
        }
      });
      stopRealtime = connectRealtimeCloudSync();
      pollTimer = setInterval(refreshLiveTables, 15000);
      window.addEventListener('focus', handleVisibilityOrFocus);
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    });

    return () => {
      active = false;
      stopRealtime?.();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [authenticatedUser?.id]);

  const userNotifications = user ? getNotificationsForUser(user.id) : [];
  const unreadNotificationsCount = userNotifications.filter((n) => !n.read_at).length;

  // Trigger OS / Home-Screen PWA notification when a brand-new unread alert arrives for the active user
  useEffect(() => {
    if (!user) {
      seenNotifIdsRef.current = { userId: null, ids: new Set() };
      return;
    }
    const items = getNotificationsForUser(user.id);
    const storageKey = `pzone_shown_device_notifs_${user.id}`;
    let persistedShown = new Set<string>();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        persistedShown = new Set(JSON.parse(raw) as string[]);
      }
    } catch {
      // ignore storage parse issues
    }

    const isInitialMountForUser = seenNotifIdsRef.current.userId !== user.id;
    if (isInitialMountForUser) {
      seenNotifIdsRef.current = {
        userId: user.id,
        ids: new Set(persistedShown),
      };
    }

    const nowMs = Date.now();
    let changedPersisted = false;

    for (const item of items) {
      if (seenNotifIdsRef.current.ids.has(item.id)) continue;
      seenNotifIdsRef.current.ids.add(item.id);
      persistedShown.add(item.id);
      changedPersisted = true;

      if (!item.read_at) {
        const createdMs = Date.parse(item.created_at);
        const isRecent =
          Number.isNaN(createdMs) || nowMs - createdMs <= 15 * 60 * 1000;
        if (!isInitialMountForUser || isRecent) {
          const alertTitle = language === 'ar' ? item.title_ar : item.title_en;
          const alertBody = language === 'ar' ? item.message_ar : item.message_en;
          const alertUrl = item.tender_id
            ? `/tenders/${item.tender_id}`
            : '/notifications';

          void showDeviceNotification({
            title: alertTitle,
            body: alertBody,
            url: alertUrl,
            tag: item.id,
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('pzone-live-notif-toast', {
                detail: {
                  id: item.id,
                  title: alertTitle,
                  body: alertBody,
                  url: alertUrl,
                  proposalCode: item.proposal_code || null,
                },
              })
            );
          }
        }
      }
    }

    if (changedPersisted) {
      try {
        const recentSlice = Array.from(persistedShown).slice(-250);
        localStorage.setItem(storageKey, JSON.stringify(recentSlice));
      } catch {
        // ignore quota issues
      }
    }
  }, [storeTick, user, language]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setResolvedDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();
    try {
      localStorage.setItem('pzone_theme', theme);
    } catch {
      // ignore
    }

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('pzone_lang', language);
    } catch {
      // ignore
    }
  }, [language, i18n]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;

    const verifyAndLoadSupabaseProfile = async (
      authUserId: string,
      authEmail?: string | null
    ) => {
      const normalizedEmail = normalizeGoogleEmail(authEmail || '');

      let profileData: Profile | null = null;

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const byAuthLink = uuidRegex.test(authUserId)
        ? await supabase
            .from('profiles')
            .select('*')
            .or(`id.eq.${authUserId},auth_user_id.eq.${authUserId}`)
            .maybeSingle()
        : { data: null };

      if (byAuthLink.data) {
        profileData = byAuthLink.data as Profile;
      } else if (normalizedEmail) {
        const byEmail = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', normalizedEmail)
          .maybeSingle();
        if (byEmail.data) {
          profileData = byEmail.data as Profile;
        }
      }

      if (!profileData && normalizedEmail) {
        const localMatch = authorizeGoogleUser(normalizedEmail);
        if (localMatch.profile) {
          profileData = localMatch.profile;
        }
      }

      if (cancelled) return;

      if (!profileData) {
        await supabase.auth.signOut();
        if (!cancelled) {
          setAuthenticatedUser(null);
          setSwitchedUserId(null);
          setAuthError(
            buildAllowlistErrorMessage(normalizedEmail || 'Unknown Gmail', 'not_in_list')
          );
        }
        return;
      }

      if (!profileData.active) {
        await supabase.auth.signOut();
        if (!cancelled) {
          setAuthenticatedUser(null);
          setSwitchedUserId(null);
          setAuthError(buildAllowlistErrorMessage(profileData.email, 'inactive'));
        }
        return;
      }

      profileData = await linkProfileAuthUserIdIfNeeded(profileData, authUserId);
      if (cancelled) return;

      setAuthError(null);
      setAuthenticatedUser(profileData);
      if (profileData.role === 'app_admin') {
        void syncAllDb1ProfilesToErpAllowlist();
      }
      void hydrateStoreFromCloud().then(() => {
        if (profileData && profileData.role === 'app_admin') {
          void syncErpAllowlistUsers(getProfiles());
        }
      });
      if (profileData.role !== 'app_admin') {
        setSwitchedUserId(null);
        try {
          sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      try {
        localStorage.removeItem('pzone_signed_out');
        localStorage.setItem('pzone_session_email', profileData.email);
      } catch {
        // ignore
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const { data: erpSess } = await erpSupabase.auth.getSession();
          if (!erpSess?.session?.user) {
            // Ensure BOTH Database 1 and Database 2 hold an active authenticated JWT session
            // so ERP writes (`tender_log`, `proposal_data_entry`, `proposal_breakdown_items`) never fail RLS.
            await supabase.auth.signOut();
            if (!cancelled) {
              setAuthenticatedUser(null);
              setAuthError(
                'Dual-Database RLS active: Please click Sign in with Google once to authenticate both Tendering & ERP databases.'
              );
            }
            return;
          }
        } catch {
          // ignore network check errors
        }
        void verifyAndLoadSupabaseProfile(session.user.id, session.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void verifyAndLoadSupabaseProfile(session.user.id, session.user.email);
      } else if (!cancelled && event === 'SIGNED_OUT') {
        setAuthenticatedUser(null);
        setSwitchedUserId(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const switchActiveUser = useCallback(
    (targetUserId: string | null) => {
      if (
        !authenticatedUser ||
        !authenticatedUser.active ||
        authenticatedUser.role !== 'app_admin'
      ) {
        return;
      }

      if (!targetUserId || targetUserId === authenticatedUser.id) {
        setSwitchedUserId(null);
        try {
          sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
        } catch {
          // ignore
        }
        return;
      }

      const found = getProfiles().find((p) => p.id === targetUserId && p.active);
      if (!found) {
        return;
      }

      setSwitchedUserId(found.id);
      try {
        sessionStorage.setItem(ADMIN_SWITCH_STORAGE_KEY, found.id);
      } catch {
        // ignore
      }
    },
    [authenticatedUser]
  );

  const resetSwitchedUser = useCallback(() => {
    setSwitchedUserId(null);
    try {
      sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const signInWithGoogleCredential = useCallback(
    async (jwtCredential: string): Promise<{ error?: string }> => {
      setAuthError(null);

      if (isSupabaseConfigured) {
        const [{ data, error }, erpAuthRes] = await Promise.all([
          supabase.auth.signInWithIdToken({
            provider: 'google',
            token: jwtCredential,
          }),
          erpSupabase.auth
            .signInWithIdToken({
              provider: 'google',
              token: jwtCredential,
            })
            .catch((err) => ({ data: null, error: err })),
        ]);
        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }
        if (erpAuthRes?.error) {
          const retryErp = await erpSupabase.auth
            .signInWithIdToken({
              provider: 'google',
              token: jwtCredential,
            })
            .catch((err) => ({ data: null, error: err }));
          if (retryErp?.error) {
            console.warn('[Auth] ERP Database JWT sign-in warning:', retryErp.error);
          }
        }
        if (data.user?.email) {
          const clean = normalizeGoogleEmail(data.user.email);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', clean)
            .maybeSingle();

          const localCheck = authorizeGoogleUser(clean);
          const resolvedProfile =
            (profileData as Profile | null) || localCheck.profile || null;

          if (!resolvedProfile || !resolvedProfile.active) {
            await supabase.auth.signOut();
            try {
              await erpSupabase.auth.signOut();
            } catch {
              // ignore
            }
            const msg = buildAllowlistErrorMessage(
              clean,
              !resolvedProfile ? 'not_in_list' : 'inactive'
            );
            setAuthError(msg);
            return { error: msg };
          }

          const alignedProfile = await linkProfileAuthUserIdIfNeeded(
            resolvedProfile,
            data.user.id
          );

          if (alignedProfile.role === 'app_admin') {
            await syncAllDb1ProfilesToErpAllowlist();
          }

          setAuthenticatedUser(alignedProfile);
          setSwitchedUserId(null);
          try {
            localStorage.removeItem('pzone_signed_out');
            localStorage.setItem('pzone_session_email', alignedProfile.email);
          } catch {
            // ignore
          }
          return {};
        }
        return {};
      }

      const payload = decodeGoogleJwtPayload(jwtCredential);
      if (!payload?.email || payload.email_verified === false) {
        const msg = 'Google credential verification failed or email is unverified.';
        setAuthError(msg);
        return { error: msg };
      }

      const check = authorizeGoogleUser(payload.email);
      if (!check.allowed || !check.profile) {
        const msg = buildAllowlistErrorMessage(payload.email, check.reason);
        setAuthError(msg);
        return { error: msg };
      }

      const signedInProfile: Profile = {
        ...check.profile,
        avatar_url: payload.picture || check.profile.avatar_url,
      };

      setAuthenticatedUser(signedInProfile);
      setSwitchedUserId(null);
      try {
        localStorage.removeItem('pzone_signed_out');
        sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
        localStorage.setItem('pzone_session_email', signedInProfile.email);
      } catch {
        // ignore
      }
      return {};
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (emailForLocalFlow?: string): Promise<{ error?: string }> => {
      setAuthError(null);

      // 1. Firebase Google Sign-In Popup -> Supabase `signInWithIdToken` Bridge (zero Google Cloud Console needed)
      if (!emailForLocalFlow && isFirebaseGoogleBridgeConfigured) {
        const fbRes = await requestGoogleIdTokenViaFirebase();
        if (fbRes.error || !fbRes.idToken) {
          const msg = fbRes.error || 'Google Sign-In failed.';
          setAuthError(msg);
          return { error: msg };
        }
        return signInWithGoogleCredential(fbRes.idToken);
      }

      // 2. Standard Supabase OAuth Google Redirect Flow when configured directly
      if (isSupabaseConfigured && !emailForLocalFlow) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }
        return {};
      }

      // 3. Local / Allowlist-Verified Flow — STRICTLY blocked when Supabase Cloud Auth is active
      //    so unverified email strings can never establish a session without Google OAuth / JWT proof.
      if (isSupabaseConfigured && import.meta.env.MODE !== 'test') {
        const msg =
          'Direct email sign-in is disabled. Please click Sign in with Google to verify your account.';
        setAuthError(msg);
        return { error: msg };
      }

      const candidateEmail = emailForLocalFlow ?? '';
      const check = authorizeGoogleUser(candidateEmail);
      if (!check.allowed || !check.profile) {
        const msg = buildAllowlistErrorMessage(candidateEmail, check.reason);
        setAuthError(msg);
        return { error: msg };
      }

      setAuthenticatedUser(check.profile);
      setSwitchedUserId(null);
      try {
        localStorage.removeItem('pzone_signed_out');
        sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
        localStorage.setItem('pzone_session_email', check.profile.email);
      } catch {
        // ignore
      }
      return {};
    },
    [signInWithGoogleCredential]
  );

  const loginWithEmail = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      return signInWithGoogle(email);
    },
    [signInWithGoogle]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      await erpSupabase.auth.signOut();
    } catch {
      // ignore
    }
    setAuthError(null);
    setAuthenticatedUser(null);
    setSwitchedUserId(null);
    try {
      localStorage.setItem('pzone_signed_out', 'true');
      localStorage.removeItem('pzone_session_email');
      localStorage.removeItem('pzone_session_role');
      sessionStorage.removeItem(ADMIN_SWITCH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        authenticatedUser,
        isRealAppAdmin,
        isSwitchingUser,
        authError,
        clearAuthError,
        theme,
        resolvedDark,
        language,
        lang: language,
        isRtl: language === 'ar',
        sidebarCollapsed,
        mobileMenuOpen,
        commandPaletteOpen,
        unreadNotificationsCount,
        setTheme,
        setLanguage,
        toggleLanguage,
        setSidebarCollapsed,
        setMobileMenuOpen,
        setCommandPaletteOpen,
        switchActiveUser,
        resetSwitchedUser,
        signInWithGoogle,
        signInWithGoogleCredential,
        loginWithEmail,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
