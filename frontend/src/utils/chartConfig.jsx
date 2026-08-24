// Chart configuration and helpers for the HRMS app

// ── HRMS Brand Color Palette ──
export const CHART_COLORS = {
  primary: '#3B82F6',
  'primary-light': '#60A5FA',
  'primary-dark': '#2563EB',
  success: '#10B981',
  'success-light': '#34D399',
  warning: '#F59E0B',
  'warning-light': '#FBBF24',
  danger: '#EF4444',
  'danger-light': '#F87171',
  info: '#06B6D4',
  'info-light': '#22D3EE',
  purple: '#8B5CF6',
  'purple-light': '#A78BFA',
  indigo: '#4F46E5',
  pink: '#EC4899',
  teal: '#14B8A6',
  orange: '#F97316',
};

export const CHART_GRADIENTS = {
  primary: { from: '#3B82F6', to: '#60A5FA' },
  success: { from: '#10B981', to: '#34D399' },
  warning: { from: '#F59E0B', to: '#FBBF24' },
  danger: { from: '#EF4444', to: '#F87171' },
  info: { from: '#06B6D4', to: '#22D3EE' },
  purple: { from: '#8B5CF6', to: '#A78BFA' },
  indigo: { from: '#4F46E5', to: '#6366F1' },
  pink: { from: '#EC4899', to: '#F472B6' },
  teal: { from: '#14B8A6', to: '#2DD4BF' },
  orange: { from: '#F97316', to: '#FB923C' },
};

export const PIE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#06B6D4',
];

// ── SVG Gradient Defs Renderer ──
export function ChartGradients({ id = 'chart' }) {
  return (
    <defs>
      {Object.entries(CHART_GRADIENTS).map(([key, { from, to }]) => (
        <linearGradient key={key} id={`${id}-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} stopOpacity={0.85} />
          <stop offset="100%" stopColor={to} stopOpacity={0.45} />
        </linearGradient>
      ))}
      {/* Glow filter for hover effects */}
      <filter id={`${id}-glow`}>
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// ── Custom Modern Tooltip ──
export function ModernTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-xl px-4 py-3 text-sm max-w-[220px]">
        <p className="font-semibold text-secondary-900 mb-1.5 text-xs uppercase tracking-wide">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-secondary-600">{entry.name}:</span>
              </span>
              <span className="font-bold text-secondary-900">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ── Responsive chart sizing helper ──
export function getChartHeight(isMobile, base = 300, mobile = 220) {
  return isMobile ? mobile : base;
}

// ── Safe formatter for currency ──
export const currencyFormatter = (val) =>
  `₹${Number(val).toLocaleString('en-IN')}`;

export const numberFormatter = (val) =>
  Number(val).toLocaleString('en-IN');

// ── Tooltip formatter for consistent display ──
export const defaultTooltipFormatter = (val) => Number(val).toLocaleString('en-IN');
