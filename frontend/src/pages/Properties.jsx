import { useEffect, useState } from 'react';
import { Plus, Building2, BedDouble, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProp, setShowAddProp] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchProperties = () => {
    api.get('properties/')
      .then(({ data }) => setProperties(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProperties(); }, []);

  const deleteProperty = async (id) => {
    if (!window.confirm('Delete this property and all its rooms?')) return;
    await api.delete(`properties/${id}/`);
    fetchProperties();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              My Properties
            </h1>
            <p className="text-sm text-gray-400 mt-1">Manage your properties and rooms</p>
          </div>
          <button
            onClick={() => setShowAddProp(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={15} /> Add Property
          </button>
        </div>

        {loading ? <LoadingSpinner message="Loading properties..." /> :
          properties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your first property to start managing rooms and tenants."
              action={{ label: '+ Add Property', onClick: () => setShowAddProp(true) }}
            />
          ) : (
            <div className="space-y-4">
              {properties.map(prop => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  expanded={expandedId === prop.id}
                  onToggle={() => setExpandedId(expandedId === prop.id ? null : prop.id)}
                  onDelete={() => deleteProperty(prop.id)}
                  onRefresh={fetchProperties}
                />
              ))}
            </div>
          )
        }
      </div>

      {showAddProp && (
        <AddPropertyModal
          onClose={() => setShowAddProp(false)}
          onSuccess={() => { fetchProperties(); setShowAddProp(false); }}
        />
      )}
    </div>
  );
}

function PropertyCard({ property, expanded, onToggle, onDelete, onRefresh }) {
  const [showAddRoom, setShowAddRoom] = useState(false);
  const occupancy = property.total_rooms > 0
    ? Math.round((property.occupied_rooms / property.total_rooms) * 100)
    : 0;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#ede9fe' }}>
            <Building2 size={18} color="#6d28d9" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{property.name}</h3>
            <p className="text-xs text-gray-400">{property.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Occupancy pill */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-400">Occupancy</span>
            <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
              {property.occupied_rooms}/{property.total_rooms} rooms
            </span>
          </div>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 transition text-gray-300 hover:text-red-400">
            <Trash2 size={15} />
          </button>
          <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="px-5 pb-3">
        <div className="w-full h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
          <div className="h-1.5 rounded-full transition-all"
            style={{ width: `${occupancy}%`, background: occupancy > 80 ? '#22c55e' : occupancy > 50 ? '#f59e0b' : '#94a3b8' }} />
        </div>
      </div>

      {/* Expanded — room list */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rooms</span>
            <button
              onClick={() => setShowAddRoom(true)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              style={{ background: '#f1f5f9', color: 'var(--primary)' }}
            >
              <Plus size={12} /> Add Room
            </button>
          </div>

          {property.rooms.length === 0 ? (
            <div className="px-5 pb-5 text-sm text-gray-400 text-center py-6">
              No rooms added yet. Click "Add Room" to start.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-5 pb-5">
              {property.rooms.map(room => (
                <div key={room.id} className="p-3 rounded-xl"
                  style={{
                    background: room.is_occupied ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${room.is_occupied ? '#bbf7d0' : '#e5e7eb'}`
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <BedDouble size={13} color={room.is_occupied ? '#15803d' : '#94a3b8'} />
                    <span className="font-semibold text-sm text-gray-800">Room {room.room_number}</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                    ₹{Number(room.rent_amount).toLocaleString('en-IN')}/mo
                  </p>
                  <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: room.is_occupied ? '#dcfce7' : '#f1f5f9',
                      color: room.is_occupied ? '#15803d' : '#6b7280'
                    }}>
                    {room.is_occupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {showAddRoom && (
            <AddRoomModal
              propertyId={property.id}
              onClose={() => setShowAddRoom(false)}
              onSuccess={() => { onRefresh(); setShowAddRoom(false); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AddPropertyModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('properties/', form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Property" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Property Name" value={form.name}
          onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Sunrise PG, Green Apartments" />
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Address</label>
          <textarea
            required value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="Full address..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        <SubmitBtn loading={loading} label="Create Property" />
      </form>
    </Modal>
  );
}

function AddRoomModal({ propertyId, onClose, onSuccess }) {
  const [form, setForm] = useState({ room_number: '', rent_amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`properties/${propertyId}/rooms/`, form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Room Number" value={form.room_number}
          onChange={v => setForm({ ...form, room_number: v })} placeholder="e.g. 101, A1, Ground-1" />
        <Field label="Monthly Rent (₹)" type="number" value={form.rent_amount}
          onChange={v => setForm({ ...form, rent_amount: v })} placeholder="e.g. 8000" />
        <SubmitBtn loading={loading} label="Add Room" />
      </form>
    </Modal>
  );
}

// ── Shared small components ────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} required value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
      ⚠ {message}
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
      style={{ background: 'var(--primary)' }}>
      {loading ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : label}
    </button>
  );
}
