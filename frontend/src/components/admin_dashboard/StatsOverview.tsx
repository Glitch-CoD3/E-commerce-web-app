'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../services/order.service';

// --- Types ---
type Semantic = 'positive' | 'warning' | 'neutral' | 'danger' | 'hero';

type MetricProps = {
  title: string;
  value: string | number;
  meta?: string;
  semantic: Semantic;
  trendData?: number[];
};

type FilterState = {
  year: number | string;
  month: number | string;
  startDate: string;
  endDate: string;
};

type CategorizedStats = {
  hero: MetricProps[];
  statuses: MetricProps[];
  breakdown: MetricProps[];
};

// --- Semantic color tokens (used consistently, not decoratively) ---
const SEMANTIC_STYLES: Record<
  Semantic,
  { text: string; bar: string; badgeBg: string; badgeText: string; stroke: string; fillTop: string }
> = {
  hero: {
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10 ring-1 ring-emerald-500/25',
    badgeText: 'text-emerald-400',
    stroke: '#34d399',
    fillTop: 'rgba(52,211,153,0.28)',
  },
  positive: {
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10 ring-1 ring-emerald-500/25',
    badgeText: 'text-emerald-400',
    stroke: '#34d399',
    fillTop: 'rgba(52,211,153,0.22)',
  },
  warning: {
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10 ring-1 ring-amber-500/25',
    badgeText: 'text-amber-400',
    stroke: '#fbbf24',
    fillTop: 'rgba(251,191,36,0.2)',
  },
  danger: {
    text: 'text-rose-400',
    bar: 'bg-rose-500',
    badgeBg: 'bg-rose-500/10 ring-1 ring-rose-500/25',
    badgeText: 'text-rose-400',
    stroke: '#fb7185',
    fillTop: 'rgba(251,113,133,0.2)',
  },
  neutral: {
    text: 'text-slate-300',
    bar: 'bg-slate-500',
    badgeBg: 'bg-slate-500/10 ring-1 ring-slate-500/25',
    badgeText: 'text-slate-300',
    stroke: '#94a3b8',
    fillTop: 'rgba(148,163,184,0.18)',
  },
};

