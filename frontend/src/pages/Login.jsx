/**
 * Login page with modern dark UI.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.success === false
        ? err.response?.data?.error?.message : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '1rem',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08), transparent 50%)',
    }}>
      <div style={{
        width: '100%', maxWidth: '24rem', animation: 'slideUp 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.5rem', color: 'white', marginBottom: '1rem',
            boxShadow: '0 0 30px rgba(99,102,241,0.3)',
          }}>T</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }} className="gradient-text">Welcome Back</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Sign in to your TaskFlow account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="login-email"
                type="email"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? <div className="spinner" /> : <><LogIn size={18} /> Sign In</>}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 500 }}>
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
