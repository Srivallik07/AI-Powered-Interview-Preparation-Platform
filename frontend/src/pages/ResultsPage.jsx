import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Award, Map, ArrowRight, BookOpen, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';

export const ResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, API_URL } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/interview/interviews/${id}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setInterview(data.interview);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviewDetails();
  }, [id]);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Gathering evaluation report...</span>
      </div>
    );
  }

  if (!interview) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Interview result details not found.</span>
      </div>
    );
  }

  const overallScore = interview.overallScore || 0;
  const gradeLabel = overallScore >= 8 ? 'Premium Fit' : overallScore >= 6 ? 'Solid Foundation' : 'Requires Preparation';
  const badgeClass = overallScore >= 8 ? 'badge-success' : overallScore >= 6 ? 'badge-warning' : 'badge-danger';

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
      <main style={{ flex: 1, padding: '40px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        
        {/* Title area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '8px' }}>🤖 Evaluation completed</div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>Interview Performance Report</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Candidate scorecards calculated using LangChain answer checks.</p>
          </div>
          <Link to={`/roadmap/${interview._id}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Map size={16} /> View Custom Study Roadmap <ArrowRight size={16} />
          </Link>
        </div>

        {/* Results Core Overview Card */}
        <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center', padding: '30px 40px', marginBottom: '40px', borderLeft: '5px solid var(--accent-primary)' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center', minWidth: '160px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>OVERALL GRADE</span>
            <span style={{ fontSize: '38px', fontWeight: 800, color: 'var(--accent-primary)', display: 'block', margin: '4px 0' }}>{overallScore}</span>
            <span style={{ fontSize: '12px' }} className={`badge ${badgeClass}`}>{gradeLabel}</span>
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ThumbsUp size={16} style={{ color: 'var(--accent-secondary)' }} /> Performance Feedback Summary
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
              {interview.overallFeedback}
            </p>
          </div>
        </div>

        {/* Question by Question Detailed breakdown */}
        <div>
          <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', marginBottom: '20px' }}>Response Breakdown ({interview.questions.length} questions)</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {interview.questions.map((q, idx) => {
              const isExpanded = expandedIndex === idx;
              
              return (
                <div key={idx} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  
                  {/* Collapsed Header */}
                  <div
                    onClick={() => toggleExpand(idx)}
                    style={{
                      padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>Q{idx + 1}</span>
                        <span className="badge badge-info" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{q.type}</span>
                      </div>
                      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>{q.question.slice(0, 80)}...</h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                        {q.evaluation?.score || 0}/10
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>YOUR RESPONSE:</h5>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontStyle: 'italic' }}>
                          "{q.answer || '[No response provided]'}"
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h5 style={{ fontSize: '12px', color: 'var(--success)', marginBottom: '6px', fontWeight: 700 }}>EVALUATION DETAILS:</h5>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {q.evaluation?.feedback}
                          </p>
                        </div>
                        <div>
                          <h5 style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '6px', fontWeight: 700 }}>SUGGESTIONS FOR IMPROVEMENT:</h5>
                          <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {q.evaluation?.suggestions?.map((item, keyIdx) => (
                              <li key={keyIdx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};
export default ResultsPage;
