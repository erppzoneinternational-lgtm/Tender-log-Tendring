import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DollarSign,
  ExternalLink,
  FilePlus2,
  GitBranch,
  HardHat,
  MessageSquare,
  Radar,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  UserCheck,
  Waves,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  dispatchNotification,
  getNotificationPreferences,
  getNotificationsForUser,
  getProfiles,
  getTenders,
  markAllNotificationsRead,
  markNotificationRead,
  runDueAndOverdueScan,
  subscribeDataStore,
  updateNotificationPreferences,
} from '@/lib/dataStore';
import {
  canAccessCommercialOverheads,
  canAccessErpEngineering,
  canManageAdmin,
  canViewKanbanAndTeamManagement,
} from '@/lib/permissions';
import { formatDateTimeCairo } from '@/components/ui/DatePickerInput';
import {
  getDeviceNotificationState,
  isStandalonePwa,
  requestDeviceNotificationPermission,
  showDeviceNotification,
  type DeviceNotificationState,
} from '@/lib/pwaNotifications';
import type { NotificationEventType } from '@/types/database';

const EVENT_TYPE_META: {
  type: NotificationEventType;
  category: 'tender_log' | 'erp';
  labelEn: string;
  labelAr: string;
  icon: React.FC<{ className?: string }>;
  badgeClass: string;
  erpRoute?: string;
}[] = [
  {
    type: 'new_tender',
    category: 'tender_log',
    labelEn: 'New Tender Registered',
    labelAr: 'مناقصة جديدة',
    icon: FilePlus2,
    badgeClass: 'bg-brand-500/15 text-brand-500',
  },
  {
    type: 'new_revision',
    category: 'tender_log',
    labelEn: 'New Revision Created',
    labelAr: 'مراجعة جديدة',
    icon: GitBranch,
    badgeClass: 'bg-purple-500/15 text-purple-400',
  },
  {
    type: 'new_documents',
    category: 'tender_log',
    labelEn: 'Server Document Path Linked',
    labelAr: 'إضافة مسار مستندات',
    icon: FilePlus2,
    badgeClass: 'bg-sky-500/15 text-sky-400',
  },
  {
    type: 'tender_assigned',
    category: 'tender_log',
    labelEn: 'Assigned to Tender',
    labelAr: 'إسناد مناقصة',
    icon: UserCheck,
    badgeClass: 'bg-teal-500/15 text-teal-400',
  },
  {
    type: 'task_finished',
    category: 'tender_log',
    labelEn: 'Discipline / Task Finished',
    labelAr: 'اكتمال مهمة',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    type: 'task_blocked',
    category: 'tender_log',
    labelEn: 'Task Blocked / Waiting',
    labelAr: 'مهمة متوقفة',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-500/15 text-amber-400',
  },
  {
    type: 'pricing_updated',
    category: 'tender_log',
    labelEn: 'Pricing / Component Costs Updated',
    labelAr: 'تحديث التسعير والمكونات',
    icon: DollarSign,
    badgeClass: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    type: 'due_reminder',
    category: 'tender_log',
    labelEn: 'Due Soon / Overdue Alert',
    labelAr: 'تنبيه استحقاق أو تأخير',
    icon: Clock,
    badgeClass: 'bg-rose-500/15 text-rose-400',
  },
  {
    type: 'tender_sent',
    category: 'tender_log',
    labelEn: 'Proposal Sent to Client',
    labelAr: 'تم إرسال العرض',
    icon: Send,
    badgeClass: 'bg-indigo-500/15 text-indigo-400',
  },
  {
    type: 'status_awarded_lost',
    category: 'tender_log',
    labelEn: 'Awarded / Lost Decision',
    labelAr: 'قرار الترسية',
    icon: Award,
    badgeClass: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    type: 'comment_mention',
    category: 'tender_log',
    labelEn: '@Mention in Comment',
    labelAr: 'إشارة في تعليق',
    icon: MessageSquare,
    badgeClass: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    type: 'erp_geometry_ready',
    category: 'erp',
    labelEn: 'ERP Geometry & Basin Saved (Ready for BOQ)',
    labelAr: 'حفظ أبعاد المسطح المائي وغرفة الطلمبات',
    icon: Waves,
    badgeClass: 'bg-sky-500/15 text-sky-400',
    erpRoute: '/erp/water-features',
  },
  {
    type: 'erp_civil_boq_synced',
    category: 'erp',
    labelEn: 'ERP Civil Structural & Finishes BOQ Synced',
    labelAr: 'مزامنة مقايسة الأعمال المدنية والتشطيبات',
    icon: HardHat,
    badgeClass: 'bg-amber-500/15 text-amber-400',
    erpRoute: '/erp/structural-works',
  },
  {
    type: 'erp_mep_boq_synced',
    category: 'erp',
    labelEn: 'ERP Electromechanical (MEP) BOQ Synced',
    labelAr: 'مزامنة مقايسة الأعمال الكهروميكانيكية',
    icon: Cpu,
    badgeClass: 'bg-violet-500/15 text-violet-400',
    erpRoute: '/erp/wf-electromechanical',
  },
  {
    type: 'erp_ready_for_commercial',
    category: 'erp',
    labelEn: 'All 3 Disciplines Priced — Ready for Commercial Bid',
    labelAr: 'اكتمال تسعير التخصصات الثلاثة — جاهز للتسعير التجاري',
    icon: Sparkles,
    badgeClass: 'bg-emerald-500/15 text-emerald-400',
    erpRoute: '/erp/commercial-bid',
  },
  {
    type: 'erp_commercial_bid_set',
    category: 'erp',
    labelEn: 'Commercial Overheads & Final Bid Price Locked',
    labelAr: 'اعتماد المصروفات غير المباشرة والسعر النهائي للعطاء',
    icon: TrendingUp,
    badgeClass: 'bg-teal-500/15 text-teal-400',
    erpRoute: '/erp/commercial-bid',
  },
  {
    type: 'catalog_price_updated',
    category: 'erp',
    labelEn: 'Master Catalog Equipment / Material Rate Updated',
    labelAr: 'تحديث أسعار كتالوج المهمات والمواد',
    icon: Database,
    badgeClass: 'bg-orange-500/15 text-orange-400',
    erpRoute: '/erp/database',
  },
];

