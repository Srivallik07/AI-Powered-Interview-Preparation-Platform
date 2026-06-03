import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, LogOut, ArrowRight, BarChart2, Plus, Calendar, Compass, Clipboard } from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout, getAuthHeaders, API_URL } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_URL}/interview/sessions`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleStartPrep = () => {
    navigate('/prep-setup');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Dashboard Navbar */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px' }} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/assistant" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '13px', marginRight: '5px' }}>RAG Assistant</Link>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong></span>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Admin Dashboard</Link>
          )}
          <button onClick={logout} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Welcome Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>Candidate Prep Hub</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Create custom preparation environments and track your skill progression.</p>
          </div>
          <button onClick={handleStartPrep} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New Prep Session
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}><Compass size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Sessions</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>{sessions.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Environments parsed & analyzed</div>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--success)', marginBottom: '8px' }}><BarChart2 size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Match Rate</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>
              {sessions.length > 0
                ? Math.round(
                    (sessions.reduce((acc, curr) => {
                      const matched = curr.skillGaps?.matchedSkills?.length || 0;
                      const missing = curr.skillGaps?.missingSkills?.length || 0;
                      const total = matched + missing;
                      return acc + (total > 0 ? (matched / total) * 100 : 0);
                    }, 0) / sessions.length)
                  )
                : 0}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Resume and JD skill correspondence</div>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--warning)', marginBottom: '8px' }}><Clipboard size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Roles</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>
              {sessions.length > 0 ? new Set(sessions.map(s => s.title)).size : 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unique role categories explored</div>
          </div>
        </div>

        {/* Previous Prep Environments List */}
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Your Active Environments</h2>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading sessions history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px', borderStyle: 'dashed' }}>
              <Compass size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Prep Environments Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px', fontSize: '14px' }}>
                Get started by creating your first prep environment. Upload your resume and paste a job description.
              </p>
              <button onClick={handleStartPrep} className="btn btn-primary btn-sm">
                Initialize Setup
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sessions.map((session) => {
                const matchedCount = session.skillGaps?.matchedSkills?.length || 0;
                const missingCount = session.skillGaps?.missingSkills?.length || 0;
                
                return (
                  <div key={session._id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '24px 30px' }}>
                    <div style={{ minWidth: '250px', flex: 1 }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--text-primary)' }}>{session.title}</h3>
                      <div style={{ display: 'flex', gap: '15px', color: 'var(--text-secondary)', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <span>Resume: <strong style={{ color: 'var(--text-primary)' }}>{session.resumeName}</strong></span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <span className="badge badge-success">{matchedCount} Matched</span>
                        <span className="badge badge-warning">{missingCount} Missing</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <Link to={`/skill-gap/${session._id}`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Skill Gap Analysis
                      </Link>
                      <button
                        onClick={async () => {
                          // Fetch associated interview to route user directly
                          try {
                            const res = await fetch(`${API_URL}/interview/sessions/${session._id}`, {
                              headers: getAuthHeaders()
                            });
                            const data = await res.json();
                            if (data.success && data.interviews && data.interviews.length > 0) {
                              const interview = data.interviews[0];
                              navigate(`/mock-interview/${interview._id}`);
                            } else {
                              alert('No associated mock interview found. Create a new session.');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Enter Simulation <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
export default DashboardPage;
