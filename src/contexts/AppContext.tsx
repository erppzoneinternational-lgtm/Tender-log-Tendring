import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import type { AppLanguage, Profile, ThemeMode } from '@/types/database';
import {
  isSupabaseConfigured,
  PORTAL_URL,
  supabase,
} from '@/lib/supabaseClient';
import {
  backfillRecentMissedNewTenderNotifications,
  connectRealtimeCloudSync,
  getNotificationsForUser,
  getProfiles,
  hydrateStoreFromCloud,
  normalizeProfileRow,
  setCurrentSessionUser,
  subscribeDataStore,
} from '@/lib/dataStore';
import {
  registerPwaServiceWorker,
  showDeviceNotification,
} from '@/lib/pwaNotifications';

// No login page here: the Portal owns login. This app reads the shared session cookie,
// loads the user's own row from tender.profiles (role and module levels come from the Console), and signs out.
export function goToPortalLogin(): void {
  window.location.replace(
    `${PORTAL_URL}/login?redirect=${encodeURIComponent(window.location.href)}`
  );
}

export async function signOut(): Promise<void> {
  // 'local' = this browser. The cookie is shared, so this signs out of ALL company systems.
  setCurrentSessionUser(null);
  await supabase.auth.signOut({ scope: 'local' });
  window.location.replace(`${PORTAL_URL}/login`);
}

interface AppContextValue {
  user: Profile | null;
  loading: boolean;
  noAccess: boolean;
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
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const NoAccessScreen: React.FC<{
  resolvedDark: boolean;
  onSignOut: () => Promise<void>;
}> = ({ resolvedDark, onSignOut }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-card p-7 shadow-soft dark:shadow-soft-dark space-y-6 border-ribbon-top text-center">
        <div className="flex justify-center">
          <img
            src={
              resolvedDark
                ? '/brand/Company_Horizontal_Logo_Logo__White_.png'
                : '/brand/Horizontal_Logo__black_.png'
            }
            alt={t('brand.name')}
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="w-12 h-12 rounded-2xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {t('noAccess.title')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('noAccess.message')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={PORTAL_URL}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-teal dark:hover:bg-pzone-teal/90 text-white text-xs font-semibold transition-colors text-center"
          >
            {t('noAccess.backToPortal')}
          </a>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('noAccess.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();

  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [noAccess, setNoAccess] = useState<boolean>(false);

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

  // Keep user state synced when hydrated `profiles` updates allowed fields (e.g. `team`)
  useEffect(() => {
    if (!user) return;
    const live = profiles.find((p) => p.id === user.id);
    if (!live) return;
    if (live.active !== true) {
      setCurrentSessionUser(null);
      setUser(null);
      setNoAccess(true);
      return;
    }
    if (
      live.full_name !== user.full_name ||
      live.full_name_ar !== user.full_name_ar ||
      live.email !== user.email ||
      live.role !== user.role ||
      live.team !== user.team ||
      live.phone !== user.phone ||
      live.avatar_url !== user.avatar_url ||
      live.can_access_commercial_overheads !==
        user.can_access_commercial_overheads ||
      JSON.stringify(live.module_permissions || {}) !==
        JSON.stringify(user.module_permissions || {})
    ) {
      setCurrentSessionUser(live);
      setUser(live);
    }
  }, [profiles, user]);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub as string | undefined;
    if (error || !sub) {
      setCurrentSessionUser(null);
      setUser(null);
      setNoAccess(false);
      goToPortalLogin();
      return;
    }

    const { data: row, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sub)
      .maybeSingle();

    if (profileErr || !row || row.active !== true) {
      setCurrentSessionUser(null);
      setUser(null);
      setNoAccess(true);
      setLoading(false);
      return;
    }

    const normalized = normalizeProfileRow(row as Profile);
    setCurrentSessionUser(normalized);
    setNoAccess(false);
    setUser(normalized);
    setLoading(false);
  }, []);

  // Run refresh() on mount and on window 'focus', and handle 'SIGNED_OUT'
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const safeRefresh = async () => {
      if (cancelled) return;
      await refresh();
    };

    void safeRefresh();

    const handleWindowFocus = () => {
      void safeRefresh();
    };
    window.addEventListener('focus', handleWindowFocus);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'SIGNED_OUT') {
        setCurrentSessionUser(null);
        setUser(null);
        setNoAccess(false);
        goToPortalLogin();
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleWindowFocus);
      subscription.unsubscribe();
    };
  }, [refresh]);

  // Hydrate cloud data, start Supabase Realtime sync on schema 'tender', and run 15s live sync
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id || noAccess) return;
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
        if (active) {
          backfillRecentMissedNewTenderNotifications(user.id);
        }
      });
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshLiveTables();
      }
    };

    void hydrateStoreFromCloud().then(() => {
      if (active) {
        backfillRecentMissedNewTenderNotifications(user.id);
      }
    });

    const stopRealtime = connectRealtimeCloudSync();
    const pollTimer = setInterval(refreshLiveTables, 15000);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      active = false;
      stopRealtime();
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [user?.id, noAccess]);

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

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const handleSignOut = useCallback(async () => {
    setUser(null);
    setNoAccess(false);
    await signOut();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        noAccess,
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
        refresh,
        signOut: handleSignOut,
      }}
    >
      {noAccess ? (
        <NoAccessScreen resolvedDark={resolvedDark} onSignOut={handleSignOut} />
      ) : (
        children
      )}
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
