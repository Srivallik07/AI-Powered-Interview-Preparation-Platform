import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { sanitizePrompt } from '../middleware/promptSanitizer.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { validateSessionCreate, validateInterviewAnswer } from '../middleware/inputValidation.js';
import { auditLogger } from '../middleware/auditLogger.js';
import Session from '../models/Session.js';
import Interview from '../models/Interview.js';
import { orchestratePrepPipeline } from '../services/agentOrchestrator.service.js';
import { indexSessionDocs } from '../services/ragPipeline.service.js';
import { evaluateAnswer } from '../services/mockInterview.service.js';

const router = express.Router();

// @route   POST /api/interview/setup
// @desc    Setup complete interview preparation session using multi-agent orchestrator
// @access  Private
router.post(
  '/setup',
  protect,
  aiLimiter,
  validateSessionCreate,
  sanitizePrompt,
  auditLogger('Setup Interview Prep Session'),
  async (req, res) => {
    const {
      title,
      resumeName,
      resumeParsedText,
      resumeData,
      jobDescription,
      companyProfile,
      roleRequirements
    } = req.body;

    try {
      console.log('Initiating multi-agent orchestrator pipeline...');
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

      // Execute LangGraph-inspired agent orchestrator
      const pipelineResult = await orchestratePrepPipeline({
        userId: req.user._id,
        username: req.user.username,
        resumeText: resumeParsedText,
        resumeName,
        jobDescription,
        companyProfile: companyProfile || '',
        roleRequirements: roleRequirements || '',
        ip,
        endpoint: '/api/interview/setup'
      });

      // Save Session details in MongoDB
      const session = await Session.create({
        userId: req.user._id,
        title,
        resumeName,
        resumeParsedText,
        resumeData: resumeData || pipelineResult.parsedResume,
        jobDescription,
        companyProfile: companyProfile || '',
        roleRequirements: roleRequirements || '',
        skillGaps: pipelineResult.skillGaps
      });

      // Save Interview details in MongoDB
      const interview = await Interview.create({
        sessionId: session._id,
        userId: req.user._id,
        status: 'active',
        questions: pipelineResult.questions.map(q => ({
          question: q.question,
          type: q.type,
          idealKeywords: q.idealKeywords,
          answer: '',
          evaluation: { score: 0, relevance: 0, completeness: 0, clarity: 0, feedback: '', suggestions: [] }
        })),
        roadmap: pipelineResult.roadmap
      });

      // Index chunks into the RAG system
      await indexSessionDocs(session._id, resumeParsedText, jobDescription, companyProfile);

      res.status(201).json({
        success: true,
        message: 'Prep environment created successfully.',
        session,
        interview
      });
    } catch (error) {
      console.error('Setup Pipeline Error:', error);
      res.status(500).json({ success: false, message: `Pipeline setup failed: ${error.message}` });
    }
  }
);

// @route   GET /api/interview/sessions
// @desc    Get user's all prep sessions
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve sessions' });
  }
});

// @route   GET /api/interview/sessions/:id
// @desc    Get details of a specific session (includes associated interviews)
// @access  Private
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const interviews = await Interview.find({ sessionId: session._id });

    res.json({ success: true, session, interviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve session details' });
  }
});

// @route   GET /api/interview/interviews/:id
// @desc    Get mock interview session
// @access  Private
router.get('/interviews/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id }).populate('sessionId');
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }
    res.json({ success: true, interview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve interview session' });
  }
});

