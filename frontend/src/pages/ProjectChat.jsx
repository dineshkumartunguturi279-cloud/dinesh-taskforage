import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI, projectsAPI, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Send, Paperclip, X, File, Image, Video, 
  MoreVertical, Edit2, Trash2, ArrowLeft, MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectChat({ overrideId }) {
  const { id: urlId } = useParams();
  const id = overrideId || urlId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    loadProject();
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Polling for "real-time"
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadProject = async () => {
    try {
      const res = await projectsAPI.get(id);
      setProject(res.data.data);
    } catch { navigate('/projects'); }
  };

  const loadMessages = async () => {
    try {
      const res = await chatAPI.projectMessages(id);
      setMessages(res.data.data);
      setLoading(false);
    } catch { /* Fail silently to not annoy on polling */ }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;
    
    setSending(true);
    const formData = new FormData();
    formData.append('content', content);
    files.forEach(f => formData.append('files', f));

    try {
      await chatAPI.sendMessage(id, formData);
      setContent('');
      setFiles([]);
      loadMessages();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to send message.';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (mid) => {
    if (!confirm('Delete this message?')) return;
    try {
      await chatAPI.deleteMessage(mid);
      loadMessages();
    } catch { toast.error('Failed to delete.'); }
  };

  const startEdit = (msg) => {
    setEditing({ id: msg.id, content: msg.content });
  };

  const handleUpdate = async () => {
    try {
      await chatAPI.editMessage(editing.id, { content: editing.content });
      setEditing(null);
      loadMessages();
    } catch { toast.error('Failed to update.'); }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderContent = (text) => {
    // Basic @mention highlighting
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg)' }}>
        {!overrideId && (
          <button onClick={() => navigate(`/projects/${id}`)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{project?.name} Chat</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{project?.member_count} members</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender.id === user.id ? 'flex-end' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{msg.sender.name}</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div style={{ 
              maxWidth: '70%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)',
              background: msg.sender.id === user.id ? 'var(--color-primary)' : 'var(--color-bg)',
              color: msg.sender.id === user.id ? 'white' : 'var(--color-text)',
              border: msg.sender.id === user.id ? 'none' : '1px solid var(--color-border)',
              position: 'relative',
              group: 'true'
            }}>
              {editing?.id === msg.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea className="input" value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} style={{ minWidth: '15rem', background: 'white', color: 'black' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditing(null)} className="btn-secondary btn-sm">Cancel</button>
                    <button onClick={handleUpdate} className="btn-primary btn-sm">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{renderContent(msg.content)}</div>
                  {msg.is_edited && !msg.is_deleted && <span style={{ fontSize: '0.625rem', opacity: 0.7, marginLeft: '0.5rem' }}>(edited)</span>}
                </>
              )}

              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {msg.attachments.map(att => {
                    const fileUrl = att.file.startsWith('http') ? att.file : `${API_BASE_URL}${att.file}`;
                    const isImage = att.file_type.startsWith('image/');
                    const isVideo = att.file_type.startsWith('video/');

                    return (
                      <div key={att.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {isImage ? (
                          <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <img src={fileUrl} alt={att.file_name} style={{ width: '100%', maxHeight: '15rem', objectFit: 'cover', display: 'block' }} />
                          </a>
                        ) : isVideo ? (
                          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <video src={fileUrl} controls style={{ width: '100%', maxHeight: '15rem', display: 'block' }} />
                          </div>
                        ) : null}
                        
                        <a href={fileUrl} target="_blank" rel="noreferrer" style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', 
                          background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-md)',
                          textDecoration: 'none', color: 'inherit'
                        }}>
                          {isImage ? <Image size={16} /> : isVideo ? <Video size={16} /> : <File size={16} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.file_name}</div>
                            <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>{formatFileSize(att.file_size)}</div>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              {!msg.is_deleted && msg.sender.id === user.id && !editing && (
                <div style={{ position: 'absolute', right: '-2.5rem', top: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button onClick={() => startEdit(msg)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(msg.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Delete"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '1rem 1.5rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.5rem', background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                <span style={{ maxWidth: '8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <Paperclip size={20} />
            <input type="file" multiple onChange={e => setFiles([...files, ...Array.from(e.target.files)])} style={{ display: 'none' }} />
          </label>
          <input 
            type="text" className="input" placeholder="Type a message (use @ to mention)..." 
            value={content} onChange={e => setContent(e.target.value)} 
            disabled={sending}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.625rem' }} disabled={sending || (!content.trim() && files.length === 0)}>
            {sending ? <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
