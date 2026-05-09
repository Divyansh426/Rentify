import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-10"
        style={{ background: 'var(--primary)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Home size={18} color="#fff" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Rentify</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Manage your rentals with confidence.
          </h1>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Landlords and tenants on one platform. Track rooms, rent, and payments — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Role-based Access', 'Payment Tracking', 'Room Management', 'Secure JWT Auth'].map((f) => (
              <span
                key={f}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Rentify. Built with Django + React.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Home size={16} color="#fff" />
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--primary)', fontFamily: 'Space Grotesk, sans-serif' }}>Rentify</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
            Welcome back
          </h2>
          <p className="text-sm text-gray-400 mb-8">Sign in to your Rentify account</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="your_username"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                style={{
                  border: '1.5px solid #e5e7eb',
                  background: '#fff',
                  color: '#1f2937',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition pr-11"
                  style={{
                    border: '1.5px solid #e5e7eb',
                    background: '#fff',
                    color: '#1f2937',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
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
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold no-underline" style={{ color: 'var(--primary)' }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}