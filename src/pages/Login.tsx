import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Lock,
  Monitor,
  Moon,
  ShieldAlert,
  Sun,
  Waves,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { todayCairoIso } from '@/components/ui/DatePickerInput';

const GoogleGLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.4l3.99-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    authError,
    clearAuthError,
    resolvedDark,
    theme,
    setTheme,
    toggleLanguage,
    signInWithGoogle,
  } = useApp();

  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeError = localError || authError;

  // Redirect once authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handlePrimaryGoogleButton = async () => {
    setLocalError(null);
    clearAuthError();
    setSubmitting(true);
    const res = await signInWithGoogle();
    setSubmitting(false);
    if (res.error) {
      setLocalError(res.error);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background text-foreground">
      {/* Left / Start Panel: "Water in Motion" Brand Showcase */}
      <div className="lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-[#26336B] via-[#161E36] to-[#0E1426] text-white p-8 lg:p-12 flex flex-col justify-between">
        <div className="pointer-events-none absolute -top-24 -start-24 w-96 h-96 rounded-full bg-pzone-teal/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 -end-20 w-80 h-80 rounded-full bg-pzone-magenta/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 start-1/3 w-72 h-72 rounded-full bg-pzone-orange/15 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <img
            src="/brand/Company_Horizontal_Logo_Logo__White_.png"
            alt="P.ZONE — Only Results Matter"
            className="h-12 w-auto object-contain"
          />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 backdrop-blur-md">
            <Waves className="w-3.5 h-3.5 text-pzone-teal" />
            <span>Water in Motion</span>
          </span>
        </div>

        <div className="relative z-10 my-8 flex flex-col items-center text-center">
          <div className="relative w-56 h-56 sm:w-68 sm:h-68 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping opacity-20" />
            <div
              className="absolute inset-4 rounded-full border border-dashed border-white/20 animate-spin"
              style={{ animationDuration: '28s' }}
            />
            <div className="absolute inset-8 rounded-full border border-pzone-magenta/30 animate-pulse-ring" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pzone-teal/30 via-transparent to-pzone-magenta/30 blur-2xl" />
            <img
              src="/brand/Favicon.png"
              alt="P.ZONE Flowing Ribbons"
              className="relative w-44 h-44 sm:w-52 sm:h-52 object-contain animate-ribbon-flow drop-shadow-[0_0_35px_rgba(0,240,255,0.35)]"
            />
          </div>

          <h1 className="font-display mt-6 text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-teal-300 bg-clip-text text-transparent">
            {t('brand.appTitle')}
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-cyan-100/75 max-w-md leading-relaxed">
            {t('brand.concept')}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-cyan-200 backdrop-blur-md">
              Google OAuth Allowlist
            </span>
            <span className="px-3 py-1 rounded-full bg-pzone-teal/20 border border-cyan-400/30 text-emerald-200 backdrop-blur-md">
              Intelligent Tendering ERP
            </span>
            <span className="px-3 py-1 rounded-full bg-pzone-magenta/20 border border-pink-400/30 text-pink-200 backdrop-blur-md">
              Cairo Timezone (EET)
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="h-1 w-full rounded-full bg-ribbon-gradient" />
          <div className="flex items-center justify-between text-xs text-white/70 font-medium">
            <span className="uppercase tracking-widest font-bold text-white">
              Only Results Matter
            </span>
            <span>EGP & USD Live Pricing • Kanban • Audit Log</span>
          </div>
        </div>
      </div>

      {/* Right / End Panel: Single "Sign in with Google" Button */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        <div className="flex items-center justify-between">
          <img
            src={
              resolvedDark
                ? '/brand/Company_Horizontal_Logo_Logo__White_.png'
                : '/brand/Horizontal_Logo__black_.png'
            }
            alt="P.ZONE Logo"
            className="h-9 w-auto object-contain"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-pzone-teal" />
              <span>{t('topbar.language')}</span>
            </button>

            <div className="flex items-center p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                  theme === 'light'
                    ? 'bg-card text-pzone-teal shadow-sm'
                    : 'text-muted-foreground'
                }`}
                title={t('topbar.themeLight')}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-card text-pzone-teal shadow-sm'
                    : 'text-muted-foreground'
                }`}
                title={t('topbar.themeDark')}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                  theme === 'system'
                    ? 'bg-card text-pzone-teal shadow-sm'
                    : 'text-muted-foreground'
                }`}
                title={t('topbar.themeSystem')}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Single-Button Google Sign-In Card */}
        <div className="max-w-md w-full mx-auto my-8 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {t('login.welcome')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-card p-6 sm:p-7 shadow-soft dark:shadow-soft-dark space-y-5 border-ribbon-top">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-border shadow-sm flex items-center justify-center shrink-0">
                <GoogleGLogo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {t('login.googleTitle')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t('login.googleSubtitle')}
                </p>
              </div>
            </div>

            {activeError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson text-xs font-semibold flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{activeError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handlePrimaryGoogleButton}
              className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              <GoogleGLogo className="w-5 h-5" />
              <span>{submitting ? 'Signing in with Google...' : t('login.signInButton')}</span>
            </button>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border/60">
              <Lock className="w-3.5 h-3.5 text-pzone-teal shrink-0" />
              <span>{t('login.allowlistNotice')}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          © {todayCairoIso().slice(0, 4)} P.ZONE Water Features & Swimming Pools •{' '}
          <span className="font-semibold text-foreground">{t('brand.tagline')}</span>
        </div>
      </div>
    </div>
  );
};
