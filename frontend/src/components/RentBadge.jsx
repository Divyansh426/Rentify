import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const config = {
  paid: {
    icon: CheckCircle,
    label: 'Paid',
    style: { background: '#dcfce7', color: '#15803d' },
  },
  unpaid: {
    icon: XCircle,
    label: 'Unpaid',
    style: { background: '#fef9c3', color: '#a16207' },
  },
  overdue: {
    icon: AlertCircle,
    label: 'Overdue',
    style: { background: '#fee2e2', color: '#dc2626' },
  },
};

export default function RentBadge({ status }) {
  const { icon: Icon, label, style } = config[status] || config.unpaid;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
      style={style}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}