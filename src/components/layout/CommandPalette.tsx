import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Globe,
  Home,
  Moon,
  Search,
  Settings,
  Sun,
  Table,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  canManageAdmin,
  canViewKanbanAndTeamManagement,
} from '@/lib/permissions';

export const CommandPalette: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleLanguage,
    language,
    setTheme,
  } = useApp();
  const [query, setQuery] = useState('');

  if (!commandPaletteOpen) return null;

  const commands = [
    {
      id: 'nav-home',
      label: t('nav.home'),
      group: t('commandPalette.navigation'),
      icon: Home,
      action: () => navigate('/'),
    },
    {
      id: 'nav-tenders',
      label: t('nav.tenders'),
      group: t('commandPalette.navigation'),
      icon: FileSpreadsheet,
      action: () => navigate('/tenders'),
    },
    ...(user && canViewKanbanAndTeamManagement(user)
      ? [
          {
            id: 'nav-board',
            label: t('nav.board'),
            group: t('commandPalette.navigation'),
            icon: Table,
            action: () => navigate('/board'),
          },
        ]
      : []),
    {
      id: 'nav-dashboard',
      label: t('nav.dashboard'),
      group: t('commandPalette.navigation'),
      icon: BarChart3,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-reports',
      label: t('nav.reports'),
      group: t('commandPalette.navigation'),
      icon: FileText,
      action: () => navigate('/reports'),
    },
    ...(user && canManageAdmin(user.role)
      ? [
          {
            id: 'nav-admin',
            label: t('nav.admin'),
            group: t('commandPalette.navigation'),
            icon: Settings,
            action: () => navigate('/admin'),
          },
        ]
      : []),
    {
      id: 'pref-lang',
      label:
        language === 'en'
          ? t('commandPalette.switchToArabic')
          : t('commandPalette.switchToEnglish'),
      group: t('commandPalette.preferences'),
      icon: Globe,
      action: () => toggleLanguage(),
    },
    {
      id: 'pref-light',
      label: `Theme: ${t('topbar.themeLight')}`,
      group: t('commandPalette.preferences'),
      icon: Sun,
      action: () => setTheme('light'),
    },
    {
      id: 'pref-dark',
      label: `Theme: ${t('topbar.themeDark')}`,
      group: t('commandPalette.preferences'),
      icon: Moon,
      action: () => setTheme('dark'),
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-card shadow-2xl overflow-hidden border-ribbon-top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-5 h-5 text-pzone-teal shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('commandPalette.noResults')}
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setCommandPaletteOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-pzone-teal/10 hover:text-pzone-teal transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-pzone-teal" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{item.group}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
