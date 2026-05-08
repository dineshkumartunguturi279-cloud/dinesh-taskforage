import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, projectsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Plus, ArrowLeft, Search, Filter, X, Calendar, AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', sort: '-created_at' });
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'MEDIUM', status: 'TODO', assigned_to: [] });
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ next: null, previous: null, count: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => { loadProject(); }, [id]);
  useEffect(() => { loadTasks(); }, [id, filters, page]);

  const loadProject = async () => {
    try {
      const [pRes, mRes] = await Promise.all([projectsAPI.get(id), projectsAPI.getMembers(id)]);
      setProject(pRes.data.data);
      setMembers(mRes.data.data);
    } catch { navigate('/projects'); }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      const res = await tasksAPI.list(id, params);
      setTasks(res.data.results || []);
      setPagination({ next: res.data.next, previous: res.data.previous, count: res.data.count });
    } catch { toast.error('Failed to load tasks.'); }
    finally { setLoading(false); }
  };

  const isAdmin = project?.my_role === 'ADMIN';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required.'); return; }
    setSaving(true);
    try {
      await tasksAPI.create(id, form);
      toast.success('Task created!');
      setShowCreate(false);
      resetForm();
      loadTasks();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tasksAPI.update(id, showEdit, form);
      toast.success('Task updated!');
      setShowEdit(null);
      resetForm();
      loadTasks();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id, taskId); toast.success('Deleted.'); loadTasks(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try { await tasksAPI.updateStatus(id, taskId, { status: newStatus }); toast.success('Status updated.'); loadTasks(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Cannot update status.'); }
  };

  const openEdit = (task) => {
    setForm({
      title: task.title, description: task.description || '', due_date: task.due_date || '',
      priority: task.priority, status: task.status,
      assigned_to: task.assignees?.map(a => a.id) || []
    });
    setShowEdit(task.id);
  };

  const resetForm = () => setForm({ title: '', description: '', due_date: '', priority: 'MEDIUM', status: 'TODO', assigned_to: [] });

  const toggleAssignee = (uid) => {
    setForm(f => ({
      ...f,
      assigned_to: f.assigned_to.includes(uid) ? f.assigned_to.filter(x => x !== uid) : [...f.assigned_to, uid]
    }));
  };

  return (
    <div>
      <button onClick={() => navigate(`/projects/${id}`)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Back to {project?.name}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={24} style={{ color: 'var(--color-primary)' }} /> Tasks
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{project?.name} · {pagination.count} tasks</p>
        </div>
        {isAdmin && <button onClick={() => { resetForm(); setShowCreate(true); }} className="btn-primary"><Plus size={18} /> New Task</button>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 12rem', maxWidth: '20rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="select" style={{ width: 'auto', minWidth: '8rem' }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select className="select" style={{ width: 'auto', minWidth: '8rem' }} value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select className="select" style={{ width: 'auto', minWidth: '8rem' }} value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
          <option value="-created_at">Newest</option>
          <option value="created_at">Oldest</option>
          <option value="due_date">Due Date ↑</option>
          <option value="-due_date">Due Date ↓</option>
          <option value="priority">Priority ↑</option>
          <option value="-priority">Priority ↓</option>
        </select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '4rem', marginBottom: '0.5rem', borderRadius: 'var(--radius-lg)' }} />)}</div>
      ) : tasks.length > 0 ? (
        <div className="table-container">
          <table>
            <thead><tr><th>Task</th><th className="hide-mobile">Priority</th><th>Status</th><th className="hide-mobile">Due</th><th className="hide-mobile">Assignees</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{t.description}</div>}
                    {t.is_overdue && <span style={{ fontSize: '0.6875rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}><AlertTriangle size={12} /> Overdue</span>}
                  </td>
                  <td className="hide-mobile"><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                  <td>
                    {(isAdmin || t.assignees?.some(a => a.id === user?.id)) ? (
                      <select className="select" style={{ width: 'auto', minWidth: '7rem', padding: '0.25rem 1.75rem 0.25rem 0.5rem', fontSize: '0.75rem' }} value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${t.status.toLowerCase().replace('_','-')}`}>{t.status.replace('_',' ')}</span>
                    )}
                  </td>
                  <td className="hide-mobile">{t.due_date || '—'}</td>
                  <td className="hide-mobile">
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {t.assignees?.slice(0, 3).map(a => (
                        <div key={a.id} title={a.name} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 600, color: 'white' }}>
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {(t.assignee_count || 0) > 3 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>+{t.assignee_count - 3}</span>}
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => openEdit(t)} className="btn-secondary btn-sm"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(t.id)} className="btn-danger btn-sm"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state" style={{ padding: '3rem' }}>
          <CheckSquare size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-text">{filters.search || filters.status || filters.priority ? 'Try different filters.' : 'Create your first task.'}</p>
          {isAdmin && !filters.search && <button onClick={() => { resetForm(); setShowCreate(true); }} className="btn-primary" style={{ marginTop: '1rem' }}><Plus size={16} /> Create Task</button>}
        </div>
      )}

      {/* Pagination */}
      {(pagination.next || pagination.previous) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn-secondary btn-sm" disabled={!pagination.previous} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>Page {page}</span>
          <button className="btn-secondary btn-sm" disabled={!pagination.next} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || showEdit) && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setShowEdit(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '36rem' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{showEdit ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => { setShowCreate(false); setShowEdit(null); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={showEdit ? handleUpdate : handleCreate} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Title *</label>
                <input type="text" className="input" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Description</label>
                <textarea className="input" placeholder="Describe the task..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Assign To</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '8rem', overflowY: 'auto' }}>
                  {members.map(m => {
                    // Support both ProjectMember and User objects just in case
                    const userObj = m.user || m;
                    const isBusy = (userObj.active_task_count || 0) > 0;
                    const isSelected = form.assigned_to.includes(userObj.id);
                    const displayName = userObj.name || userObj.email || 'Unknown User';
                    
                    return (
                      <button key={userObj.id} type="button" onClick={() => toggleAssignee(userObj.id)} style={{
                        padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', cursor: 'pointer',
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-bg)',
                        color: isSelected ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.125rem'
                      }}>
                        <span style={{fontWeight:isSelected?600:400}}>{displayName}</span>
                        {isBusy && (
                          <span style={{fontSize:'0.625rem', color:'#fbbf24', display:'flex', alignItems:'center', gap:'0.125rem'}}>
                            <AlertTriangle size={10}/> {userObj.active_task_count} active tasks
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowCreate(false); setShowEdit(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? <div className="spinner" /> : showEdit ? 'Update Task' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
