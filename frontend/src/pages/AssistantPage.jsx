import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Send, ArrowLeft, Bot, User, Clock, Bookmark, HelpCircle } from 'lucide-react';

export const AssistantPage = () => {
  const navigate = useNavigate();
  const { getAuthHeaders, API_URL } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AI-Powered Interview Preparation Platform Assistant. Ask me anything about System Design, JavaScript internals, ACID databases, behavioral strategies, or dev tools, and I will search our 50-document knowledge base to answer you!',
      timestamp: new Date()
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const suggestions = [
    'Explain CAP Theorem and its system trade-offs.',
    'How does JavaScript Event Loop prioritize Tasks vs Microtasks?',
    'What is ACID isolation and its different levels?',
    'Describe the STAR behavioral response structure.',
    'What are B-Tree indexes and how do they speed up SQL queries?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/interview/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      if (data.success) {
        // Add bot message
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.response,
          sources: data.sources || [],
          latency: data.latencyMs,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: 'Sorry, I failed to retrieve details for your query. Let me try again later.',
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Connection error. Please check if backend server is online.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px' }}>
            Interview Preparation <span className="gradient-text-accent">Chatbot</span>
          </span>
        </div>
        <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={13} /> 50 Docs Knowledge Base
        </div>
      </header>

      {/* Main Workspace split */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '30px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', height: 'calc(100vh - 75px)', overflow: 'hidden' }}>
        
        {/* Chat area */}
        <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Scrollable messages panel */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                
                {/* Icon avatar */}
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: msg.sender === 'user' ? 'var(--accent-secondary)' : 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Msg text bubble */}
                <div style={{ background: msg.sender === 'user' ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '16px 20px', borderRadius: '12px', fontSize: '14.5px', lineHeight: '1.6' }}>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  
                  {/* Sources Cited and Latency info */}
                  {msg.sender === 'bot' && (msg.sources?.length > 0 || msg.latency) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {msg.latency && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> Latency: <strong>{msg.latency}ms</strong>
                        </span>
                      )}
                      {msg.sources?.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Bookmark size={11} /> Citing: <strong>{msg.sources.join(', ')}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}

            {/* Typing Loader indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Bot size={18} />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '14px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Thinking and searching KB...</span>
                  <div className="dot-pulse" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Entry Field */}
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', background: 'var(--bg-secondary)' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              style={{ display: 'flex', gap: '12px' }}
            >
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                placeholder="Ask our interview prep knowledge base..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '14px 24px' }}
                disabled={loading || !inputVal.trim()}
              >
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        </div>

        {/* Right side suggestions panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <HelpCircle size={16} style={{ color: 'var(--accent-primary)' }} /> Quick Suggestions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  disabled={loading}
                  style={{
                    textAlign: 'left', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)', borderRadius: '8px',
                    padding: '12px', fontSize: '12.5px', color: 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'var(--transition-smooth)',
                    lineHeight: '1.4'
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-primary);
          animation: dot-pulse 1.2s infinite ease-in-out;
          display: inline-block;
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}} />
    </div>
  );
};
export default AssistantPage;
