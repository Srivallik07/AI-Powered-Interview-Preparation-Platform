import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Map, BookOpen, ExternalLink, CheckSquare, Square, CheckCircle, RefreshCw } from 'lucide-react';

export const RoadmapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, API_URL } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingTopic, setUpdatingTopic] = useState(null); // stores active topic title being toggled

  useEffect(() => {
    fetchInterview();
  }, [id]);

  const fetchInterview = async () => {
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

  const handleToggleTopic = async (weekNumber, topicTitle, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setUpdatingTopic(topicTitle);

    try {
      const res = await fetch(`${API_URL}/interview/interviews/${id}/roadmap/topic`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          weekNumber,
          topicTitle,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        // Sync local status
        const updatedWeeks = interview.roadmap.weeks.map(week => {
          if (week.weekNumber === weekNumber) {
            const updatedTopics = week.topics.map(topic => {
              if (topic.title === topicTitle) {
                return { ...topic, status: newStatus };
              }
              return topic;
            });
            return { ...week, topics: updatedTopics };
          }
          return week;
        });

        setInterview({
          ...interview,
          roadmap: { ...interview.roadmap, weeks: updatedWeeks }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTopic(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Building personal roadmap track...</span>
      </div>
    );
  }

  if (!interview || !interview.roadmap) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Study roadmap not found.</span>
      </div>
    );
  }

  // Calculate completion percentage
  let totalTopics = 0;
  let completedTopics = 0;
  interview.roadmap.weeks.forEach(week => {
    week.topics.forEach(t => {
      totalTopics++;
      if (t.status === 'completed') completedTopics++;
    });
  });
  
  const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
        </span>
        <button onClick={() => navigate(`/results/${id}`)} className="btn btn-secondary btn-sm">Back to Results</button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        
        {/* Title and Progress area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '8px' }}>🤖 RoadmapAgent generated</div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>Personal Study Roadmap</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>A personalized 4-week calendar targeting your specific detected skill gaps.</p>
          </div>

          {/* Progress dial */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>PROGRESS</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-primary)' }}>{completionPercent}%</span>
            </div>
            <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Weekly Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {interview.roadmap.weeks.map((week) => (
            <div key={week.weekNumber} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px', alignItems: 'start', padding: '30px' }}>
              
              {/* Week Number and focus */}
              <div style={{ position: 'sticky', top: '100px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  WEEK {week.weekNumber}
                </span>
                <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', lineHeight: '1.3' }}>
                  {week.focus}
                </h3>
              </div>

              {/* Topics list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {week.topics.map((topic, topicIdx) => {
                  const isCompleted = topic.status === 'completed';
                  const isPendingUpdate = updatingTopic === topic.title;

                  return (
                    <div
                      key={topicIdx}
                      style={{
                        padding: '20px', background: isCompleted ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)',
                        border: isCompleted ? '1px solid rgba(16,185,129,0.15)' : '1px solid var(--border-color)',
                        borderRadius: '10px', display: 'flex', gap: '15px', alignItems: 'flex-start',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {/* Checkbox button */}
                      <button
                        onClick={() => handleToggleTopic(week.weekNumber, topic.title, topic.status)}
                        disabled={isPendingUpdate}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                          padding: '0', marginTop: '2px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', transition: 'var(--transition-fast)'
                        }}
                      >
                        {isPendingUpdate ? (
                          <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : isCompleted ? (
                          <CheckSquare size={20} />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>

                      {/* Details */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '15px', color: isCompleted ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600, textDecoration: isCompleted ? 'line-through' : 'none', marginBottom: '6px' }}>
                          {topic.title}
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
                          {topic.details}
                        </p>

                        {/* Resources */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {topic.resources?.map((res, resIdx) => (
                            <a
                              key={resIdx}
                              href={res}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                background: 'rgba(255,255,255,0.03)', color: 'var(--accent-primary)',
                                textDecoration: 'none', fontSize: '11px', border: '1px solid var(--border-color)',
                                borderRadius: '4px', padding: '3px 8px', fontWeight: 600,
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                              onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            >
                              <BookOpen size={11} /> {res.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

      </main>
    </div>
  );
};
export default RoadmapPage;
