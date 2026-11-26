import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  History,
  ListFilter,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { canManageAdmin } from '@/lib/permissions';

export const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useApp();
  const isFullAdmin = Boolean(user && canManageAdmin(user.role));

  const tabs = [
    ...(isFullAdmin
      ? [
          {
            to: '/admin/users',
            icon: Users,
            label: t('admin.tabs.users'),
          },
          {
            to: '/admin/lookups',
            icon: ListFilter,
            label: t('admin.tabs.lookups'),
          },
        ]
      : []),
    {
      to: '/admin/rates',
      icon: DollarSign,
      label: t('admin.tabs.rates'),
    },
    ...(isFullAdmin
      ? [
          {
            to: '/admin/audit',
            icon: History,
            label: t('admin.tabs.audit'),
          },
        ]
      : []),
  ];

  const badgeLabel = isFullAdmin
    ? 'App Admin Exclusive Console'
    : 'Procurement & FX Rate Console';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Admin Header */}
      <div className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark border-ribbon-top space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pzone-teal uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{badgeLabel}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {t('admin.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('admin.subtitle')}
            </p>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-pzone-navy dark:bg-pzone-teal text-white shadow-sm'
                      : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Active Admin Sub-screen */}
      <Outlet />
    </div>
  );
};
