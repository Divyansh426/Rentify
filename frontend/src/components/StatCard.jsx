export default function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            {value}
          </p>
          {trend && (
            <p className="text-xs mt-1" style={{ color: trend.positive ? '#16a34a' : '#dc2626' }}>
              {trend.positive ? '↑' : '↓'} {trend.text}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={20} color={iconColor} />
        </div>
      </div>
    </div>
  );
}