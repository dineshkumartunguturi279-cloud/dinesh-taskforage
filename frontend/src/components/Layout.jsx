/**
 * Main Layout with sidebar navigation.
 */
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Settings, LogOut,
  Menu, X, MessageSquare
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '16rem',
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
          zIndex: 50,
        }}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
        {/* Logo */}
        <div style={{
          padding: '1.5rem', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem', color: 'white'
            }}>T</div>
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }} className="gradient-text">TaskFlow</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="mobile-close" style={{
            display: 'none', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                transition: 'all 0.15s ease',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = '';
                }
              }}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{
          padding: '1rem', borderTop: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.875rem', color: 'white', flexShrink: 0
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        <header className="mobile-header" style={{
          display: 'none', padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer'
          }}>
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1rem' }} className="gradient-text">TaskFlow</span>
          <div style={{ width: 24 }} />
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }} className="page-enter">
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            transform: translateX(-100%);
            z-index: 50 !important;
          }
          .sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .mobile-header {
            display: flex !important;
          }
          .mobile-close {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
