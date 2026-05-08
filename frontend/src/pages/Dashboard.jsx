/**
 * Dashboard with analytics, charts, and stats.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, AlertTriangle, Clock, TrendingUp,
  FolderKanban, ArrowRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const COLORS = {
  TODO: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  DONE: '#10b981',
  LOW: '#3b82f6',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await tasksAPI.dashboard();
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '7rem', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: '18rem', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  const statusData = data ? Object.entries(data.status_counts).map(([key, value]) => ({
    name: key.replace('_', ' '),
    value,
    color: COLORS[key],
  })).filter(d => d.value > 0) : [];

  const priorityData = data ? Object.entries(data.priority_counts).map(([key, value]) => ({
    name: key,
    value,
    color: COLORS[key],
  })) : [];

  const statCards = [
    { label: 'Total Tasks', value: data?.total_tasks || 0, icon: CheckSquare, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Projects', value: data?.total_projects || 0, icon: FolderKanban, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Overdue', value: data?.overdue_count || 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'My Tasks', value: data?.my_stats?.total || 0, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
          padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem'
        }}>
          <p style={{ color: 'var(--color-text)' }}>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutDashboard size={24} style={{ color: 'var(--color-primary)' }} />
          Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Welcome back, {user?.name}! Here's your overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* My Task Stats */}
      {data?.my_stats && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            My Task Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'To Do', count: data.my_stats.todo, color: '#3b82f6' },
              { label: 'In Progress', count: data.my_stats.in_progress, color: '#f59e0b' },
              { label: 'Done', count: data.my_stats.done, color: '#10b981' },
              { label: 'Overdue', count: data.my_stats.overdue, color: '#ef4444' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{
                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                background: `${color}11`, border: `1px solid ${color}33`, textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Status Distribution */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Task Status Distribution</h3>
          {statusData.length > 0 ? (
            <div style={{ height: '14rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {statusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="empty-state-text">No tasks yet</p>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Priority Breakdown</h3>
          {priorityData.some(d => d.value > 0) ? (
            <div style={{ height: '16rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="empty-state-text">No tasks yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Project Stats */}
      {data?.tasks_per_project?.length > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks Per Project</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {data.tasks_per_project.map((p) => {
              const total = p.total || 1;
              return (
                <div key={p.project_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.project_id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.project_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.total} tasks</span>
                  </div>
                  <div style={{ height: '0.375rem', borderRadius: '9999px', background: 'var(--color-bg)', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${(p.done / total) * 100}%`, background: '#10b981', transition: 'width 0.3s' }} />
                    <div style={{ width: `${(p.in_progress / total) * 100}%`, background: '#f59e0b', transition: 'width 0.3s' }} />
                    <div style={{ width: `${(p.todo / total) * 100}%`, background: '#3b82f6', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {data?.recent_tasks?.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Tasks</h3>
            <button onClick={() => navigate('/my-tasks')} className="btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="hide-mobile">Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="hide-mobile">Due</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_tasks.slice(0, 8).map((task) => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${task.project}/tasks`)}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                      {task.title}
                      {task.is_overdue && <span style={{ marginLeft: '0.5rem', color: '#ef4444', fontSize: '0.75rem' }}>⚠ Overdue</span>}
                    </td>
                    <td className="hide-mobile">{task.project_name}</td>
                    <td><span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>{task.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                    <td className="hide-mobile">{task.due_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data?.total_tasks && !data?.total_projects && (
        <div className="card empty-state" style={{ padding: '3rem' }}>
          <FolderKanban size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No data yet</h3>
          <p className="empty-state-text">Create a project and start adding tasks to see your dashboard analytics.</p>
          <button onClick={() => navigate('/projects')} className="btn-primary" style={{ marginTop: '1rem' }}>
            <FolderKanban size={16} /> Create First Project
          </button>
        </div>
      )}
    </div>
  );
}
