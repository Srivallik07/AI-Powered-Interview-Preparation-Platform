import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Sparkles, ArrowRight, CheckCircle, AlertTriangle, Compass, Map } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export const SkillGapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, API_URL } = useAuth();
  
  const [session, setSession] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/interview/sessions/${id}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setSession(data.session);
          if (data.interviews && data.interviews.length > 0) {
            setInterview(data.interviews[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionDetails();
  }, [id]);

  const handleStartSimulation = () => {
    if (interview) {
      navigate(`/mock-interview/${interview._id}`);
    } else {
      alert('Simulation is not ready yet. Please recreate the session.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading Gap Analysis...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Prep environment session not found.</span>
      </div>
    );
  }

  // Configure Radar Chart Data
  const skillLabels = session.skillGaps?.skillScores?.map(s => s.skill) || [];
  const skillScoresData = session.skillGaps?.skillScores?.map(s => s.score) || [];
  const idealScoresData = skillLabels.map(() => 100); // 100% target match

  const radarData = {
    labels: skillLabels,
    datasets: [
      {
        label: 'Your Resume Profile',
        data: skillScoresData,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'var(--accent-primary)',
        borderWidth: 2,
        pointBackgroundColor: 'var(--accent-primary)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'var(--accent-primary)'
      },
      {
        label: 'Job Target Expectations',
        data: idealScoresData,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(255, 255, 255, 0.3)',
        pointBorderColor: '#fff'
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: { color: 'var(--text-secondary)', font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 } },
        ticks: { display: false, maxTicksLimit: 5 },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: { labels: { color: 'var(--text-primary)', font: { family: 'Outfit', size: 12, weight: 600 } } }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
        </span>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">Dashboard</button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Title area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '8px' }}>🤖 GapAgent Report</div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>{session.title} &bull; Gap Analysis</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Calculated comparison mapping resume text against job description specs.</p>
          </div>
          <button onClick={handleStartSimulation} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Start Simulation <ArrowRight size={16} />
          </button>
        </div>

        {/* Dashboard layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Left panel: text analysis & list of skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="glass-card">
              <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} style={{ color: 'var(--accent-primary)' }} /> Alignment Summary
              </h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                {session.skillGaps?.gapAnalysis}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div className="glass-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--success)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Matched Skills ({session.skillGaps?.matchedSkills?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {session.skillGaps?.matchedSkills?.map((skill, idx) => (
                    <span key={idx} className="badge badge-success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      {skill}
                    </span>
                  ))}
                  {(!session.skillGaps?.matchedSkills || session.skillGaps.matchedSkills.length === 0) && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No direct skill matches detected.</span>
                  )}
                </div>
              </div>

              <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--warning)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Missing Competencies ({session.skillGaps?.missingSkills?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {session.skillGaps?.missingSkills?.map((skill, idx) => (
                    <span key={idx} className="badge badge-warning" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      {skill}
                    </span>
                  ))}
                  {(!session.skillGaps?.missingSkills || session.skillGaps.missingSkills.length === 0) && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No gaps! Perfect resume match.</span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Right panel: Radar Chart */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-heading)', alignSelf: 'flex-start', marginBottom: '20px' }}>
              Skill Mapping Visualization
            </h3>
            {skillLabels.length > 0 ? (
              <div style={{ width: '100%', maxWidth: '340px' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Insufficient data points to plot skill radar.</div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};
export default SkillGapPage;
