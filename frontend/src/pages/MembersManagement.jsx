import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowLeft, Plus, Shield, ShieldOff, UserMinus, Crown, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MembersManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role: 'MEMBER' });
  const [adding, setAdding] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (showAdd) {
      fetchUsers();
    }
  }, [showAdd, userSearch]);

  const loadData = async () => {
    try {
      const [projRes, membersRes] = await Promise.all([projectsAPI.get(id), projectsAPI.getMembers(id)]);
      setProject(projRes.data.data);
      setMembers(membersRes.data.data);
    } catch { toast.error('Failed to load.'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await authAPI.getUsers(userSearch);
      setAllUsers(res.data.data);
    } catch { toast.error('Failed to load users.'); }
  };

  const isAdmin = project?.my_role === 'ADMIN';

  const handleAdd = async (email) => {
    setAdding(true);
    try {
      await projectsAPI.addMember(id, { email, role: addForm.role });
      toast.success('Member added!'); setShowAdd(false); setAddForm({ email: '', role: 'MEMBER' }); loadData();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
    finally { setAdding(false); }
  };

  const handleRole = async (mid, role) => {
    try { await projectsAPI.updateMember(id, mid, { role }); toast.success('Role updated.'); loadData(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
  };

  const handleRemove = async (mid, name) => {
    if (!confirm(`Remove ${name}?`)) return;
    try { await projectsAPI.removeMember(id, mid); toast.success('Removed.'); loadData(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
  };

  const handleTransfer = async (uid, name) => {
    if (!confirm(`Transfer ownership to ${name}?`)) return;
    try { await projectsAPI.transferOwnership(id, { user_id: uid }); toast.success('Transferred.'); loadData(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed.'); }
  };

  if (loading) return <div>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:'4rem',marginBottom:'0.75rem',borderRadius:'var(--radius-lg)'}}/>)}</div>;

  return (
    <div>
      <button onClick={()=>navigate(`/projects/${id}`)} style={{background:'none',border:'none',color:'var(--color-text-muted)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.375rem',marginBottom:'1rem',fontSize:'0.875rem'}}>
        <ArrowLeft size={16}/> Back to {project?.name}
      </button>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:700,display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Users size={24} style={{color:'var(--color-primary)'}}/> Members
          </h1>
          <p style={{color:'var(--color-text-muted)',fontSize:'0.875rem',marginTop:'0.25rem'}}>{project?.name} · {members.length} members</p>
        </div>
        {isAdmin && <button onClick={()=>setShowAdd(true)} className="btn-primary"><Plus size={18}/> Add Member</button>}
      </div>

      <div style={{display:'grid',gap:'0.75rem'}}>
        {members.map(m=>(
          <div key={m.id} className="card" style={{padding:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.75rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
              <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'50%',background:`linear-gradient(135deg, ${m.role==='ADMIN'?'#6366f1,#8b5cf6':'#10b981,#14b8a6'})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:'0.875rem',color:'white',flexShrink:0}}>
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span style={{fontSize:'0.9375rem',fontWeight:600}}>{m.user.name}</span>
                  {m.user.id===project?.created_by?.id && <span style={{fontSize:'0.6875rem',color:'#fbbf24',display:'flex',alignItems:'center',gap:'0.125rem'}}><Crown size={12}/> Owner</span>}
                  {m.user.id===user?.id && <span style={{fontSize:'0.6875rem',color:'var(--color-text-muted)'}}>(You)</span>}
                </div>
                <div style={{fontSize:'0.8125rem',color:'var(--color-text-muted)'}}>{m.user.email}</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
              {isAdmin && m.user.id!==user?.id && (
                <div style={{display:'flex',gap:'0.375rem'}}>
                  <button onClick={()=>handleRole(m.id, m.role==='MEMBER'?'ADMIN':'MEMBER')} className="btn-secondary btn-sm" title={m.role==='MEMBER'?'Promote':'Demote'}>
                    {m.role==='MEMBER'?<Shield size={14}/>:<ShieldOff size={14}/>}
                  </button>
                  <button onClick={()=>handleTransfer(m.user.id,m.user.name)} className="btn-secondary btn-sm" title="Transfer Ownership"><Crown size={14}/></button>
                  <button onClick={()=>handleRemove(m.id,m.user.name)} className="btn-danger btn-sm" title="Remove"><UserMinus size={14}/></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={{padding:'1.5rem',borderBottom:'1px solid var(--color-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontSize:'1.125rem',fontWeight:600}}>Add Member</h2>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',color:'var(--color-text-muted)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div style={{padding:'1.5rem'}}>
              <div style={{marginBottom:'1.25rem'}}>
                <label className="label">Search Users</label>
                <div style={{position:'relative'}}>
                  <Mail size={16} style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:'var(--color-text-muted)'}}/>
                  <input type="text" className="input" style={{paddingLeft:'2.5rem'}} placeholder="Search by name or email..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} autoFocus/>
                </div>
              </div>
              
              <div style={{maxHeight:'15rem',overflowY:'auto',marginBottom:'1.5rem',display:'grid',gap:'0.5rem'}}>
                {allUsers.length === 0 ? (
                  <div style={{padding:'1.5rem',textAlign:'center',color:'var(--color-text-muted)',fontSize:'0.875rem'}}>No users found.</div>
                ) : (
                  allUsers.map(u => {
                    const isAlreadyMember = members.some(m => m.user.id === u.id);
                    const isBusy = u.project_count > 0 || u.active_task_count > 0;
                    
                    return (
                      <div key={u.id} className="card" style={{padding:'0.75rem',display:'flex',justifyContent:'space-between',alignItems:'center',opacity:isAlreadyMember?0.5:1}}>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:'0.875rem',fontWeight:600,display:'flex',alignItems:'center',gap:'0.5rem'}}>
                            {u.name}
                            {isBusy && !isAlreadyMember && (
                              <span style={{color:'#fbbf24',fontSize:'0.75rem',background:'rgba(251,191,36,0.1)',padding:'0.125rem 0.375rem',borderRadius:'1rem',fontWeight:500}}>
                                Caution: Busy in {u.project_count} project(s)
                              </span>
                            )}
                          </div>
                          <div style={{fontSize:'0.75rem',color:'var(--color-text-muted)',overflow:'hidden',textOverflow:'ellipsis'}}>{u.email}</div>
                        </div>
                        {isAlreadyMember ? (
                          <span style={{fontSize:'0.75rem',color:'var(--color-text-muted)'}}>In Project</span>
                        ) : (
                          <button onClick={()=>handleAdd(u.email)} className="btn-secondary btn-sm" disabled={adding}>
                            {adding?<div className="spinner-sm"/>:'Add'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{paddingTop:'1.5rem',borderTop:'1px solid var(--color-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  <label className="label" style={{marginBottom:0}}>Assign as:</label>
                  <select className="select" style={{width:'8rem',padding:'0.375rem 0.5rem'}} value={addForm.role} onChange={e=>setAddForm({...addForm,role:e.target.value})}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button type="button" onClick={()=>setShowAdd(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
