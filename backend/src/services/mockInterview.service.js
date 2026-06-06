import { ChatGroq } from '@langchain/groq';
import { retrieveContext } from './ragPipeline.service.js';
import { evaluateLLMResponse } from './evaluation.service.js';
import dotenv from 'dotenv';
import { safeParseJSON } from '../utils/jsonParser.js';

dotenv.config();

export const generateQuestions = async (session, count = 5) => {
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  if (isDemo) {
    console.log('MockInterviewService: Running in DEMO_MODE or without valid Groq API key. Generating high-fidelity mock questions.');
    
    // Generate tailored mock questions based on skill gaps
    const missing = session.skillGaps?.missingSkills || [];
    const matched = session.skillGaps?.matchedSkills || [];
    const questions = [];

    // Technical Question 1 based on missing skill
    if (missing.length > 0) {
      questions.push({
        question: `How would you go about learning and implementing ${missing[0]} in a production setting? What are the key concepts and architecture components you need to understand first?`,
        type: 'technical',
        idealKeywords: [missing[0], 'Architecture', 'Best Practices', 'Scaling', 'Integration']
      });
    } else {
      questions.push({
        question: `Can you explain the main architectural features of React and how the virtual DOM works to optimize rendering performance?`,
        type: 'technical',
        idealKeywords: ['React', 'Virtual DOM', 'Reconciliation', 'Diffing Algorithm', 'Fiber']
      });
    }

    // Technical Question 2 based on matched skill
    if (matched.length > 0) {
      questions.push({
        question: `In your resume, you mentioned working with ${matched[0]}. Can you describe a challenging technical problem you solved using ${matched[0]} and how you approached debugging it?`,
        type: 'technical',
        idealKeywords: [matched[0], 'Debugging', 'Problem Solving', 'Optimization', 'Troubleshooting']
      });
    } else {
      questions.push({
        question: `How do you handle asynchronous operations in Node.js, and what are the key differences between Promises, async/await, and callbacks?`,
        type: 'technical',
        idealKeywords: ['Node.js', 'Event Loop', 'Promises', 'async/await', 'Non-blocking I/O']
      });
    }

    // Behavioral Question
    questions.push({
      question: `Describe a situation where you had a disagreement with a team member regarding a technical decision. How did you resolve the conflict and what was the outcome?`,
      type: 'behavioral',
      idealKeywords: ['Collaboration', 'Conflict Resolution', 'Communication', 'Empathy', 'Compromise']
    });

    // Situational Question
    questions.push({
      question: `Imagine a production deployment fails, causing a key user service to go down. You are the only engineer online. Describe step-by-step how you would triage and recover the system.`,
      type: 'situational',
      idealKeywords: ['Triage', 'Rollback', 'Logs', 'Root Cause', 'Post-mortem', 'Communication']
    });

    // Role-specific Question
    questions.push({
      question: `For a ${session.title} role, what coding standards and code review practices do you follow to ensure top-tier code quality across a distributed development team?`,
      type: 'role-specific',
      idealKeywords: ['Code Review', 'CI/CD', 'Linters', 'Dry Run', 'Static Analysis', 'Unit Testing']
    });

    return questions.slice(0, count);
  }

  const startTime = Date.now();
  const context = await retrieveContext(session._id, 'skills and job description requirements', 3);

  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.7
    });

    const prompt = `You are an elite Tech Lead and Hiring Manager conducting an interview for the role: ${session.title}.
Generate exactly ${count} highly targeted interview questions based on the candidate's profile, job requirements, and skill gaps provided in the context below.

Generate a mix of:
- technical (focusing heavily on missing skills or deep concepts)
- behavioral (STAR method prompts)
- situational (real-world scenarios)
- role-specific (standards and architecture)

Return the output exactly matching this JSON format:
[
  {
    "question": "Question text here",
    "type": "technical",
    "idealKeywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Allowed types: "technical", "behavioral", "situational", "role-specific"
Output ONLY valid JSON. Do not include markdown codeblocks, explanation, or notes.

Context (Resume & Job Requirements):
${context}

Skill Gaps Identified:
Matched: ${JSON.stringify(session.skillGaps?.matchedSkills)}
Missing: ${JSON.stringify(session.skillGaps?.missingSkills)}`;

    const response = await model.invoke(prompt);
    const questions = safeParseJSON(response.content);
    return questions;
  } catch (error) {
    console.error('Error generating questions with LLM, falling back to mock generator:', error);
    // Return safe default set
    return [
      { question: 'Tell me about yourself and your background.', type: 'behavioral', idealKeywords: ['Experience', 'Projects'] },
      { question: 'What is your experience with REST APIs and system design?', type: 'technical', idealKeywords: ['REST', 'Endpoints', 'HTTP'] }
    ];
  }
};

