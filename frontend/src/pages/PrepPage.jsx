import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Upload, FileText, Briefcase, Building, Key, Sparkles, Shield, ArrowRight } from 'lucide-react';

export const PrepPage = () => {
  const { getAuthHeaders, API_URL } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [companyProfile, setCompanyProfile] = useState('');
  const [roleRequirements, setRoleRequirements] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0: Idle, 1: Parsing Resume, 2: Analyzing JD, 3: Gap Check, 4: Questions, 5: Roadmap, 6: Finishing
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title || !resumeFile || !jobDescription) {
      setErrorMsg('Please complete all required fields (Job Title, Resume File, and Job Description).');
      return;
    }

    setUploading(true);
    setUploadStep(1);

    try {
      // Step 1: Upload and Parse Resume
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const parsedHeaders = getAuthHeaders();
      delete parsedHeaders['Content-Type']; // Let browser set boundary automatically

      const resumeRes = await fetch(`${API_URL}/resume/parse`, {
        method: 'POST',
        headers: parsedHeaders,
        body: formData
      });

      const resumeDataJson = await resumeRes.json();
      if (!resumeDataJson.success) {
        throw new Error(resumeDataJson.message || 'Failed to parse resume file.');
      }

      // Step 2: Trigger Orchestrator Pipeline
      setUploadStep(2);
      
      const sessionBody = {
        title,
        resumeName: resumeDataJson.filename,
        resumeParsedText: resumeDataJson.rawText,
        resumeData: resumeDataJson.parsedData,
        jobDescription,
        companyProfile,
        roleRequirements
      };

      // Progress animation steps through nodes
      setTimeout(() => setUploadStep(3), 2000);
      setTimeout(() => setUploadStep(4), 4000);
      setTimeout(() => setUploadStep(5), 6000);

      const sessionRes = await fetch(`${API_URL}/interview/setup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionBody)
      });

      const sessionData = await sessionRes.json();
      if (!sessionData.success) {
        throw new Error(sessionData.message || 'Failed to run agent orchestrator.');
      }

      setUploadStep(6);
      setTimeout(() => {
        navigate(`/skill-gap/${sessionData.session._id}`);
      }, 1000);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during preparation setup.');
      setUploading(false);
      setUploadStep(0);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          AI-Powered Interview Preparation <span className="gradient-text-accent">Platform</span>
        </span>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">Cancel Setup</button>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
        
        {uploading ? (
          /* Multi-Agent Progress Tracking Screen */
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '550px', textAlign: 'center', padding: '50px 40px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '30px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '4px solid var(--bg-tertiary)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1.5s linear infinite' }} />
              <Sparkles size={24} style={{ position: 'absolute', top: '23px', left: '23px', color: 'var(--accent-secondary)' }} />
            </div>

            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Orchestrating Prep Environment
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              Our multi-agent system is processing your parameters.
            </p>

            {/* Agent Timeline list */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: uploadStep >= 1 ? 1 : 0.4 }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>🤖 ResumeAgent: Parsing document</span>
                <span style={{ fontSize: '12px', color: uploadStep === 1 ? 'var(--accent-primary)' : uploadStep > 1 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {uploadStep === 1 ? 'processing...' : uploadStep > 1 ? '✓ complete' : 'waiting'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: uploadStep >= 2 ? 1 : 0.4 }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>🤖 JDAgent: Analyzing job requirements</span>
                <span style={{ fontSize: '12px', color: uploadStep === 2 ? 'var(--accent-primary)' : uploadStep > 2 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {uploadStep === 2 ? 'processing...' : uploadStep > 2 ? '✓ complete' : 'waiting'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: uploadStep >= 3 ? 1 : 0.4 }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>🤖 GapAgent: Detecting knowledge gaps</span>
                <span style={{ fontSize: '12px', color: uploadStep === 3 ? 'var(--accent-primary)' : uploadStep > 3 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {uploadStep === 3 ? 'processing...' : uploadStep > 3 ? '✓ complete' : 'waiting'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: uploadStep >= 4 ? 1 : 0.4 }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>🤖 QuestionGeneratorAgent: Drafting custom Qs</span>
                <span style={{ fontSize: '12px', color: uploadStep === 4 ? 'var(--accent-primary)' : uploadStep > 4 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {uploadStep === 4 ? 'processing...' : uploadStep > 4 ? '✓ complete' : 'waiting'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: uploadStep >= 5 ? 1 : 0.4 }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>🤖 RoadmapAgent: Mapping study guides</span>
                <span style={{ fontSize: '12px', color: uploadStep === 5 ? 'var(--accent-primary)' : uploadStep > 5 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {uploadStep === 5 ? 'processing...' : uploadStep > 5 ? '✓ complete' : 'waiting'}
                </span>
              </div>

            </div>
          </div>
        ) : (
          /* Form Input Screen */
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '750px', padding: '40px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '10px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)' }}>Set Up Your Interview Prep</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Our multi-agent graph parses, maps, and generates simulation sets.</p>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '14px', marginBottom: '20px', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Job Title / Target Role *</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="e.g. Senior React Developer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Upload Resume (PDF/DOCX) *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '30px 20px', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'var(--transition-smooth)', position: 'relative' }}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      required
                    />
                    <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {resumeFile ? resumeFile.name : 'Click to select document'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PDF, DOCX or TXT up to 5MB</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Company Profile (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <textarea
                      className="form-input"
                      style={{ paddingLeft: '40px', minHeight: '100px', resize: 'vertical' }}
                      placeholder="Paste info about company size, culture, stack, etc."
                      value={companyProfile}
                      onChange={(e) => setCompanyProfile(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label className="form-label">Job Description *</label>
                  <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
                    <FileText size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <textarea
                      className="form-input"
                      style={{ paddingLeft: '40px', height: '100%', minHeight: '190px', resize: 'none' }}
                      placeholder="Paste target job requirements and duties..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Role Requirements / Tech Stack (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <textarea
                      className="form-input"
                      style={{ paddingLeft: '40px', minHeight: '100px', resize: 'vertical' }}
                      placeholder="Any specific instructions (e.g. focus on Javascript, AWS)"
                      value={roleRequirements}
                      onChange={(e) => setRoleRequirements(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px' }}>
                  Analyze Profile & Create Mock <ArrowRight size={16} />
                </button>
              </div>

            </form>

            {/* Animation style definition */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin {
                100% { transform: rotate(360deg); }
              }
            `}} />

          </div>
        )}

      </main>
    </div>
  );
};
export default PrepPage;
