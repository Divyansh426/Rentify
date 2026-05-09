import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Eye, EyeOff, UserPlus, Building2, User } from 'lucide-react';
import api from '../api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    role: '', phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) { setError('Please select your role.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('auth/register/', form);
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msg = Object.values(data).flat().join(' ');
        setError(msg);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        required={['username','email','password','first_name','last_name'].includes(name)}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
        style={{ border: '1.5px solid #e5e7eb', background: '#fff', color: '#1f2937' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Home size={18} color="#fff" />
          </div>
          <span className="font-bold text-2xl" style={{ color: 'var(--primary)', fontFamily: 'Space Grotesk, sans-serif' }}>Rentify</span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            Create your account
          </h2>
          <p className="text-sm text-gray-400 mb-6">Join Rentify as a landlord or tenant</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'landlord', label: 'Landlord', desc: 'I manage properties', icon: Building2 },
              { value: 'tenant', label: 'Tenant', desc: 'I rent a room', icon: User },
            ].map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition text-center"
                style={{
                  borderColor: form.role === value ? 'var(--primary)' : '#e5e7eb',
                  background: form.role === value ? '#eef2f9' : '#fafafa',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: form.role === value ? 'var(--primary)' : '#e5e7eb' }}
                >
                  <Icon size={18} color={form.role === value ? '#fff' : '#94a3b8'} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: form.role === value ? 'var(--primary)' : '#374151' }}>{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl mb-5 text-sm"
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {field('first_name', 'First Name', 'text', 'John')}
              {field('last_name', 'Last Name', 'text', 'Doe')}
            </div>
            {field('username', 'Username', 'text', 'john_doe')}
            {field('email', 'Email', 'email', 'john@example.com')}
            {field('phone', 'Phone (optional)', 'tel', '+91 98765 43210')}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition pr-11"
                  style={{ border: '1.5px solid #e5e7eb', background: '#fff', color: '#1f2937' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: 'var(--primary)' }}
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus size={16} /> Create Account</>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold no-underline" style={{ color: 'var(--primary)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}