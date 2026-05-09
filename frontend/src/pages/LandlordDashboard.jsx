import { useEffect, useState } from 'react';
import {
  Users, CheckCircle, XCircle, IndianRupee,
  Search, LayoutGrid, List, UserPlus, TrendingUp
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import TenantCard from '../components/TenantCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import RentBadge from '../components/RentBadge';
import AddTenantModal from '../components/AddTenantModal';
import RevenueChart from '../components/RevenueChart';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tenantsRes, analyticsRes] = await Promise.all([
        api.get('tenants/'),
        api.get('analytics/'),
      ]);
      setTenants(tenantsRes.data);
      setAnalytics(analyticsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleRent = async (paymentId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    await api.patch(`rent/${paymentId}/`, { status: newStatus });
    fetchAll();
  };

  const removeTenant = async (profileId) => {
    if (!window.confirm('Remove this tenant from your account?')) return;
    await api.delete(`tenants/${profileId}/remove/`);
    fetchAll();
  };

  const stats = analytics?.stats || {};

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.tenant.first_name?.toLowerCase().includes(q) ||
      t.tenant.last_name?.toLowerCase().includes(q) ||
      t.tenant.email?.toLowerCase().includes(q) ||
      t.room?.room_number?.toString().includes(q);
    const latest = t.payments?.[t.payments.length - 1];
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && latest?.status === 'paid') ||
      (filterStatus === 'unpaid' && (latest?.status === 'unpaid' || latest?.status === 'overdue'));
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      {showModal && (
        <AddTenantModal onClose={() => setShowModal(false)} onSuccess={fetchAll} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Good {getGreeting()}, {user?.first_name || user?.username} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-1">Here's your property overview for today.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 shadow-sm"
            style={{ background: 'var(--primary)' }}>
            <UserPlus size={16} /> Add Tenant
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Tenants" value={stats.total_tenants ?? tenants.length}
            icon={Users} iconBg="#dbeafe" iconColor="#1d4ed8" />
          <StatCard label="Paid This Month" value={stats.paid_this_month ?? 0}
            icon={CheckCircle} iconBg="#dcfce7" iconColor="#15803d" />
          <StatCard label="Pending" value={(stats.unpaid_this_month ?? 0) + (stats.overdue_this_month ?? 0)}
            icon={XCircle} iconBg="#fef9c3" iconColor="#a16207" />
          <StatCard
            label="Revenue This Month"
            value={`₹${(stats.revenue_this_month ?? 0).toLocaleString('en-IN')}`}
            icon={IndianRupee} iconBg="#ede9fe" iconColor="#6d28d9" />
        </div>

        {/* Revenue Chart */}
        {analytics?.monthly_revenue && (
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Revenue — Last 6 Months
              </h2>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <TrendingUp size={13} /> Monthly breakdown
              </div>
            </div>
            <RevenueChart data={analytics.monthly_revenue} />
          </div>
        )}

        {/* Occupancy Info */}
        {stats.total_rooms > 0 && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-4 flex-wrap"
            style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex-1 min-w-48">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500">Occupancy Rate</span>
                <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  {stats.occupancy_rate}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: '#f1f5f9' }}>
                <div className="h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.occupancy_rate}%`,
                    background: stats.occupancy_rate > 80 ? '#22c55e' : stats.occupancy_rate > 50 ? '#f59e0b' : '#94a3b8'
                  }} />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{stats.occupied_rooms}</span> of{' '}
              <span className="font-semibold text-gray-800">{stats.total_rooms}</span> rooms occupied
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name, email, room..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid #e5e7eb', background: '#fff' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb', background: '#fff' }}>
            {['all', 'paid', 'unpaid'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-4 py-2 text-sm font-medium capitalize transition"
                style={{ background: filterStatus === s ? 'var(--primary)' : 'transparent', color: filterStatus === s ? '#fff' : '#6b7280' }}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb', background: '#fff' }}>
            <button onClick={() => setView('grid')} className="p-2.5 transition"
              style={{ background: view === 'grid' ? 'var(--primary)' : 'transparent', color: view === 'grid' ? '#fff' : '#6b7280' }}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('table')} className="p-2.5 transition"
              style={{ background: view === 'table' ? 'var(--primary)' : 'transparent', color: view === 'table' ? '#fff' : '#6b7280' }}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Tenant list */}
        {loading ? <LoadingSpinner message="Loading dashboard..." /> :
          filtered.length === 0 ? (
            <EmptyState icon={Users} title="No tenants yet"
              description="Click 'Add Tenant' to link your first tenant."
              action={{ label: '+ Add Tenant', onClick: () => setShowModal(true) }} />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(t => <TenantCard key={t.id} tenant={t} onRemove={() => removeTenant(t.id)} />)}
            </div>
          ) : (
            <TenantTable tenants={filtered} onToggleRent={toggleRent} onRemove={removeTenant} />
          )
        }
      </div>
    </div>
  );
}

function TenantTable({ tenants, onToggleRent, onRemove }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              {['Tenant', 'Room', 'Rent', 'Move-in', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => {
              const latest = t.payments?.[t.payments.length - 1];
              const initials = `${t.tenant.first_name?.[0] || ''}${t.tenant.last_name?.[0] || ''}`.toUpperCase();
              return (
                <tr key={t.id} className="transition hover:bg-gray-50"
                  style={{ borderBottom: i < tenants.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: '#dbeafe', color: '#1d4ed8' }}>{initials}</div>
                      <div>
                        <p className="font-medium text-sm text-gray-800">{t.tenant.first_name} {t.tenant.last_name}</p>
                        <p className="text-xs text-gray-400">{t.tenant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-sm font-medium" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                      Room {t.room?.room_number ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-sm text-gray-700">
                    ₹{t.room?.rent_amount ? Number(t.room.rent_amount).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {t.move_in_date ? new Date(t.move_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    {latest ? <RentBadge status={latest.status} /> : <span className="text-gray-300 text-sm">No record</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {latest && (
                        <button onClick={() => onToggleRent(latest.id, latest.status)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          style={{ background: latest.status === 'paid' ? '#fee2e2' : '#dcfce7', color: latest.status === 'paid' ? '#dc2626' : '#15803d' }}>
                          Mark {latest.status === 'paid' ? 'Unpaid' : 'Paid'}
                        </button>
                      )}
                      <button onClick={() => onRemove(t.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: '#f1f5f9', color: '#64748b' }}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
