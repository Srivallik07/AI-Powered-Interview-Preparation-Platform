import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { sanitizePrompt } from '../middleware/promptSanitizer.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { retrieveAdvancedContext } from '../services/ragPipeline.service.js';
import { evaluateLLMResponse } from '../services/evaluation.service.js';
import { ChatGroq } from '@langchain/groq';
import mongoose from 'mongoose';

const router = express.Router();

// Session ID placeholder for general interview prep knowledge base
const KB_SESSION_ID = 'interview_prep_kb';

// @route   POST /api/interview/chat
// @desc    Advanced RAG Chatbot: Retrieve context from 50 docs, evaluate, and reply
// @access  Private
router.post(
  '/chat',
  protect,
  aiLimiter,
  sanitizePrompt,
  auditLogger('Chatbot Query'),
  async (req, res) => {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const startTime = Date.now();
    const apiKey = process.env.GROQ_API_KEY;
    const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

    try {
      console.log(`[RAGChat] Processing query: "${message}"`);

      // 1. Retrieve Context using Advanced RAG (Hybrid Search + Reranking)
      const { context, sources } = await retrieveAdvancedContext(KB_SESSION_ID, message, 3);
      
      console.log(`[RAGChat] Context retrieved. Sources cited: ${sources.join(', ') || 'none'}`);

      let responseText = '';
      
      if (isDemo) {
        // High fidelity demo fallback
        responseText = `Based on our Interview Knowledge Base context (Citing: ${sources.join(', ') || 'General Concept'}):\n\n` + 
          `To answer your question: "${message}", the key concepts involve understanding the architectural constraints. ` +
          `If this involves databases, check indexing paths. If it is system design, balance CAP and consistency parameters. ` +
          `Let me know if you would like me to drill deeper into the specific implementation details!`;
      } else {
        // 2. Query Groq
        const model = new ChatGroq({
          apiKey,
          model: 'llama-3.3-70b-versatile',
          modelName: 'llama-3.3-70b-versatile',
          temperature: 0.5
        });

        const chatPrompt = `You are an elite Interview Preparation Advisor.
Answer the user's interview preparation query using ONLY the retrieved context. Cite specific terms and parameters where necessary.
Keep the answer structured, professional, and actionable.

User Query:
${message}

Retrieved Context (from 50 knowledge base documents):
${context || 'No specific document chunks retrieved. Use general software engineering best practices.'}

Provide a comprehensive, offer-ready answer.`;

        const response = await model.invoke(chatPrompt);
        responseText = response.content.trim();
      }

      const latencyMs = Date.now() - startTime;

      // Create a dummy interview ID to satisfy Mongoose schema for EvaluationLog
      const dummyInterviewId = new mongoose.Types.ObjectId();

      // 3. Log RAG Retrieval Accuracy & Quality Telemetry
      await evaluateLLMResponse({
        interviewId: dummyInterviewId,
        userId: req.user._id,
        actionType: 'question_generation',
        prompt: message,
        response: responseText,
        context: context || 'No context',
        latencyMs
      });

      res.json({
        success: true,
        response: responseText,
        sources,
        latencyMs
      });

    } catch (err) {
      console.error('[RAGChat] Error:', err);
      res.status(500).json({ success: false, message: 'Chatbot encountered an internal error.' });
    }
  }
);

export default router;