// Generates a filled area-chart path for the hero sparkline
function getAreaPath(data: number[], width = 240, height = 64): { line: string; area: string } {
  if (!data || data.length === 0) return { line: '', area: '' };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((val - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return { line, area };
}

// --- Hero metric (Revenue / AOV): the one place visual weight is spent ---
function HeroMetric({ stat }: { stat: MetricProps }) {
  const s = SEMANTIC_STYLES[stat.semantic];
  const { line, area } = getAreaPath(stat.trendData ?? []);
  const gradientId = `hero-fill-${stat.title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative flex flex-col justify-between rounded-xl border border-[#1E2330] bg-[#12151B] p-5 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-slate-400">{stat.title}</p>
          <p className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {stat.value}
          </p>
        </div>
        {stat.meta && (
          <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ${s.badgeBg} ${s.badgeText}`}>
            {stat.meta}
          </span>
        )}
      </div>

      {stat.trendData && stat.trendData.length > 0 && (
        <div className="mt-4 h-16 w-full">
          <svg className="h-full w-full" viewBox="0 0 240 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.fillTop} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} stroke="none" />
            <path d={line} fill="none" stroke={s.stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// --- Compact metric tile (order statuses): accent lives on a left rule, not a top gradient ---
function StatusMetric({ stat }: { stat: MetricProps }) {
  const s = SEMANTIC_STYLES[stat.semantic];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1E2330] bg-[#12151B] px-4 py-3.5 transition-colors hover:border-[#2A3040]">
      <span className={`h-8 w-[3px] rounded-full ${s.bar}`} aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-[12px] text-slate-400">{stat.title}</p>
        <p className="text-xl font-semibold tabular-nums text-slate-50">{stat.value}</p>
      </div>
      {stat.meta && (
        <span className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${s.badgeBg} ${s.badgeText}`}>
          {stat.meta}
        </span>
      )}
    </div>
  );
}

// --- Ledger row (breakdown): count + a real rate bar where a rate exists ---
function LedgerRow({ stat, ratePercent }: { stat: MetricProps; ratePercent?: number }) {
  const s = SEMANTIC_STYLES[stat.semantic];
  return (
    <div className="flex items-center gap-4 border-b border-[#1E2330] py-3 last:border-b-0">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.bar}`} aria-hidden />
      <span className="w-36 shrink-0 truncate text-[13px] text-slate-300">{stat.title}</span>
      <span className="w-14 shrink-0 text-right text-[15px] font-semibold tabular-nums text-slate-50">
        {stat.value}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1A1E28]">
        {typeof ratePercent === 'number' && (
          <div
            className={`h-full rounded-full ${s.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, ratePercent))}%` }}
          />
        )}
      </div>
      {typeof ratePercent === 'number' && (
        <span className={`w-12 shrink-0 text-right text-[12px] font-medium tabular-nums ${s.text}`}>
          {ratePercent}%
        </span>
      )}
    </div>
  );
}

export default function StatsOverview() {
  const [stats, setStats] = useState<CategorizedStats>({ hero: [], statuses: [], breakdown: [] });
  const [rates, setRates] = useState<{ completion?: number; cancellation?: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    year: 2026,
    month: '',
    startDate: '',
    endDate: '',
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAdminDashboard({
        year: filters.year === '' ? undefined : Number(filters.year),
        month: filters.month === '' ? undefined : Number(filters.month),
      });

      if (response && response.success) {
        const { overview, orderCounts, rates: apiRates } = response.statistics;

        setRates({
          completion: apiRates.completionRatePercentage,
          cancellation: apiRates.cancellationRatePercentage,
        });

        setStats({
          hero: [
            {
              title: 'Total Revenue',
              value: `$${overview.totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              meta: 'This period',
              semantic: 'hero',
              trendData: [overview.totalRevenue * 0.3, overview.totalRevenue * 0.7, overview.totalRevenue],
            },
            {
              title: 'Average Order Value',
              value: `$${overview.averageOrderValue.toLocaleString()}`,
              meta: 'Per order',
              semantic: 'neutral',
              trendData: [overview.averageOrderValue * 0.8, overview.averageOrderValue * 0.9, overview.averageOrderValue],
            },
          ],
          statuses: [
            { title: 'Total Orders', value: orderCounts.total, meta: 'Filtered', semantic: 'neutral' },
            { title: 'Pending', value: orderCounts.pending, meta: 'Awaiting', semantic: 'warning' },
            { title: 'Shipped', value: orderCounts.shipped, meta: 'In transit', semantic: 'neutral' },
            { title: 'Needs Action', value: overview.actionableOrdersCount, meta: 'Action req.', semantic: 'warning' },
          ],
          breakdown: [
            { title: 'Confirmed', value: orderCounts.confirmed, semantic: 'neutral' },
            { title: 'Processing', value: orderCounts.processing, semantic: 'neutral' },
            { title: 'Delivered', value: orderCounts.delivered, semantic: 'positive' },
            { title: 'Cancelled', value: orderCounts.cancelled, semantic: 'danger' },
          ],
        });
      } else {
        setError('Failed to load dashboard statistics.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ year: 2026, month: '', startDate: '', endDate: '' });
  };

  const fieldClasses =
    'bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-1.5 text-slate-200 text-[13px] focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors';

  return (
    <div className="max-w-7xl mx-auto space-y-5 text-slate-200">
      {/* --- Filter Bar --- */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-[#1E2330] bg-[#12151B] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500">Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className={fieldClasses}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500">Month</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className={fieldClasses}
            >
              <option value="">All months</option>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500">Start date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className={fieldClasses}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500">End date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className={fieldClasses}
            />
          </div>
        </div>

        <button
          onClick={handleResetFilters}
          className="text-[13px] font-medium text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-lg border border-[#1E2330] hover:border-emerald-500/30 transition-colors"
        >
          Reset filters
        </button>
      </div>

      {/* --- Loading --- */}
      {loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-40 rounded-xl border border-[#1E2330] bg-[#12151B] animate-pulse" />
            <div className="h-40 rounded-xl border border-[#1E2330] bg-[#12151B] animate-pulse" />
          </div>
          <div className="h-24 rounded-xl border border-[#1E2330] bg-[#12151B] animate-pulse" />
          <div className="h-48 rounded-xl border border-[#1E2330] bg-[#12151B] animate-pulse" />
        </div>
      )}

      {/* --- Error --- */}
      {error && !loading && (
        <div className="rounded-xl border border-rose-500/25 bg-[#12151B] p-6 text-center">
          <p className="mb-3 text-[14px] font-medium text-rose-400">{error}</p>
          <button
            onClick={fetchStats}
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[13px] text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* --- Content --- */}
      {!loading && !error && (
        <div className="space-y-5">
          {/* Hero row: Revenue + AOV */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
            {stats.hero.map((s) => (
              <HeroMetric key={s.title} stat={s} />
            ))}
          </div>

          {/* Order status row */}
          <div>
            <h3 className="mb-2.5 text-[13px] font-medium text-slate-400">Order statuses</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.statuses.map((s) => (
                <StatusMetric key={s.title} stat={s} />
              ))}
            </div>
          </div>

          {/* Breakdown ledger */}
          <div className="rounded-xl border border-[#1E2330] bg-[#12151B] p-5">
            <h3 className="mb-1 text-[13px] font-medium text-slate-400">Breakdown & rates</h3>
            <div>
              {stats.breakdown.map((s) => (
                <LedgerRow
                  key={s.title}
                  stat={s}
                  ratePercent={
                    s.title === 'Delivered' ? rates.completion : s.title === 'Cancelled' ? rates.cancellation : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
