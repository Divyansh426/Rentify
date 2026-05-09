import { useEffect, useState } from 'react';
import { BedDouble, IndianRupee, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import RentBadge from '../components/RentBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('tenants/me/')
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <LoadingSpinner message="Loading your profile..." />
    </div>
  );

  const room = profile?.room;
  const payments = profile?.payments || [];
  const latestPayment = payments[payments.length - 1];
  const paidCount = payments.filter(p => p.status === 'paid').length;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Hello, {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">Here's your room and payment overview.</p>
        </div>

        {!profile ? (
          <NoProfileCard />
        ) : (
          <div className="space-y-5">
            {/* Room Info Card */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--primary)',
                boxShadow: '0 8px 32px rgba(26,60,94,0.25)',
              }}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Your Room</p>
                  <h2 className="text-5xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {room?.room_number ?? '—'}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Rent</p>
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    ₹{room?.rent_amount ? Number(room.rent_amount).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <InfoItem icon={BedDouble} label="Room Type" value={room?.is_occupied ? 'Occupied' : 'Vacant'} />
                <InfoItem icon={Calendar} label="Move-in Date"
                  value={profile.move_in_date
                    ? new Date(profile.move_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Not set'
                  }
                />
                <InfoItem icon={IndianRupee} label="Total Paid"
                  value={`₹${totalPaid.toLocaleString('en-IN')}`} />
              </div>
            </div>

            {/* Current Month Status */}
            {latestPayment && (
              <div
                className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
                style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Month</p>
                  <p className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {new Date(latestPayment.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Due: ₹{Number(latestPayment.amount).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RentBadge status={latestPayment.status} />
                  {latestPayment.paid_on && (
                    <p className="text-xs text-gray-400">
                      Paid on {new Date(latestPayment.paid_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <MiniStat
                icon={CheckCircle} iconBg="#dcfce7" iconColor="#15803d"
                label="Months Paid" value={paidCount}
              />
              <MiniStat
                icon={Clock} iconBg="#fef9c3" iconColor="#a16207"
                label="Total Months" value={payments.length}
              />
              <MiniStat
                icon={AlertCircle} iconBg="#fee2e2" iconColor="#dc2626"
                label="Overdue" value={payments.filter(p => p.status === 'overdue').length}
              />
            </div>

            {/* Payment History */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Payment History
                </h3>
              </div>
              {payments.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No payment records yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {[...payments].reverse().map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                      <div>
                        <p className="font-medium text-sm text-gray-800">
                          {new Date(p.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.paid_on
                            ? `Paid on ${new Date(p.paid_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : 'Not yet paid'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm text-gray-700">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                        <RentBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
      <div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
        style={{ background: iconBg }}>
        <Icon size={17} color={iconColor} />
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function NoProfileCard() {
  return (
    <div
      className="rounded-2xl p-10 flex flex-col items-center text-center"
      style={{ background: '#fff', border: '1px solid #e5e7eb' }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f1f5f9' }}>
        <BedDouble size={28} color="#94a3b8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        No room assigned yet
      </h3>
      <p className="text-sm text-gray-400 max-w-sm">
        Your landlord hasn't linked your account to a room yet. Please contact your landlord to get set up.
      </p>
    </div>
  );
}
