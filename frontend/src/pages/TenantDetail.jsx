import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, BedDouble, Calendar,
  IndianRupee, CheckCircle, XCircle
} from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import RentBadge from '../components/RentBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const fetch = () => {
    api.get(`tenants/${id}/`)
      .then(({ data }) => setProfile(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  const toggleRent = async (paymentId, currentStatus) => {
    setToggling(paymentId);
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    await api.patch(`rent/${paymentId}/`, {
      status: newStatus,
      ...(newStatus === 'paid' ? { paid_on: new Date().toISOString().split('T')[0] } : { paid_on: null }),
    });
    fetch();
    setToggling(null);
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <LoadingSpinner message="Loading tenant details..." />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Tenant not found.</p>
      </div>
    </div>
  );

  const { tenant: user, room, payments, move_in_date } = profile;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const latestPayment = payments[payments.length - 1];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition mb-6 font-medium"
        >
          <ArrowLeft size={16} /> Back to tenants
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — Profile */}
          <div className="lg:col-span-1 space-y-4">
            {/* Identity Card */}
            <div className="rounded-2xl p-6 text-center"
              style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                {initials}
              </div>
              <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-gray-400">@{user.username}</p>
              {latestPayment && (
                <div className="mt-3 flex justify-center">
                  <RentBadge status={latestPayment.status} />
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 className="font-semibold text-gray-700 text-sm">Contact Info</h3>
              <DetailRow icon={Mail} label="Email" value={user.email} />
              <DetailRow icon={Phone} label="Phone" value={user.phone || 'Not provided'} />
              <DetailRow icon={BedDouble} label="Room" value={room ? `Room ${room.room_number}` : 'Unassigned'} />
              <DetailRow icon={Calendar} label="Move-in"
                value={move_in_date
                  ? new Date(move_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Not set'
                }
              />
            </div>

            {/* Rent Summary */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(26,60,94,0.2)' }}>
              <p className="text-xs font-medium mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Rent Summary</p>
              <div className="space-y-3">
                <SummaryRow label="Monthly Rent" value={`₹${room?.rent_amount ? Number(room.rent_amount).toLocaleString('en-IN') : '—'}`} />
                <SummaryRow label="Total Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} accent />
                <SummaryRow label="Months Paid" value={`${payments.filter(p => p.status === 'paid').length} / ${payments.length}`} />
              </div>
            </div>
          </div>

          {/* Right — Payment History */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Payment History
                </h3>
                <span className="text-xs text-gray-400">{payments.length} records</span>
              </div>

              {payments.length === 0 ? (
                <div className="py-16 text-center">
                  <IndianRupee size={28} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">No payment records found.</p>
                </div>
              ) : (
                <div>
                  {[...payments].reverse().map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                      style={{ borderBottom: '1px solid #f8fafc' }}>
                      <div>
                        <p className="font-medium text-sm text-gray-800">
                          {new Date(p.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.paid_on
                            ? `Paid on ${new Date(p.paid_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : p.status === 'overdue' ? '⚠ Overdue' : 'Awaiting payment'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </span>
                        <RentBadge status={p.status} />
                        <button
                          onClick={() => toggleRent(p.id, p.status)}
                          disabled={toggling === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          style={{
                            background: p.status === 'paid' ? '#fee2e2' : '#dcfce7',
                            color: p.status === 'paid' ? '#dc2626' : '#15803d',
                          }}
                        >
                          {toggling === p.id ? (
                            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : p.status === 'paid' ? (
                            <><XCircle size={12} /> Mark Unpaid</>
                          ) : (
                            <><CheckCircle size={12} /> Mark Paid</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#9ca3af' }} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 font-medium">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: accent ? '#F5A623' : 'white' }}>{value}</span>
    </div>
  );
}