export default function StatCard({ icon: Icon, label, value, color = 'primary', trend, subtitle }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    info: 'bg-blue-50 text-blue-600'
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorMap[color] || colorMap.primary}`}>
        {Icon && <Icon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="stat-value truncate">{value ?? '-'}</p>
        <p className="stat-label truncate">{label}</p>
        {subtitle && <p className="text-xs text-secondary-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={`text-sm font-medium ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}
