/**
 * Project Detail page with tabs for overview, tasks, and members.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import {
  FolderKanban, Users, CheckSquare, Settings, ArrowLeft,
  Edit3, Trash2, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    try {
      const res = await projectsAPI.get(id);
      setProject(res.data.data);
      setEditForm({ name: res.data.data.name, description: res.data.data.description });
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        toast.error('Project not found or access denied.');
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.update(id, editForm);
      toast.success('Project updated.');
      setEditing(false);
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted.');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: '2rem', width: '12rem', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '12rem', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!project) return null;

  const isAdmin = project.my_role === 'ADMIN';
  const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

  return (
    <div>
      {/* Back + Header */}
      <button
        onClick={() => navigate('/projects')}
        style={{
          background: 'none', border: 'none', color: 'var(--color-text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
          marginBottom: '1rem', fontSize: '0.875rem',
        }}
      >
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.25rem', color: 'white', flexShrink: 0,
            }}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {editing ? (
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    autoFocus
                  />
                  <textarea
                    className="input"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary btn-sm"><Save size={14} /> Save</button>
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary btn-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.name}</h1>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {project.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <span>Created by {project.created_by?.name}</span>
                    <span>•</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {isAdmin && !editing && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => setShowDelete(true)} className="btn-danger btn-sm">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <Users size={20} style={{ color: '#6366f1', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.member_count}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Members</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <CheckSquare size={20} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.task_count}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tasks</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <span className={`badge badge-${project.my_role?.toLowerCase()}`} style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
            {project.my_role}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Your Role</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '1rem' }}>
        <button
          onClick={() => navigate(`/projects/${id}/tasks`)}
          className="card"
          style={{
            padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
            border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
            color: 'var(--color-text)', width: '100%'
          }}
        >
          <CheckSquare size={24} style={{ color: '#10b981', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>Manage Tasks</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Create, assign, and track tasks</p>
        </button>

        <button
          onClick={() => navigate(`/projects/${id}/members`)}
          className="card"
          style={{
            padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
            border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
            color: 'var(--color-text)', width: '100%'
          }}
        >
          <Users size={24} style={{ color: '#6366f1', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>Manage Members</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Add, remove, and manage roles</p>
        </button>
      </div>

      {/* Members Preview */}
      {project.members?.length > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Team Members</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {project.members.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2rem', height: '2rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: '0.75rem', color: 'white', flexShrink: 0,
                  }}>
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{m.user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.user.email}</div>
                  </div>
                </div>
                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
              </div>
            ))}
          </div>
          {project.members.length > 5 && (
            <button
              onClick={() => navigate(`/projects/${id}/members`)}
              className="btn-secondary btn-sm"
              style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
            >
              View All ({project.members.length})
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '24rem' }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '3rem', height: '3rem', borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              }}>
                <Trash2 size={24} style={{ color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delete Project?</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                This will permanently delete <strong>{project.name}</strong> and all its tasks. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={() => setShowDelete(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
                  {deleting ? <div className="spinner" /> : 'Delete Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
