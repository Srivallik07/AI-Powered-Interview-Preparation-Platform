import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Users, Compass, Cpu, Zap, AlertTriangle, List, ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { getAuthHeaders, API_URL } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchMetrics();
    fetchAuditLogs(1);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/metrics`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchAuditLogs = async (pageNum) => {
    setLogLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/audit-logs?page=${pageNum}&limit=10`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setTotalLogs(data.pagination.totalLogs);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogLoading(false);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchMetrics();
    fetchAuditLogs(1);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading admin telemetry panels...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px' }}>
            AI-Powered Interview Preparation <span style={{ color: 'var(--danger)' }}>Admin</span>
          </span>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Telemetry
        </button>
      </header>

      {/* Content container */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '30px', fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>Security & Evaluation Telemetry</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Observe rate violations, LLM costs, and LangChain evaluation logs in real-time.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}><Users size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Registered Users</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>{metrics?.users || 0}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mongoose user accounts</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--accent-secondary)', marginBottom: '8px' }}><Compass size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Prep Sessions</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>{metrics?.sessions || 0}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-agent graph compiles</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--info)', marginBottom: '8px' }}><Cpu size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>LLM API Calls</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>{metrics?.llm?.totalCalls || 0}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Latency: {metrics?.llm?.avgLatencyMs || 0}ms</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--success)', marginBottom: '8px' }}><Zap size={24} /></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Token Cost</div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>${metrics?.llm?.totalCostUsd || '0.00'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accumulated Groq API billing</div>
          </div>

        </div>

        {/* Security and Evaluation Panel split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', marginBottom: '40px', alignItems: 'start' }}>
          
          {/* Security Incidents Panel */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-heading)', color: 'var(--danger)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={18} /> Threat Detections & Rate Violations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Prompt Injection Blocks</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Disallowed injection keywords blocked</span>
                </div>
                <span className="badge badge-danger" style={{ fontSize: '16px', padding: '6px 12px' }}>
                  {metrics?.security?.promptInjectionAttempts || 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Rate Limit Violations</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IP or client call limit exclusions</span>
                </div>
                <span className="badge badge-warning" style={{ fontSize: '16px', padding: '6px 12px' }}>
                  {metrics?.security?.rateLimitHits || 0}
                </span>
              </div>
            </div>
          </div>

          {/* LangSmith Evaluation Metric Panels */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--info)' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-heading)', color: 'var(--info)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart2 size={18} /> LangChain & RAG Correctness Dials
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>ACCURACY</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{metrics?.llm?.scores?.accuracy || 0}%</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Factually matching answers</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>RELEVANCE</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{metrics?.llm?.scores?.relevance || 0}%</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Question alignment rate</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>FAITHFULNESS</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{metrics?.llm?.scores?.faithfulness || 0}%</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Grounded in retrieve context</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>HALLUCINATION RATE</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger)', margin: '4px 0' }}>{metrics?.llm?.scores?.hallucinationRate || 0}%</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unsupported claims detected</span>
              </div>

            </div>
          </div>

        </div>

        {/* Audit Logs Table */}
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '17px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <List size={18} style={{ color: 'var(--accent-primary)' }} /> Live Audit Log Trail ({totalLogs} records)
            </h3>
          </div>

          {logLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading logs database query...</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>TIMESTAMP</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>USER</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>METHOD</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>ENDPOINT</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>IP</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>{log.username}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: log.method === 'POST' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)', color: log.method === 'POST' ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                          {log.method}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.endpoint}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{log.ip}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge ${log.status === 'success' ? 'badge-success' : log.status === 'blocked' ? 'badge-danger' : 'badge-warning'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fetchAuditLogs(page - 1)}
                disabled={page <= 1 || logLoading}
                className="btn btn-secondary btn-sm"
              >
                Prev
              </button>
              <button
                onClick={() => fetchAuditLogs(page + 1)}
                disabled={page >= totalPages || logLoading}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
export default AdminDashboard;
