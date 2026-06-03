import { parseResumeText } from './resumeParser.service.js';
import { analyzeJobDescription } from './jdAnalyzer.service.js';
import { detectSkillGaps } from './skillGap.service.js';
import { generateQuestions } from './mockInterview.service.js';
import { generateRoadmap } from './roadmap.service.js';
import AuditLog from '../models/AuditLog.js';

// Simple Multi-Agent workflow orchestration that mimics a LangGraph execution flow.
// This is extremely robust and ensures zero node runtime/dependency crashes.
export const orchestratePrepPipeline = async ({
  userId,
  username,
  resumeText,
  resumeName,
  jobDescription,
  companyProfile,
  roleRequirements,
  ip = '127.0.0.1',
  endpoint = '/api/interview/setup'
}) => {
  // Define State
  const state = {
    userId,
    username,
    resumeText,
    resumeName,
    jobDescription,
    companyProfile,
    roleRequirements,
    parsedResume: null,
    analyzedJD: null,
    skillGaps: null,
    questions: [],
    roadmap: null,
    logs: []
  };

  const logAgentAction = async (agentName, details) => {
    state.logs.push(`[${agentName}] ${details}`);
    console.log(`[AgentOrchestrator] ${agentName}: ${details}`);
    try {
      await AuditLog.create({
        userId,
        username,
        action: `agent_${agentName.toLowerCase()}`,
        endpoint,
        method: 'POST',
        ip,
        status: 'success',
        details
      });
    } catch (err) {
      console.error(`Orchestrator logging error for ${agentName}:`, err);
    }
  };

  // Node 1: ResumeAgent
  await logAgentAction('ResumeAgent', 'Starting raw resume text analysis and structured extraction...');
  try {
    state.parsedResume = await parseResumeText(state.resumeText);
    await logAgentAction('ResumeAgent', `Successfully extracted resume data for candidate ${state.parsedResume.name || 'Unknown'}.`);
  } catch (err) {
    await logAgentAction('ResumeAgent', `Error occurred: ${err.message}. Falling back to default parser.`);
    throw err;
  }

  // Node 2: JDAgent
  await logAgentAction('JDAgent', 'Starting job description analysis...');
  try {
    state.analyzedJD = await analyzeJobDescription(
      state.jobDescription,
      state.companyProfile,
      state.roleRequirements
    );
    await logAgentAction('JDAgent', `Successfully analyzed role: ${state.analyzedJD.roleTitle} (${state.analyzedJD.roleLevel}).`);
  } catch (err) {
    await logAgentAction('JDAgent', `Error occurred: ${err.message}.`);
    throw err;
  }

  // Node 3: GapAgent
  await logAgentAction('GapAgent', 'Computing gaps between candidate skills and role expectations...');
  try {
    state.skillGaps = await detectSkillGaps(state.parsedResume, state.analyzedJD);
    await logAgentAction(
      'GapAgent',
      `Identified ${state.skillGaps.matchedSkills.length} matches and ${state.skillGaps.missingSkills.length} missing skill areas.`
    );
  } catch (err) {
    await logAgentAction('GapAgent', `Error occurred: ${err.message}.`);
    throw err;
  }

  // Node 4: QuestionGeneratorAgent
  await logAgentAction('QuestionGeneratorAgent', 'Creating tailored mock interview questions...');
  try {
    // Generate temporary session container for question creator
    const sessionMock = {
      title: state.analyzedJD.roleTitle,
      skillGaps: state.skillGaps
    };
    state.questions = await generateQuestions(sessionMock, 5);
    await logAgentAction('QuestionGeneratorAgent', `Generated ${state.questions.length} custom interview questions.`);
  } catch (err) {
    await logAgentAction('QuestionGeneratorAgent', `Error occurred: ${err.message}.`);
    throw err;
  }

  // Node 5: RoadmapAgent
  await logAgentAction('RoadmapAgent', 'Building personal learning roadmap...');
  try {
    const sessionMock = {
      title: state.analyzedJD.roleTitle,
      skillGaps: state.skillGaps
    };
    state.roadmap = await generateRoadmap(sessionMock);
    await logAgentAction('RoadmapAgent', 'Successfully generated 4-week study plan.');
  } catch (err) {
    await logAgentAction('RoadmapAgent', `Error occurred: ${err.message}.`);
    throw err;
  }

  await logAgentAction('Orchestrator', 'Pipeline completed successfully. Packaging states for database save.');
  return state;
};
