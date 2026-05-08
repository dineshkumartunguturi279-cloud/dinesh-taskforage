import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', sort: '-created_at' });
  const [pagination, setPagination] = useState({ next: null, previous: null, count: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => { loadTasks(); }, [filters, page]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      const res = await tasksAPI.myTasks(params);
      setTasks(res.data.results || []);
      setPagination({ next: res.data.next, previous: res.data.previous, count: res.data.count });
    } catch { toast.error('Failed to load tasks.'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.updateStatus(task.project, task.id, { status: newStatus });
      toast.success('Status updated.');
      loadTasks();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={24} style={{ color: 'var(--color-primary)' }} /> My Tasks
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Tasks assigned to you across all projects</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 12rem', maxWidth: '20rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="select" style={{ width: 'auto', minWidth: '8rem' }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
        </select>
        <select className="select" style={{ width: 'auto', minWidth: '8rem' }} value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
        </select>
        <select className="select" style={{ width: 'auto', minWidth: '8rem' }} value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
          <option value="-created_at">Newest</option><option value="created_at">Oldest</option><option value="due_date">Due ↑</option><option value="-due_date">Due ↓</option>
        </select>
      </div>

      {loading ? (
        <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '4rem', marginBottom: '0.5rem', borderRadius: 'var(--radius-lg)' }} />)}</div>
      ) : tasks.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {tasks.map(t => (
            <div key={t.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: '12rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t.title}</span>
                  {t.is_overdue && <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.125rem', fontSize: '0.6875rem' }}><AlertTriangle size={12} /> Overdue</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/projects/${t.project}`)}>{t.project_name}</span>
                  {t.due_date && <span>Due: {t.due_date}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                <select className="select" style={{ width: 'auto', minWidth: '7rem', padding: '0.25rem 1.75rem 0.25rem 0.5rem', fontSize: '0.75rem' }} value={t.status} onChange={e => handleStatusChange(t, e.target.value)}>
                  <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state" style={{ padding: '3rem' }}>
          <CheckSquare size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No tasks assigned</h3>
          <p className="empty-state-text">{filters.search || filters.status || filters.priority ? 'Try different filters.' : 'You have no tasks assigned yet.'}</p>
        </div>
      )}

      {(pagination.next || pagination.previous) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn-secondary btn-sm" disabled={!pagination.previous} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>Page {page}</span>
          <button className="btn-secondary btn-sm" disabled={!pagination.next} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
