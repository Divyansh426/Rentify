import { useState, useEffect } from 'react';
import { X, Search, UserCheck, BedDouble, Calendar, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

export default function AddTenantModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=search, 2=assign
  const [username, setUsername] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load available rooms when reaching step 2
  useEffect(() => {
    if (step === 2) {
      api.get('rooms/').then(({ data }) => setRooms(data));
    }
  }, [step]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setFoundUser(null);
    setSearching(true);
    try {
      const { data } = await api.get(`tenants/search/?username=${username.trim()}`);
      setFoundUser(data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Tenant not found.');
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!roomId) { setError('Please select a room.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.post('tenants/assign/', {
        username: foundUser.username,
        room_id: Number(roomId),
        move_in_date: moveInDate || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign tenant.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Add Tenant
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1 ? 'Search by tenant username' : `Assign room to ${foundUser?.first_name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {['Find Tenant', 'Assign Room'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: step > i + 1 ? '#dcfce7' : step === i + 1 ? 'var(--primary)' : '#f1f5f9',
                  color: step > i + 1 ? '#15803d' : step === i + 1 ? '#fff' : '#9ca3af',
                }}
              >
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium" style={{ color: step === i + 1 ? 'var(--primary)' : '#9ca3af' }}>
                {label}
              </span>
              {i === 0 && <div className="flex-1 h-px mx-1" style={{ background: step > 1 ? 'var(--primary)' : '#e5e7eb' }} />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 size={15} /> Tenant assigned successfully!
            </div>
          )}

          {/* Step 1 — Search */}
          {step === 1 && (
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Tenant's Username
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  The tenant must have already registered on Rentify with role "Tenant".
                </p>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching || !username.trim()}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--primary)' }}
              >
                {searching
                  ? <><Loader2 size={16} className="animate-spin" /> Searching...</>
                  : <><Search size={15} /> Search Tenant</>
                }
              </button>
            </form>
          )}

          {/* Step 2 — Assign */}
          {step === 2 && foundUser && (
            <form onSubmit={handleAssign} className="space-y-4">
              {/* Found user card */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: '#dcfce7', color: '#15803d' }}>
                  {foundUser.first_name?.[0]}{foundUser.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {foundUser.first_name} {foundUser.last_name}
                  </p>
                  <p className="text-xs text-gray-500">@{foundUser.username} · {foundUser.email}</p>
                </div>
                <UserCheck size={18} className="ml-auto flex-shrink-0" style={{ color: '#15803d' }} />
              </div>

              {/* Room selector */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  <BedDouble size={14} className="inline mr-1" /> Assign Room
                </label>
                {rooms.length === 0 ? (
                  <div className="p-3 rounded-xl text-sm text-center text-gray-400"
                    style={{ background: '#f8fafc', border: '1px dashed #e5e7eb' }}>
                    No vacant rooms available. Add rooms via Django Admin first.
                  </div>
                ) : (
                  <select
                    required
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="">Select a room...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} — ₹{Number(r.rent_amount).toLocaleString('en-IN')}/month
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Move-in date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  <Calendar size={14} className="inline mr-1" /> Move-in Date
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={e => setMoveInDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid #e5e7eb', background: '#fafafa' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setFoundUser(null); setError(''); }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition"
                  style={{ background: '#f1f5f9', color: '#374151' }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || rooms.length === 0}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}
                >
                  {submitting
                    ? <><Loader2 size={15} className="animate-spin" /> Assigning...</>
                    : <><UserCheck size={15} /> Confirm & Assign</>
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
