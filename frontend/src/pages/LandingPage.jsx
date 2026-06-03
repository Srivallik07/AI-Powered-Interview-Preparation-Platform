import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, ArrowRight, Shield, Award, Map, BarChart2, MessageSquare } from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at top, #1e1b4b 0%, var(--bg-primary) 70%)' }}>
      
      {/* Navbar */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', tracking: '-0.03em' }}>
            AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {user ? (
            <>
              <Link to="/assistant" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px', marginRight: '10px' }}>RAG Assistant</Link>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">Go to Dashboard</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-primary btn-sm">Admin Dashboard</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/auth" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>Log In</Link>
              <Link to="/auth" className="btn btn-primary btn-sm">Start Free</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div className="badge badge-info animate-fade-in" style={{ marginBottom: '24px', padding: '6px 14px', border: '1px solid rgba(6, 180, 212, 0.2)' }}>
          <Sparkles size={13} style={{ marginRight: '6px' }} /> Powered by LangGraph Multi-Agent RAG
        </div>

        <h1 className="gradient-text animate-fade-in" style={{ fontSize: '64px', lineHeight: 1.1, marginBottom: '24px', fontWeight: 800 }}>
          Generate Custom Interview Prep from Your Profile & JD
        </h1>
        
        <p className="animate-fade-in" style={{ fontSize: '19px', color: 'var(--text-secondary)', maxWidth: '750px', marginBottom: '40px', lineHeight: 1.6 }}>
          Upload your resume, paste the job description, and let our autonomous agents pinpoint your skill gaps, generate tailored mock interviews, score your answers, and build your personalized study roadmap.
        </p>

        <div className="animate-fade-in" style={{ display: 'flex', gap: '16px' }}>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '16px' }}>
            Get Started Now <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '16px' }}>
            Learn More
          </a>
        </div>

        {/* Features Section */}
        <section id="features" style={{ marginTop: '100px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '80px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '50px', fontFamily: 'var(--font-heading)' }}>
            Engineered Features for Landing High-Tier Offers
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', textAlign: 'left' }}>
            
            <div className="glass-card">
              <div style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}><Sparkles size={32} /></div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>ATS Resume Parser</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Converts PDF/DOCX resumes into clean structured technical profiles, skills, and histories using optimized LLMs.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--accent-secondary)', marginBottom: '16px' }}><BarChart2 size={32} /></div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Skill Gap Detection</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Pinpoints matching abilities and critical knowledge gaps using vector similarity, plotting progress on interactive radar charts.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--success)', marginBottom: '16px' }}><MessageSquare size={32} /></div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Dynamic Mock Interviews</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Face multi-category (technical, behavioral, scenario) questions generated contextually from your gap data using RAG.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--warning)', marginBottom: '16px' }}><Award size={32} /></div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Answer Evaluation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Receive instant grades (0-10) for clarity, relevance, and keywords along with comprehensive enhancement tips.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--info)', marginBottom: '16px' }}><Map size={32} /></div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Personalized Roadmap</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Tackle weak points with a personalized 4-week calendar loaded with resource links to ensure zero skill overlaps.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ color: 'var(--danger)', marginBottom: '16px' }}><Shield size={32} /></div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Enterprise Guardrails</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Armed with advanced input validation, rate limiting, and prompt injection defense layers to secure AI parameters.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        <span>&copy; 2026 AI-Powered Interview Preparation Platform. All rights reserved.</span>
        <span>Secure LLM &bull; LangSmith Evaluation &bull; ChromaDB Vector Index</span>
      </footer>

    </div>
  );
};
export default LandingPage;
