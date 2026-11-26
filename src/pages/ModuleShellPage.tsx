import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Waves } from 'lucide-react';

interface ModuleShellPageProps {
  titleKey: string;
  phaseLabel: string;
  description: string;
}

export const ModuleShellPage: React.FC<ModuleShellPageProps> = ({
  titleKey,
  phaseLabel,
  description,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="bg-card border border-border rounded-card p-10 text-center shadow-soft dark:shadow-soft-dark space-y-5 border-ribbon-top">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-pzone-teal/10 border border-pzone-teal/20 flex items-center justify-center">
          <Waves className="w-10 h-10 text-pzone-teal" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pzone-navy/10 dark:bg-pzone-teal/15 text-pzone-navy dark:text-pzone-teal text-xs font-bold">
          {phaseLabel}
        </div>

        <h1 className="text-2xl font-extrabold text-foreground">
          {t(titleKey)}
        </h1>

        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {description}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pzone-navy dark:bg-pzone-teal text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('nav.home')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
