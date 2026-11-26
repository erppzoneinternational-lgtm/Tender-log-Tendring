import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  FileSpreadsheet,
  FileText,
  HardHat,
  Home,
  Menu,
  Monitor,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Table,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getProfiles, subscribeDataStore } from '@/lib/dataStore';
import {
  canManageAdmin,
  canManageFxAndCatalog,
  canViewModule,
} from '@/lib/permissions';
import type { ThemeMode } from '@/types/database';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const {
    user,
    authenticatedUser,
    isRealAppAdmin,
    isSwitchingUser,
    theme,
    setTheme,
    language,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    isRtl,
    unreadNotificationsCount,
    switchActiveUser,
    resetSwitchedUser,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return subscribeDataStore(() => setStoreVersion((v) => v + 1));
  }, []);

  const activeUsers = useMemo(() => {
    void storeVersion;
    return getProfiles().filter((p) => p.active);
  }, [storeVersion]);

  type NavItem = {
    to: string;
    icon: typeof Home;
    label: string;
    end?: boolean;
    badge?: number;
  };

  const topNavItems: NavItem[] = [
    { to: '/', icon: Home, label: t('nav.home'), end: true },
    ...(user && canViewModule(user, 'tender_log')
      ? [{ to: '/tenders', icon: FileSpreadsheet, label: t('nav.tenders') }]
      : []),
    ...(user && canViewModule(user, 'kanban_team')
      ? [{ to: '/board', icon: Table, label: t('nav.board') }]
      : []),
    ...(user && canViewModule(user, 'analytics_reports')
      ? [
          { to: '/dashboard', icon: BarChart3, label: t('nav.dashboard') },
          { to: '/reports', icon: FileText, label: t('nav.reports') },
        ]
      : []),
  ];

  const erpGroupItems: NavItem[] = [
    ...(user && canViewModule(user, 'erp_geometry')
      ? [
          {
            to: '/erp/water-features',
            icon: Waves,
            label:
              language === 'ar'
                ? 'المسطحات المائية والمواصفات'
                : 'Water Features & Specs',
          },
        ]
      : []),
    ...(user && canViewModule(user, 'erp_civil')
      ? [
          {
            to: '/erp/structural-works',
            icon: HardHat,
            label:
              language === 'ar'
                ? 'الأعمال المدنية والتشطيبات'
                : 'Civil & Finishes Engine',
          },
        ]
      : []),
    ...(user && canViewModule(user, 'erp_mep')
      ? [
          {
            to: '/erp/wf-electromechanical',
            icon: Cpu,
            label:
              language === 'ar'
                ? 'محرك الكهروميكانيكا (MEP)'
                : 'MEP Estimation Engine',
          },
        ]
      : []),
    ...(user && canViewModule(user, 'erp_overheads')
      ? [
          {
            to: '/erp/commercial-bid',
            icon: TrendingUp,
            label:
              language === 'ar'
                ? 'المصاريف وسعر العطاء'
                : 'Commercial & Overheads',
          },
        ]
      : []),
  ];

  const isErpGroupActive = useMemo(() => {
    const p = location.pathname;
    return (
      p.startsWith('/erp/water-features') ||
      p.startsWith('/erp/proposals') ||
      p.startsWith('/erp/structural-works') ||
      p.startsWith('/erp/wf-electromechanical') ||
      p.startsWith('/erp/commercial-bid')
    );
  }, [location.pathname]);

  const [erpGroupOpen, setErpGroupOpen] = useState<boolean>(() => {
    const p = window.location.pathname;
    return (
      p.startsWith('/erp/water-features') ||
      p.startsWith('/erp/proposals') ||
      p.startsWith('/erp/structural-works') ||
      p.startsWith('/erp/wf-electromechanical') ||
      p.startsWith('/erp/commercial-bid')
    );
  });

  useEffect(() => {
    if (isErpGroupActive) {
      setErpGroupOpen(true);
    }
  }, [isErpGroupActive]);

  const erpGroupLabel =
    language === 'ar' ? 'التسعير الذكي (ERP)' : 'Intelligent Tendering ERP';

  const bottomNavItems: NavItem[] = [
    {
      to: '/notifications',
      icon: Bell,
      label: t('nav.notifications'),
      badge: unreadNotificationsCount,
    },
    ...(user && canViewModule(user, 'catalog_fx')
      ? [
          {
            to: '/erp/database',
            icon: Database,
            label:
              language === 'ar'
                ? 'الكتالوج وقاعدة البيانات'
                : 'Master Catalog & DB',
          },
        ]
      : []),
    ...(user && !canManageAdmin(user.role) && canManageFxAndCatalog(user)
      ? [
          {
            to: '/admin/rates',
            icon: Settings,
            label:
              language === 'ar'
                ? 'إدارة أسعار الصرف'
                : 'FX Exchange Rates',
          },
        ]
      : []),
    ...(user && canManageAdmin(user.role)
      ? [{ to: '/admin', icon: Settings, label: t('nav.admin') }]
      : []),
  ];

  // Primary 4 mobile bottom-bar tabs + "More" drawer trigger
  const mobilePrimaryTabs = [
    { to: '/', icon: Home, label: t('nav.home'), end: true },
    { to: '/tenders', icon: FileSpreadsheet, label: t('nav.tenders') },
    ...(user && canViewModule(user, 'kanban_team')
      ? [{ to: '/board', icon: Table, label: t('nav.board') }]
      : [{ to: '/dashboard', icon: BarChart3, label: t('nav.dashboard') }]),
    {
      to: '/notifications',
      icon: Bell,
      label: t('nav.notifications'),
      badge: unreadNotificationsCount,
    },
  ];

  const CollapseIcon = isRtl
    ? sidebarCollapsed
      ? ChevronLeft
      : ChevronRight
    : sidebarCollapsed
      ? ChevronRight
      : ChevronLeft;

  const themeOptions: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: t('topbar.themeLight') },
    { mode: 'dark', icon: Moon, label: t('topbar.themeDark') },
    { mode: 'system', icon: Monitor, label: t('topbar.themeSystem') },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (lg+) */}
      <aside
        className={`hidden lg:flex sticky top-3 h-[calc(100vh-1.5rem)] z-20 flex-col shrink-0 m-3 rounded-3xl bg-gradient-to-b from-[#162044]/95 via-[#0B132B]/95 to-[#060B18]/98 text-white border border-white/15 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all duration-300 select-none overflow-hidden ${
          sidebarCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        <div className="h-1 w-full bg-ribbon-gradient shrink-0" />
        <div className="pointer-events-none absolute -top-16 -start-16 w-44 h-44 rounded-full bg-pzone-teal/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 -end-16 w-40 h-40 rounded-full bg-pzone-magenta/20 blur-3xl" />

        <div className="relative h-20 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarCollapsed ? (
            <div className="relative mx-auto">
              <div className="absolute -inset-1.5 rounded-full bg-pzone-teal/30 blur-md animate-pulse-ring" />
              <img
                src="/brand/Favicon.png"
                alt="P.ZONE"
                className="relative w-10 h-10 object-contain transition-transform duration-300 hover:scale-110"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1 overflow-hidden w-full">
              <div className="flex items-center justify-between">
                <img
                  src="/brand/Company_Horizontal_Logo_Logo__White_.png"
                  alt="P.ZONE — Only Results Matter"
                  className="h-8 w-auto object-contain drop-shadow-md"
                />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-200/70 tracking-wider uppercase">
                <Waves className="w-3 h-3 text-pzone-cyan shrink-0" />
                <span className="truncate">Hydro-Command Deck</span>
              </div>
            </div>
          )}
        </div>

        <nav className="relative flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {topNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-pzone-teal via-pzone-teal/85 to-pzone-seagreen/80 text-white shadow-lg shadow-pzone-teal/30 border border-white/25'
                      : 'text-white/70 hover:bg-white/8 hover:text-white border border-transparent hover:border-white/10'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-1.5 start-1 w-1 rounded-full bg-white shadow-[0_0_8px_#00F0FF]" />
                    )}
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                          : 'text-cyan-200/80'
                      }`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 tracking-tight">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Grouped Intelligent Tendering ERP Section (after Period Reports) */}
          {erpGroupItems.length > 0 && (
            <div className="pt-1 pb-0.5 space-y-1">
              <button
                type="button"
                title={sidebarCollapsed ? erpGroupLabel : undefined}
                onClick={() => {
                  if (sidebarCollapsed) {
                    navigate(erpGroupItems[0].to);
                  } else {
                    setErpGroupOpen((prev) => !prev);
                  }
                }}
                className={`w-full group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isErpGroupActive
                    ? sidebarCollapsed
                      ? 'bg-gradient-to-r from-pzone-teal via-pzone-teal/85 to-pzone-seagreen/80 text-white shadow-lg shadow-pzone-teal/30 border border-white/25'
                      : 'bg-white/10 text-white border border-cyan-400/30 shadow-sm'
                    : 'text-white/75 hover:bg-white/8 hover:text-white border border-transparent hover:border-white/10'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Sparkles
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isErpGroupActive ? 'text-pzone-cyan' : 'text-cyan-200/80'
                  }`}
                />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate flex-1 text-start tracking-tight">
                      {erpGroupLabel}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-cyan-200/70 transition-transform duration-200 ${
                        erpGroupOpen ? 'rotate-180 text-pzone-cyan' : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {!sidebarCollapsed && erpGroupOpen && (
                <div className="ms-5 ps-2.5 border-s border-cyan-400/25 space-y-1">
                  {erpGroupItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-pzone-teal via-pzone-teal/85 to-pzone-seagreen/80 text-white shadow-md shadow-pzone-teal/25 border border-white/20'
                              : 'text-white/65 hover:bg-white/8 hover:text-white border border-transparent'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <SubIcon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-cyan-200/75'
                              }`}
                            />
                            <span className="truncate flex-1 tracking-tight">
                              {subItem.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-pzone-teal via-pzone-teal/85 to-pzone-seagreen/80 text-white shadow-lg shadow-pzone-teal/30 border border-white/25'
                      : 'text-white/70 hover:bg-white/8 hover:text-white border border-transparent hover:border-white/10'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-1.5 start-1 w-1 rounded-full bg-white shadow-[0_0_8px_#00F0FF]" />
                    )}
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                          : 'text-cyan-200/80'
                      }`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 tracking-tight">
                        {item.label}
                      </span>
                    )}
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`inline-flex items-center justify-center text-[11px] font-bold rounded-full bg-gradient-to-r from-pzone-magenta to-pzone-orange text-white px-2 py-0.5 font-tabular shadow-md shadow-pzone-magenta/40 ${
                          sidebarCollapsed
                            ? 'absolute top-1 end-1 px-1.5 text-[9px]'
                            : ''
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 bg-black/20">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? t('nav.expand') : t('nav.collapse')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CollapseIcon className="w-4 h-4 text-pzone-cyan" />
            {!sidebarCollapsed && (
              <span>{sidebarCollapsed ? t('nav.expand') : t('nav.collapse')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER (< lg) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-76 max-w-[85vw] h-full flex flex-col bg-gradient-to-b from-[#162044] via-[#0B132B] to-[#060B18] text-white border-e border-white/15 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-ribbon-gradient shrink-0" />
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <img
                src="/brand/Company_Horizontal_Logo_Logo__White_.png"
                alt="P.ZONE"
                className="h-7 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1.5">
              {topNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pzone-teal to-pzone-seagreen text-white shadow-lg border border-white/20'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0 text-cyan-200" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </NavLink>
                );
              })}

              {erpGroupItems.length > 0 && (
                <div className="pt-1 pb-0.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => setErpGroupOpen((prev) => !prev)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                      isErpGroupActive
                        ? 'bg-white/10 text-white border border-cyan-400/30'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 shrink-0 text-pzone-cyan" />
                    <span className="flex-1 text-start truncate">{erpGroupLabel}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-cyan-200/70 transition-transform ${
                        erpGroupOpen ? 'rotate-180 text-pzone-cyan' : ''
                      }`}
                    />
                  </button>

                  {erpGroupOpen && (
                    <div className="ms-5 ps-2.5 border-s border-cyan-400/25 space-y-1">
                      {erpGroupItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                isActive
                                  ? 'bg-gradient-to-r from-pzone-teal to-pzone-seagreen text-white shadow-md border border-white/20'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }`
                            }
                          >
                            <SubIcon className="w-4 h-4 shrink-0 text-cyan-200" />
                            <span className="flex-1 truncate">{subItem.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pzone-teal to-pzone-seagreen text-white shadow-lg border border-white/20'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0 text-cyan-200" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pzone-magenta text-white font-tabular">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Theme & App Admin–Exclusive User Switcher */}
            <div className="p-4 border-t border-white/10 space-y-3 bg-black/25">
              {user && isRealAppAdmin && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-200/70 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-pzone-cyan" />
                      {isSwitchingUser
                        ? language === 'ar'
                          ? 'عرض بصلاحية مستخدم'
                          : 'Viewing as User'
                        : language === 'ar'
                          ? 'تبديل المستخدم (Admin)'
                          : 'Switch User (Admin Only)'}
                    </span>
                    {isSwitchingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          resetSwitchedUser();
                          setMobileMenuOpen(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-pzone-magenta text-white text-[10px] font-bold"
                      >
                        {language === 'ar' ? 'رجوع للمدير' : 'Back to Admin'}
                      </button>
                    )}
                  </div>
                  <select
                    value={user.id}
                    onChange={(e) => {
                      switchActiveUser(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs font-semibold text-white"
                  >
                    {activeUsers.map((p) => {
                      const isSelfAdmin = authenticatedUser?.id === p.id;
                      const baseLabel =
                        language === 'ar' && p.full_name_ar
                          ? `${p.full_name_ar} — ${t(`roles.${p.role}`)}`
                          : `${p.full_name} — ${t(`roles.${p.role}`)}`;
                      return (
                        <option
                          key={p.id}
                          value={p.id}
                          className="bg-[#0B132B] text-white"
                        >
                          {isSelfAdmin ? `${baseLabel} (Admin)` : baseLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = theme === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setTheme(opt.mode)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border ${
                        active
                          ? 'bg-pzone-teal text-white border-white/25'
                          : 'bg-white/5 text-white/70 border-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM MOBILE TAB BAR (< lg) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B132B]/95 backdrop-blur-xl border-t border-white/15 px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] flex items-center justify-around text-white shadow-2xl"
      >
        {mobilePrimaryTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-colors min-w-[56px] ${
                  isActive ? 'text-pzone-cyan font-bold' : 'text-white/65'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[68px]">{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="absolute top-0.5 end-2 min-w-[16px] h-[16px] px-1 rounded-full bg-pzone-magenta text-white text-[9px] font-bold flex items-center justify-center font-tabular">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold text-white/65 hover:text-white min-w-[56px]"
        >
          <Menu className="w-5 h-5" />
          <span>{language === 'ar' ? 'المزيد' : 'More'}</span>
        </button>
      </nav>
    </>
  );
};
