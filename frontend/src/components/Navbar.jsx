import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogOut, LayoutDashboard, Users, CreditCard, Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;
  const isLandlord = user?.role === 'landlord';

  const navLinks = isLandlord
    ? [
        { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
        { to: '/tenants',    label: 'Tenants',    icon: Users },
        { to: '/properties', label: 'Properties', icon: Building2 },
      ]
    : [
        { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
        { to: '/my-rent', label: 'My Rent',   icon: CreditCard },
      ];

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'var(--primary)', boxShadow: '0 2px 20px rgba(0,0,0,0.15)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Home size={16} color="#fff" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Rentify
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition no-underline"
                style={{ color: isActive(to) ? 'white' : 'rgba(255,255,255,0.65)', background: isActive(to) ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
                <Icon size={15} /> {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notification bell */}
            <NotificationPanel />

            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-white text-sm font-medium leading-tight">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </p>
                <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.role}</p>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg" style={{ color: 'white' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium my-1 no-underline"
              style={{ color: isActive(to) ? 'white' : 'rgba(255,255,255,0.65)', background: isActive(to) ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium w-full mt-2"
            style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
