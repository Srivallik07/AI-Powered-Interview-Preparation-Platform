import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Play, Mic, MicOff, Send, Award, ArrowRight, Shield, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';

export const MockInterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, API_URL } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  // Speech to Text state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Assessment state
  const [evalLoading, setEvalLoading] = useState(false);
  const [questionEval, setQuestionEval] = useState(null); // stores active evaluation of the current question
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInterviewDetails();
    
    // Start interview timer
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/interview/interviews/${id}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setInterview(data.interview);
        // Find first unanswered question index
        const unansweredIdx = data.interview.questions.findIndex(q => !q.answer || q.answer.trim().length === 0);
        if (unansweredIdx !== -1) {
          setCurrentQIndex(unansweredIdx);
        } else {
          // All answered, view summary
          setCurrentQIndex(data.interview.questions.length - 1);
          setQuestionEval(data.interview.questions[data.interview.questions.length - 1].evaluation);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format Timer
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Speech recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech-to-text is not supported by your browser. We recommend using Google Chrome.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsRecording(true);
    };

    rec.onresult = (e) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setAnswerText(prev => prev + finalTranscript);
      }
    };

    rec.onerror = (e) => {
      console.error('Speech error:', e.error);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Submit and Score answer
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setErrorMsg('Please write or dictate an answer before submitting.');
      return;
    }

    setEvalLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/interview/interviews/${id}/answer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          questionIndex: currentQIndex,
          answer: answerText
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuestionEval(data.evaluation);
        
        // Update local state
        const updatedQuestions = [...interview.questions];
        updatedQuestions[currentQIndex].answer = answerText;
        updatedQuestions[currentQIndex].evaluation = data.evaluation;
        setInterview({ ...interview, questions: updatedQuestions });
      } else {
        setErrorMsg(data.message || 'Failed to submit response.');
      }
    } catch (err) {
      setErrorMsg('Failed to establish server connection.');
    } finally {
      setEvalLoading(false);
    }
  };

  // Move forward
  const handleNext = () => {
    setQuestionEval(null);
    setAnswerText('');
    setCurrentQIndex(prev => prev + 1);
  };

  // Finish Simulation
  const handleCompleteInterview = async () => {
    setEvalLoading(true);
    try {
      const res = await fetch(`${API_URL}/interview/interviews/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/results/${id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading simulation setup...</span>
      </div>
    );
  }

  if (!interview) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Mock interview details not found.</span>
      </div>
    );
  }

  const activeQuestion = interview.questions[currentQIndex];
  const totalQuestions = interview.questions.length;
  const isLastQuestion = currentQIndex === totalQuestions - 1;
  const isQuestionAnswered = !!activeQuestion.answer;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> Duration: <strong style={{ color: 'var(--text-primary)' }}>{formatTime(timerSeconds)}</strong>
          </span>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">Quit Portal</button>
        </div>
      </header>

      {/* Main split dashboard view */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: questionEval ? '1.1fr 1fr' : '1.5fr', gap: '30px' }}>
        
        {/* Left Side: Question and Text Input Box */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
          
          {/* Question Index Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', color: 'var(--accent-secondary)', fontWeight: 700 }}>
              QUESTION {currentQIndex + 1} OF {totalQuestions}
            </span>
            <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
              {activeQuestion.type} DRILL
            </span>
          </div>

          {/* Question Text */}
          <div style={{ flex: 1, marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)', lineHeight: 1.4, marginBottom: '16px' }}>
              {activeQuestion.question}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                IDEAL CRITERIA:
              </span>
              {activeQuestion.idealKeywords?.map((kw, idx) => (
                <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px', borderRadius: 'var(--border-radius-sm)', marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}

          {/* Textarea Input and Mic option */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <textarea
              className="form-input"
              style={{ minHeight: '180px', padding: '20px', resize: 'none', fontSize: '15px', lineHeight: '1.6', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', paddingBottom: '50px' }}
              placeholder="Type your detailed interview answer here... (Tip: structured answers score much better)"
              value={answerText}
              onChange={(e) => { setAnswerText(e.target.value); setErrorMsg(''); }}
              disabled={isQuestionAnswered || evalLoading}
            />

            {/* Microphone button inside text field */}
            {!isQuestionAnswered && (
              <button
                type="button"
                onClick={handleToggleRecord}
                style={{
                  position: 'absolute', right: '14px', bottom: '14px',
                  background: isRecording ? 'var(--danger)' : 'var(--bg-tertiary)',
                  color: '#fff', border: '1px solid var(--border-color)',
                  borderRadius: '50%', width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'var(--transition-fast)',
                  boxShadow: isRecording ? '0 0 15px rgba(239,68,68,0.4)' : 'none'
                }}
                title={isRecording ? 'Stop dictating' : 'Dictate response'}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {isRecording && <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} /> Listening to voice...
              </span>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* If answered and score shown, render path forwards */}
              {isQuestionAnswered && questionEval ? (
                !isLastQuestion ? (
                  <button onClick={handleNext} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                    Next Question <ArrowRight size={15} />
                  </button>
                ) : (
                  <button onClick={handleCompleteInterview} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px', background: 'linear-gradient(135deg, var(--success) 0%, var(--accent-primary) 100%)' }} disabled={evalLoading}>
                    {evalLoading ? 'Saving...' : 'Finish Simulation'}
                  </button>
                )
              ) : (
                <button
                  onClick={handleSubmitAnswer}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px', gap: '6px' }}
                  disabled={evalLoading || isRecording}
                >
                  {evalLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                  {evalLoading ? 'Evaluating...' : 'Verify Response'}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Score Evaluation Panel */}
        {questionEval && (
          <div className="glass-card animate-fade-in" style={{ borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} style={{ color: 'var(--accent-secondary)' }} /> Response Assessment
              </h3>
              <div style={{ background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)' }}>{questionEval.score}/10</span>
              </div>
            </div>

            {/* Criteria breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>RELEVANCE</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{questionEval.relevance}/10</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>COMPLETENESS</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{questionEval.completeness}/10</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>CLARITY</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{questionEval.clarity}/10</span>
              </div>
            </div>

            {/* Feedback text */}
            <div style={{ flex: 1, marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>VERDICT</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {questionEval.feedback}
              </p>
            </div>

            {/* Improvement suggestions */}
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700 }}>RECOMMENDATIONS</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questionEval.suggestions?.map((item, idx) => (
                  <li key={idx} style={{ lineHeight: '1.5' }}>{item}</li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}} />

    </div>
  );
};
export default MockInterviewPage;
