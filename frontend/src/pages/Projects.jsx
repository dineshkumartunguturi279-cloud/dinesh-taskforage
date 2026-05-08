/**
 * Projects listing and creation page.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import { FolderKanban, Plus, Users, CheckSquare, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.list({ search, page_size: 50 });
      setProjects(res.data.results || []);
    } catch (err) {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      loadProjects();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Project name is required.');
      return;
    }
    setCreating(true);
    try {
      const res = await projectsAPI.create(createForm);
      toast.success('Project created!');
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      navigate(`/projects/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban size={24} style={{ color: 'var(--color-primary)' }} />
            Projects
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage your team projects
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" id="create-project-btn">
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '24rem', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '10rem', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {/* Project Grid */}
      {!loading && projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1rem' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="card"
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0,
                }}>
                  {project.name.charAt(0).toUpperCase()}
                </div>
                {project.my_role && (
                  <span className={`badge badge-${project.my_role.toLowerCase()}`}>{project.my_role}</span>
                )}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text)' }}>
                {project.name}
              </h3>
              <p style={{
                fontSize: '0.8125rem', color: 'var(--color-text-muted)',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                marginBottom: '1rem', minHeight: '2.5rem'
              }}>
                {project.description || 'No description'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={14} /> {project.member_count} members
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckSquare size={14} /> {project.task_count} tasks
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="card empty-state" style={{ padding: '3rem' }}>
          <FolderKanban size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">
            {search ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="empty-state-text">
            {search ? 'Try a different search term.' : 'Create your first project to get started.'}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Create New Project</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="label">Project Name *</label>
                <input
                  id="project-name"
                  type="text"
                  className="input"
                  placeholder="Enter project name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Description</label>
                <textarea
                  id="project-description"
                  className="input"
                  placeholder="Describe your project..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? <div className="spinner" /> : <><Plus size={16} /> Create Project</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