// @route   POST /api/interview/interviews/:id/answer
// @desc    Submit answer for scoring and evaluation
// @access  Private
router.post(
  '/interviews/:id/answer',
  protect,
  aiLimiter,
  validateInterviewAnswer,
  sanitizePrompt,
  auditLogger('Submit Mock Interview Answer'),
  async (req, res) => {
    const { questionIndex, answer } = req.body;
    try {
      const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
      if (!interview) {
        return res.status(404).json({ success: false, message: 'Interview session not found' });
      }

      if (questionIndex < 0 || questionIndex >= interview.questions.length) {
        return res.status(400).json({ success: false, message: 'Invalid question index' });
      }

      const targetQuestion = interview.questions[questionIndex];
      console.log(`Evaluating answer for question index ${questionIndex}...`);

      // Run answer scoring via AI
      const evaluation = await evaluateAnswer(interview._id, req.user._id, targetQuestion, answer);

      // Save user answer and scoring results
      interview.questions[questionIndex].answer = answer;
      interview.questions[questionIndex].evaluation = evaluation;
      await interview.save();

      res.json({
        success: true,
        message: 'Answer evaluated successfully',
        evaluation
      });
    } catch (error) {
      console.error('Answer submission error:', error);
      res.status(500).json({ success: false, message: 'Failed to score answer' });
    }
  }
);

// @route   POST /api/interview/interviews/:id/complete
// @desc    Complete interview, compute metrics and final overview feedback
// @access  Private
router.post(
  '/interviews/:id/complete',
  protect,
  auditLogger('Complete Mock Interview'),
  async (req, res) => {
    try {
      const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
      if (!interview) {
        return res.status(404).json({ success: false, message: 'Interview session not found' });
      }

      // Compute total average score from answered questions
      const answeredQs = interview.questions.filter(q => q.answer && q.answer.trim().length > 0);
      
      let sum = 0;
      answeredQs.forEach(q => {
        sum += q.evaluation.score || 0;
      });

      const finalScore = answeredQs.length > 0 ? parseFloat((sum / answeredQs.length).toFixed(1)) : 0;

      // Simple feedback summary
      let summary = '';
      if (finalScore >= 8) {
        summary = 'Excellent performance! You demonstrate a deep understanding of core technologies, structure your answers effectively, and touch upon key engineering constraints. Focus on refining architectural details to stand out as a premium candidate.';
      } else if (finalScore >= 6) {
        summary = 'Good effort. You possess solid conceptual knowledge but lack implementation detail or concrete examples in your responses. Make sure to use the STAR method (Situation, Task, Action, Result) for behavioral questions and provide clear code-level explanations for technical ones.';
      } else {
        summary = 'Additional preparation is recommended. You missed several ideal keywords and concepts. Follow your personalized weekly study roadmap to bridge these technical gaps and rebuild confidence.';
      }

      interview.status = 'completed';
      interview.overallScore = finalScore;
      interview.overallFeedback = summary;
      await interview.save();

      res.json({
        success: true,
        message: 'Interview session completed successfully.',
        overallScore: finalScore,
        overallFeedback: summary,
        interview
      });
    } catch (error) {
      console.error('Interview completion error:', error);
      res.status(500).json({ success: false, message: 'Failed to complete interview' });
    }
  }
);

// @route   PUT /api/interview/interviews/:id/roadmap/topic
// @desc    Toggle topic status in study roadmap
// @access  Private
router.put(
  '/interviews/:id/roadmap/topic',
  protect,
  async (req, res) => {
    const { weekNumber, topicTitle, status } = req.body; // status: 'pending' | 'completed'
    try {
      const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
      if (!interview) {
        return res.status(404).json({ success: false, message: 'Interview not found' });
      }

      let topicFound = false;
      interview.roadmap.weeks.forEach(week => {
        if (week.weekNumber === weekNumber) {
          week.topics.forEach(topic => {
            if (topic.title === topicTitle) {
              topic.status = status;
              topicFound = true;
            }
          });
        }
      });

      if (!topicFound) {
        return res.status(404).json({ success: false, message: 'Topic not found in roadmap' });
      }

      // Mark modified explicitly since roadmap is a sub-document with nested schema
      interview.markModified('roadmap');
      await interview.save();

      res.json({ success: true, message: 'Roadmap progress updated', roadmap: interview.roadmap });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update roadmap topic' });
    }
  }
);

export default router;
