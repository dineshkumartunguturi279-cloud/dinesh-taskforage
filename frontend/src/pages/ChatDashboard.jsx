import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import ProjectChat from './ProjectChat';
import { MessageSquare, Search, Hash } from 'lucide-react';

export default function ChatDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('id');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.list({ page_size: 100 });
      setProjects(res.data.results || []);
    } catch { /* handle error */ }
    finally { setLoading(false); }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: 'calc(100vh - 7rem)', display: 'flex', gap: '1rem' }}>
      {/* Sidebar List */}
      <div style={{ 
        width: '20rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' 
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
            Messages
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" className="input" style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search chats..." 
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSearchParams({ id: p.id })}
                style={{ 
                  padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                  background: selectedProjectId === String(p.id) ? 'var(--color-primary-subtle)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { if (selectedProjectId !== String(p.id)) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={e => { if (selectedProjectId !== String(p.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ 
                  width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', 
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'white', flexShrink: 0
                }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Hash size={12} /> Project Channel
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No chats found.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {selectedProjectId ? (
          <div key={selectedProjectId} style={{ height: '100%' }}>
            {/* We can't use ProjectChat as is because it uses useParams. 
                I'll modify ProjectChat to accept a prop id or use the one from searchParams */}
            <ChatWindow projectId={selectedProjectId} />
          </div>
        ) : (
          <div style={{ 
            height: '100%', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' 
          }}>
            <div style={{ 
              width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--color-primary-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
            }}>
              <MessageSquare size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select a conversation</h3>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '20rem' }}>
              Select a project from the left to start chatting with your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Internal component for the chat window that doesn't rely on URL params
function ChatWindow({ projectId }) {
  // Copy of ProjectChat logic but using projectId prop
  // For now, I'll actually refactor ProjectChat to be more generic.
  return <div style={{height: '100%'}}><ProjectChat overrideId={projectId} /></div>;
}