export const evaluateAnswer = async (interviewId, userId, questionObj, userAnswer) => {
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  const startTime = Date.now();

  if (isDemo) {
    // Return high-fidelity mockup evaluations
    const latencyMs = Date.now() - startTime;
    const relevance = Math.floor(Math.random() * 4) + 6; // 6-10
    const completeness = Math.floor(Math.random() * 4) + 6; // 6-10
    const clarity = Math.floor(Math.random() * 3) + 7; // 7-10
    const score = Math.round((relevance + completeness + clarity) / 3);

    const feedback = `The answer covers the key points well. You mentioned ${questionObj.idealKeywords.slice(0, 2).join(', ')} which are crucial. To improve, structure your points chronologically and provide more specific examples of past implementations.`;
    
    const suggestions = [
      `Incorporate more details about the technical trade-offs you made.`,
      `Mention how you would measure success or benchmark performance.`
    ];

    const evaluation = { score, relevance, completeness, clarity, feedback, suggestions };

    // Log metrics to evaluation DB
    await evaluateLLMResponse({
      interviewId,
      userId,
      actionType: 'answer_scoring',
      prompt: questionObj.question,
      response: JSON.stringify(evaluation),
      context: questionObj.idealKeywords.join(', '),
      latencyMs
    });

    return evaluation;
  }

  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.1
    });

    const prompt = `You are an expert Interview Evaluation Agent. Assess the candidate's response to the interview question below.
Score the answer out of 10 based on standard hiring rubric:
1. Relevance: Did the user answer the actual question? (0-10)
2. Completeness: Did they address all parts of the question and hit the ideal keywords? (0-10)
3. Clarity: Was the explanation structured and coherent? (0-10)

The total overall score should be the average of these three components.

Return the output exactly matching this JSON schema:
{
  "score": 8,
  "relevance": 9,
  "completeness": 7,
  "clarity": 8,
  "feedback": "A summary of their strengths and weaknesses in the response.",
  "suggestions": ["specific tip 1", "specific tip 2"]
}

Output ONLY valid JSON. Do not include markdown codeblocks, explanation, or conversational fillers.

Question:
${questionObj.question}

Ideal Keywords/Concepts:
${JSON.stringify(questionObj.idealKeywords)}

Candidate Answer:
${userAnswer}`;

    const response = await model.invoke(prompt);
    const latencyMs = Date.now() - startTime;

    const evaluation = safeParseJSON(response.content);

    // Track LLM performance and evaluation metrics
    await evaluateLLMResponse({
      interviewId,
      userId,
      actionType: 'answer_scoring',
      prompt: questionObj.question,
      response: content,
      context: questionObj.idealKeywords.join(', '),
      latencyMs
    });

    return evaluation;
  } catch (error) {
    console.error('Error evaluating answer with LLM, returning defaults:', error);
    return {
      score: 5,
      relevance: 5,
      completeness: 5,
      clarity: 5,
      feedback: 'Failed to evaluate answer automatically. General fallback applied.',
      suggestions: ['Review technical details.', 'Practice structured response models (like STAR).']
    };
  }
};
