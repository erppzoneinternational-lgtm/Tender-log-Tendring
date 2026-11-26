import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Globe,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { type ThemeMode, type UserRole } from '@/types/database';

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  app_admin: 'bg-pzone-magenta/15 text-pzone-magenta border-pzone-magenta/35',
  commercial_approver:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35',
  tender_manager:
    'bg-pzone-navy/10 text-pzone-navy dark:bg-pzone-teal/20 dark:text-pzone-teal border-pzone-navy/20',
  civil_tender_engineer:
    'bg-pzone-teal/15 text-pzone-teal border-pzone-teal/30',
  mechanical_engineer:
    'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  electrical_engineer:
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  procurement_cost_control:
    'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/35',
  document_control:
    'bg-pzone-orange/15 text-pzone-orange border-pzone-orange/30',
  viewer: 'bg-pzone-slate/20 text-muted-foreground border-border',
};

export const Topbar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    theme,
    setTheme,
    language,
    toggleLanguage,
    setMobileMenuOpen,
    setCommandPaletteOpen,
    unreadNotificationsCount,
    signOut,
  } = useApp();

  const themeOptions: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: t('topbar.themeLight') },
    { mode: 'dark', icon: Moon, label: t('topbar.themeDark') },
    { mode: 'system', icon: Monitor, label: t('topbar.themeSystem') },
  ];

  const displayName =
    language === 'ar' && user?.full_name_ar ? user.full_name_ar : user?.full_name;

  return (
    <header className="mx-2.5 sm:mx-6 lg:mx-7 mt-2.5 sm:mt-3 h-14 sm:h-16 rounded-2xl hydro-glass px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 sticky top-2.5 sm:top-3 z-30">
      {/* Mobile Menu Trigger */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open Navigation Menu"
        className="lg:hidden p-2 rounded-xl bg-muted/70 hover:bg-muted text-foreground border border-border shrink-0"
      >
        <Menu className="w-5 h-5 text-pzone-teal" />
      </button>

      {/* Left / Start: Global Search Trigger (Command Palette Ctrl+K) */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 hover:bg-pzone-teal/10 text-muted-foreground hover:text-foreground text-xs sm:text-sm border border-border hover:border-pzone-teal/50 transition-all flex-1 max-w-xs xl:max-w-sm shadow-inner min-w-0 overflow-hidden"
      >
        <Search className="w-4 h-4 text-pzone-teal group-hover:scale-110 transition-transform shrink-0" />
        <span className="truncate flex-1 min-w-0 text-start">
          {t('topbar.searchPlaceholder')}
        </span>
        <kbd className="hidden xl:inline-flex shrink-0 items-center px-1.5 py-0.5 text-[10px] font-bold bg-card/90 text-pzone-teal rounded-md border border-pzone-teal/30 font-mono shadow-xs">
          {t('topbar.commandHint')}
        </kbd>
      </button>

      {/* Right / End Controls: Language, Theme, Bell, User */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Read-only lock indicator for Viewers */}
        {user?.role === 'viewer' && (
          <span className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Lock className="w-3.5 h-3.5" />
            {t('topbar.readOnlyBadge')}
          </span>
        )}

        {/* Arabic / English Toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-foreground text-xs font-semibold border border-border transition-colors"
          title="Switch Language (AR / EN)"
        >
          <Globe className="w-3.5 h-3.5 text-pzone-teal" />
          <span>{t('topbar.language')}</span>
        </button>

        {/* 3-State Theme Switcher: Light / Dark / System */}
        <div
          className="hidden sm:flex items-center p-1 rounded-xl bg-muted/70 border border-border"
          role="group"
          aria-label="Theme Switcher"
        >
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setTheme(opt.mode)}
                title={opt.label}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-card text-pzone-teal shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden 2xl:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Realtime Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl bg-muted/70 hover:bg-muted text-foreground border border-border transition-colors"
          aria-label={t('nav.notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-pzone-magenta text-white text-[10px] font-bold flex items-center justify-center font-tabular">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile & Role Badge */}
        {user && (
          <div
            className="flex items-center gap-2.5 ps-2 border-s border-border"
            title={`${user.full_name} (${user.email})`}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-pzone-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.full_name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')}
              </div>
            )}
            <div className="hidden md:flex flex-col text-start">
              <span className="text-xs font-semibold text-foreground leading-tight max-w-[140px] truncate">
                {displayName}
              </span>
              <span
                className={`mt-0.5 inline-flex items-center px-2 py-0.2 rounded-md text-[10px] font-semibold border w-fit ${
                  ROLE_BADGE_STYLES[user.role]
                }`}
              >
                {t(`roles.${user.role}`)}
              </span>
            </div>
            <button
              type="button"
              onClick={signOut}
              title={t('topbar.signOut')}
              className="p-2 rounded-xl text-muted-foreground hover:text-pzone-crimson hover:bg-pzone-crimson/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