export const Notifications: React.FC = () => {
  const { user, isRealAppAdmin, lang } = useApp();
  const navigate = useNavigate();

  const [version, setVersion] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [devicePerm, setDevicePerm] = useState<DeviceNotificationState>(() =>
    getDeviceNotificationState()
  );

  useEffect(() => {
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const notifications = useMemo(
    () => (user ? getNotificationsForUser(user.id) : []),
    [user, version]
  );
  const prefs = useMemo(
    () => (user ? getNotificationPreferences(user.id) : null),
    [user, version]
  );

  if (!user || !prefs) return null;

  const canSeeTeam = canViewKanbanAndTeamManagement(user);
  const visibleEventMeta = canSeeTeam
    ? EVENT_TYPE_META
    : EVENT_TYPE_META.filter(
        (ev) =>
          ev.type !== 'tender_assigned' &&
          ev.type !== 'task_finished' &&
          ev.type !== 'task_blocked'
      );

  const filtered = notifications.filter((n) => {
    if (unreadOnly && n.read_at) return false;
    if (selectedType && n.type !== selectedType) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleToggleMuteType = (eventType: NotificationEventType) => {
    const muted = prefs.muted_event_types || [];
    const next = muted.includes(eventType)
      ? muted.filter((t) => t !== eventType)
      : [...muted, eventType];
    updateNotificationPreferences(user.id, { muted_event_types: next });
  };

  const handleRunDueScan = () => {
    const count = runDueAndOverdueScan();
    setScanMessage(
      count > 0
        ? `Scan complete: ${count} due/overdue reminder notification(s) dispatched.`
        : 'Scan complete: All active due/overdue tenders already have up-to-date alerts.'
    );
    setTimeout(() => setScanMessage(null), 5000);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            In-App Notifications & Event Center
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-rose-500 text-white">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            {canSeeTeam
              ? 'Instant alerts for tender registration, revisions, assignments, finished disciplines, due reminders, and @mentions.'
              : 'Instant alerts for tender registration, revisions, document paths, due reminders, and @mentions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {(isRealAppAdmin || canManageAdmin(user.role)) && (
            <button
              type="button"
              onClick={() => {
                const latestTender = getTenders()[0];
                const recipients = getProfiles()
                  .filter((p) => p.active && p.role !== 'viewer')
                  .map((p) => p.id);
                const targetIds = Array.from(
                  new Set(recipients.length > 0 ? [...recipients, user.id] : [user.id])
                );
                const stamp = new Date().toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const codeLabel = latestTender?.proposal_code || 'PZ-TEST';
                dispatchNotification({
                  recipientIds: targetIds,
                  type: 'new_tender',
                  tender_id: latestTender?.id ?? null,
                  proposal_code: codeLabel,
                  title_en: `New Tender Registered: ${codeLabel} (${stamp})`,
                  title_ar: `تم تسجيل مناقصة جديدة: ${codeLabel} (${stamp})`,
                  message_en: latestTender
                    ? `Live notification check — "${latestTender.proposal_name}" for ${latestTender.owner}.`
                    : `Live notification check dispatched for active team.`,
                  message_ar: latestTender
                    ? `اختبار إشعار فوري — "${latestTender.proposal_name}" للمالك ${latestTender.owner}.`
                    : `اختبار إشعار فوري لفريق العمل.`,
                });
                void showDeviceNotification({
                  title: `New Tender Registered: ${codeLabel}`,
                  body: latestTender
                    ? `"${latestTender.proposal_name}" for ${latestTender.owner}`
                    : 'Live notification check delivered.',
                  url: latestTender ? `/tenders/${latestTender.id}` : '/notifications',
                });
                setScanMessage(
                  `Sent live "New Tender Registered" alert to ${targetIds.length} active user(s) — switch to any user in the top bar to see it in their feed!`
                );
                setTimeout(() => setScanMessage(null), 7000);
              }}
              className="cursor-pointer active:scale-[0.98] transition-all inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Send Live &ldquo;New Record&rdquo; Alert (All Users)
            </button>
          )}

          <button
            onClick={handleRunDueScan}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30"
          >
            <Radar className="w-3.5 h-3.5" /> Run Due / Overdue Scan
          </button>

          <button
            onClick={() => markAllNotificationsRead(user.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="rounded-xl bg-emerald-950/90 border border-emerald-600/40 px-4 py-3 text-xs font-semibold text-emerald-200">
          {scanMessage}
        </div>
      )}

      {user.role === 'viewer' && !canAccessCommercialOverheads(user) ? (
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-8 text-center space-y-2">
          <BellOff className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Viewer Role — Task Notifications Disabled
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Per Section 3 Role Permissions, Viewers have full read-only access to all
            tenders, prices, dashboards, and reports, and do not receive operational task
            notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed List */}
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1E2D3D]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUnreadOnly(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    !unreadOnly
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#182636]'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setUnreadOnly(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    unreadOnly
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#182636]'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs"
              >
                <option value="">All Event Types</option>
                {visibleEventMeta.map((ev) => (
                  <option key={ev.type} value={ev.type}>
                    {lang === 'ar' ? ev.labelAr : ev.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No notifications match your current filter.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-[#1E2D3D]">
                {filtered.map((item) => {
                  const meta =
                    EVENT_TYPE_META.find((m) => m.type === item.type) ||
                    EVENT_TYPE_META[0];
                  const Icon = meta.icon;
                  const isUnread = !item.read_at;

                  const canOpenMetaErpRoute = meta.erpRoute
                    ? meta.erpRoute === '/erp/commercial-bid'
                      ? canAccessCommercialOverheads(user)
                      : meta.erpRoute === '/erp/database'
                        ? canManageAdmin(user.role)
                        : canAccessErpEngineering(user.role)
                    : false;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        markNotificationRead(item.id);
                        if (
                          canOpenMetaErpRoute &&
                          (item.type === 'erp_ready_for_commercial' ||
                            item.type === 'erp_commercial_bid_set' ||
                            item.type === 'catalog_price_updated')
                        ) {
                          navigate(meta.erpRoute!);
                        } else if (item.tender_id) {
                          navigate(`/tenders/${item.tender_id}`);
                        } else if (canOpenMetaErpRoute && meta.erpRoute) {
                          navigate(meta.erpRoute);
                        }
                      }}
                      className={`py-3.5 px-3 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                        isUnread
                          ? 'bg-brand-500/5 hover:bg-brand-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-[#162332]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.badgeClass}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-brand-500" />
                            )}
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {lang === 'ar' ? item.title_ar : item.title_en}
                            </span>
                            {meta.category === 'erp' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-600 dark:text-teal-300">
                                ERP Engine
                              </span>
                            )}
                            {item.proposal_code && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B1218] text-brand-500">
                                {item.proposal_code}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {lang === 'ar' ? item.message_ar : item.message_en}
                          </p>
                          {canOpenMetaErpRoute && meta.erpRoute && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(item.id);
                                navigate(meta.erpRoute!);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 hover:underline pt-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>
                                {lang === 'ar' ? 'فتح في نظام التسعير الذكي' : 'Open in Intelligent Tender ERP'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        {formatDateTimeCairo(item.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notification Preferences / Mute Panel */}
          <div className="space-y-4 h-fit">
            {/* Home Screen PWA & Device Push Notifications Card */}
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-brand-500" />
                  Mobile Home-Screen & Device Alerts
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    devicePerm === 'granted'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : devicePerm === 'denied'
                        ? 'bg-rose-500/15 text-rose-500'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {devicePerm === 'granted'
                    ? isStandalonePwa()
                      ? 'Home-Screen Active'
                      : 'Enabled'
                    : devicePerm === 'denied'
                      ? 'Blocked in Browser'
                      : devicePerm === 'ios_needs_homescreen'
                        ? 'Add to Home Screen First'
                        : 'Not Enabled'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {devicePerm === 'ios_needs_homescreen'
                  ? 'On iPhone/iPad (iOS 16.4+), tap Share → Add to Home Screen, open PZ Tender Log from your Home Screen, then tap Enable Alerts here.'
                  : 'Install this app via Add to Home Screen on iOS/Android and enable device alerts to receive system notifications when tenders, revisions, or tasks update.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 relative z-10">
                {devicePerm === 'default' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const next = await requestDeviceNotificationPermission();
                      setDevicePerm(next);
                      if (next === 'granted') {
                        await showDeviceNotification({
                          title: 'P.ZONE Tender Log Alerts Enabled',
                          body: 'You will now receive device notifications for tender updates.',
                          url: '/notifications',
                        });
                        setScanMessage('Device notifications enabled for this browser/phone!');
                      } else if (next === 'denied') {
                        setScanMessage(
                          'Browser notifications are blocked for this site. Click the lock/tune icon next to the browser address bar → Allow Notifications.'
                        );
                      }
                      setTimeout(() => setScanMessage(null), 6000);
                    }}
                    className="cursor-pointer active:scale-[0.98] px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Enable Device Notifications
                  </button>
                )}

                {devicePerm === 'denied' && (
                  <div className="w-full rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-[11px] text-rose-600 dark:text-rose-300">
                    Browser pop-ups are currently set to <strong>Block</strong> in your browser. Click the <strong>lock / tune icon</strong> on the left of the URL address bar and set <strong>Notifications → Allow</strong>, then reload.
                  </div>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    const stamp = new Date().toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                    dispatchNotification({
                      recipientIds: [user.id],
                      type: 'new_tender',
                      tender_id: getTenders()[0]?.id ?? null,
                      proposal_code: getTenders()[0]?.proposal_code || 'PZ-TEST',
                      title_en: `Test Notification for ${user.full_name} (${stamp})`,
                      title_ar: `إشعار تجريبي لـ ${user.full_name_ar || user.full_name} (${stamp})`,
                      message_en: `In-app & device notification test delivered successfully to ${user.full_name}.`,
                      message_ar: `تم إرسال الإشعار التجريبي بنجاح إلى ${user.full_name_ar || user.full_name}.`,
                    });

                    let currentPerm = getDeviceNotificationState();
                    if (currentPerm === 'default') {
                      currentPerm = await requestDeviceNotificationPermission();
                      setDevicePerm(currentPerm);
                    }
                    const osShown =
                      currentPerm === 'granted'
                        ? await showDeviceNotification({
                            title: `P.ZONE Test — ${user.full_name}`,
                            body: 'In-app & device notifications are working properly.',
                            url: '/notifications',
                          })
                        : false;

                    setScanMessage(
                      osShown
                        ? `Test notification delivered to ${user.full_name} (In-App + OS Banner)!`
                        : `In-App test notification delivered to ${user.full_name}! (Enable browser notifications above if you also want OS desktop/mobile pop-ups.)`
                    );
                    setTimeout(() => setScanMessage(null), 6000);
                  }}
                  className="cursor-pointer active:scale-[0.98] px-3.5 py-2 rounded-lg border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold transition-all"
                >
                  Send Test Notification ({user.full_name.split(' ')[0]})
                </button>
              </div>
            </div>

          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-brand-500" />
                Notification Preferences
              </h3>
              <button
                onClick={() =>
                  updateNotificationPreferences(user.id, {
                    in_app: !prefs.in_app,
                  })
                }
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  prefs.in_app
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {prefs.in_app ? 'In-App Enabled' : 'All Muted'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Toggle individual event types below to mute or unmute them in your feed:
            </p>

            <div className="space-y-2">
              {visibleEventMeta.map((ev) => {
                const isMuted = prefs.muted_event_types.includes(ev.type);
                return (
                  <div
                    key={ev.type}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1218] border border-slate-200/70 dark:border-[#1E2D3D] text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {lang === 'ar' ? ev.labelAr : ev.labelEn}
                    </span>
                    <button
                      onClick={() => handleToggleMuteType(ev.type)}
                      className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                        isMuted
                          ? 'bg-rose-500/15 text-rose-500'
                          : 'bg-emerald-500/15 text-emerald-500'
                      }`}
                    >
                      {isMuted ? 'Muted' : 'Active'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
