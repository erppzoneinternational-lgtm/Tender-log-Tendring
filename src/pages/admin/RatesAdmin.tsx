import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CloudDownload,
  DollarSign,
  Edit3,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  fetchMarketUsdEgpRate,
  getExchangeRates,
  upsertExchangeRate,
} from '@/lib/dataStore';
import { computePriceUsd } from '@/lib/formulas';
import {
  DatePickerInput,
  formatDateDdMmYyyy,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import type { ExchangeRate } from '@/types/database';

export const RatesAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useApp();

  const [rates, setRates] = useState<ExchangeRate[]>(() => getExchangeRates());
  const [lookupDate, setLookupDate] = useState(() => todayCairoIso());
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{
    rate: number;
    requestedDate: string;
    dateUsed: string;
    source: string;
    cached: boolean;
  } | null>(null);

  // Manual Entry / Override state
  const [manualDate, setManualDate] = useState(() => todayCairoIso());
  const [manualRate, setManualRate] = useState('50.90');
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleFetchMarketRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);
    setFetching(true);

    try {
      const res = await fetchMarketUsdEgpRate(lookupDate, user);
      setFetchResult(res);
      setRates(getExchangeRates());
      showToast(
        `1 USD = ${res.rate.toFixed(4)} EGP on ${res.dateUsed} (${res.source})`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch rate');
    } finally {
      setFetching(false);
    }
  };

  const handleSaveManualRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    try {
      const numericRate = Number(manualRate);
      const saved = upsertExchangeRate(
        {
          rate_date: manualDate,
          rate_to_usd: numericRate,
          source: 'Manual Override (Admin)',
          is_manual: true,
        },
        user
      );
      setRates(getExchangeRates());
      showToast(
        `Saved manual rate: 1 USD = ${saved.rate_to_usd.toFixed(4)} EGP for ${saved.rate_date}`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save rate');
    }
  };

  const handleQuickEditRow = (row: ExchangeRate) => {
    setManualDate(row.rate_date);
    setManualRate(String(row.rate_to_usd));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-3.5 rounded-xl bg-pzone-seagreen/15 border border-pzone-seagreen/30 text-pzone-seagreen text-xs font-semibold flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 2-Column Action Grid: Auto Market Fetcher vs Manual Override */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Card 1: Automatic Market Rate Fetcher (like GOOGLEFINANCE) */}
        <form
          onSubmit={handleFetchMarketRate}
          className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CloudDownload className="w-5 h-5 text-pzone-teal" />
                <span>{t('admin.rates.fetchBoxTitle')}</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.rates.fetchBoxDesc')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <DatePickerInput
                required
                value={lookupDate}
                onChange={(iso) => setLookupDate(iso)}
              />
            </div>

            <button
              type="submit"
              disabled={fetching}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-pzone-teal hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`}
              />
              <span>
                {fetching
                  ? t('admin.rates.fetching')
                  : t('admin.rates.fetchButton')}
              </span>
            </button>
          </div>

          {fetchResult && (
            <div className="p-3.5 rounded-xl bg-pzone-teal/10 border border-pzone-teal/25 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>
                  1 USD = {fetchResult.rate.toFixed(6)} EGP
                </span>
                <span className="text-pzone-teal">{fetchResult.source}</span>
              </div>
              <div className="text-muted-foreground font-tabular">
                Requested date: <strong>{fetchResult.requestedDate}</strong> •
                Date used: <strong>{fetchResult.dateUsed}</strong>
                {fetchResult.requestedDate !== fetchResult.dateUsed && (
                  <span className="ms-1 text-pzone-orange font-semibold">
                    (Nearest earlier available market date)
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Card 2: Manual Rate Entry / Override */}
        <form
          onSubmit={handleSaveManualRate}
          className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-4"
        >
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-pzone-orange" />
              <span>{t('admin.rates.addManualTitle')}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Manual rates set <code>is_manual = true</code> so automatic nightly jobs will not overwrite them.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t('admin.rates.dateLabel')}
              </label>
              <DatePickerInput
                required
                value={manualDate}
                onChange={(iso) => setManualDate(iso)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t('admin.rates.rateLabel')}
              </label>
              <input
                type="number"
                step="0.0001"
                min="1"
                required
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-tabular text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-orange dark:hover:bg-pzone-orange/90 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.rates.saveRateButton')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historical Rates Table */}
      <div className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {t('admin.rates.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('admin.rates.subtitle')}
          </p>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-xs uppercase border-b border-border">
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.rates.colDate')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.rates.colRate')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.rates.converterSample')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.rates.colSource')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.rates.colType')}
                </th>
                <th className="py-3 px-4 text-end font-semibold">
                  {t('admin.users.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px] font-tabular">
              {rates.map((r) => {
                const sampleUsd = computePriceUsd(1_000_000, r.rate_to_usd);
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-foreground">
                      {formatDateDdMmYyyy(r.rate_date)}
                    </td>

                    <td className="py-3 px-4 font-extrabold text-pzone-navy dark:text-pzone-teal">
                      1 USD = {r.rate_to_usd.toFixed(4)} EGP
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      ${sampleUsd?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </td>

                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {r.source}
                    </td>

                    <td className="py-3 px-4">
                      {r.is_manual ? (
                        <span className="px-2.5 py-1 rounded-full bg-pzone-orange/15 text-pzone-orange text-xs font-semibold">
                          {t('admin.rates.manualBadge')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-pzone-teal/15 text-pzone-teal text-xs font-semibold">
                          {t('admin.rates.autoBadge')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => handleQuickEditRow(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-pzone-teal hover:text-white text-foreground text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Override</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
