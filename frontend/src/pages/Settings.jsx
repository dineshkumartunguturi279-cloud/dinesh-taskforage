import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error('Name required.'); return; }
    setSavingProfile(true);
    try { await updateProfile(profileForm); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.current_password || !pwForm.new_password) { toast.error('Fill all fields.'); return; }
    if (pwForm.new_password.length < 8) { toast.error('Min 8 characters.'); return; }
    if (!/[A-Z]/.test(pwForm.new_password)) { toast.error('Need uppercase letter.'); return; }
    if (!/[a-z]/.test(pwForm.new_password)) { toast.error('Need lowercase letter.'); return; }
    if (!/[0-9]/.test(pwForm.new_password)) { toast.error('Need a number.'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ current_password: '', new_password: '' });
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
    finally { setSavingPw(false); }
  };

  return (
    <div style={{ maxWidth: '36rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <SettingsIcon size={24} style={{ color: 'var(--color-primary)' }} /> Settings
      </h1>

      {/* Profile */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <User size={18} /> Profile
        </h2>
        <form onSubmit={handleProfileUpdate}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Email</label>
            <input type="email" className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Full Name</label>
            <input type="text" className="input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? <div className="spinner" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Lock size={18} /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min 8 chars, uppercase, lowercase, number" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>
            {savingPw ? <div className="spinner" /> : <><Lock size={16} /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
