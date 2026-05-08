/**
 * Signup page with validation.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw) => {
    const errors = [];
    if (pw.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pw)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pw)) errors.push('One number');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm_password) {
      toast.error('Please fill in all fields.');
      return;
    }
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) {
      toast.error(`Password needs: ${pwErrors.join(', ')}`);
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.confirm_password);
      toast.success('Account created successfully!');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error?.message || 'Signup failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const pwErrors = form.password ? validatePassword(form.password) : [];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '1rem',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08), transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: '24rem', animation: 'slideUp 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.5rem', color: 'white', marginBottom: '1rem',
            boxShadow: '0 0 30px rgba(99,102,241,0.3)',
          }}>T</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }} className="gradient-text">Create Account</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Start managing your team's tasks
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="signup-name"
                type="text"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="signup-email"
                type="email"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {['8+ chars', 'Uppercase', 'Lowercase', 'Number'].map((rule, i) => {
                  const checks = [form.password.length >= 8, /[A-Z]/.test(form.password), /[a-z]/.test(form.password), /[0-9]/.test(form.password)];
                  return (
                    <span key={rule} style={{
                      fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px',
                      background: checks[i] ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: checks[i] ? '#34d399' : '#f87171',
                    }}>{rule}</span>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="signup-confirm-password"
                type="password"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              />
            </div>
            {form.confirm_password && form.password !== form.confirm_password && (
              <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>Passwords do not match</p>
            )}
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? <div className="spinner" /> : <><UserPlus size={18} /> Create Account</>}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 500 }}>
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
