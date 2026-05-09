import { Phone, Mail, BedDouble, Calendar, ChevronRight } from 'lucide-react';
import RentBadge from './RentBadge';
import { Link } from 'react-router-dom';

export default function TenantCard({ tenant }) {
  const profile = tenant;
  const user = profile.tenant;
  const room = profile.room;
  const latestPayment = profile.payments?.[profile.payments.length - 1];

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase();

  const avatarColors = [
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#fce7f3', color: '#be185d' },
    { bg: '#d1fae5', color: '#065f46' },
    { bg: '#ede9fe', color: '#6d28d9' },
    { bg: '#ffedd5', color: '#c2410c' },
  ];
  const colorIdx = user.id % avatarColors.length;
  const avatarStyle = avatarColors[colorIdx];

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{ background: avatarStyle.bg, color: avatarStyle.color }}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
          </div>
        </div>
        {latestPayment && <RentBadge status={latestPayment.status} />}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail size={13} className="flex-shrink-0" style={{ color: '#9ca3af' }} />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone size={13} style={{ color: '#9ca3af' }} />
            <span>{user.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BedDouble size={13} style={{ color: '#9ca3af' }} />
          <span>Room <strong className="text-gray-700">{room?.room_number ?? '—'}</strong></span>
        </div>
        {profile.move_in_date && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={13} style={{ color: '#9ca3af' }} />
            <span>Since {new Date(profile.move_in_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Rent amount */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-4"
        style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
      >
        <span className="text-xs text-gray-400 font-medium">Monthly Rent</span>
        <span className="text-base font-bold" style={{ color: 'var(--primary)' }}>
          ₹{room?.rent_amount ? Number(room.rent_amount).toLocaleString('en-IN') : '—'}
        </span>
      </div>

      {/* View details */}
      <Link
        to={`/tenants/${profile.id}`}
        className="flex items-center justify-center gap-1 w-full py-2 rounded-xl text-sm font-medium transition no-underline"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        View Details <ChevronRight size={14} />
      </Link>
    </div>
  );
}
