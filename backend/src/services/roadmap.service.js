import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import { safeParseJSON } from '../utils/jsonParser.js';

dotenv.config();

export const generateRoadmap = async (session) => {
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  const missing = session.skillGaps?.missingSkills || [];
  const roleTitle = session.title || 'Software Developer';

  if (isDemo) {
    console.log('RoadmapService: Running in DEMO_MODE or without valid Groq API key. Generating mock roadmap.');
    
    const weeks = [];
    const missingLabel = missing.length > 0 ? missing.join(', ') : 'Advanced Web Architecture';

    weeks.push({
      weekNumber: 1,
      focus: `Master Fundamentals of ${missing[0] || 'Modern Tech Stack'}`,
      topics: [
        {
          title: `Intro to ${missing[0] || 'Advanced Architecture'}`,
          details: 'Learn basic syntax, configurations, data models, and core execution loops.',
          resources: ['https://developer.mozilla.org', 'https://react.dev/reference', 'https://nodejs.org/docs']
        },
        {
          title: 'Initial CLI and SDK Setup',
          details: 'Install local development servers, run hello-world services, and write basic tests.',
          resources: ['https://github.com', 'https://docs.docker.com']
        }
      ]
    });

    weeks.push({
      weekNumber: 2,
      focus: 'Integration and Database Storage',
      topics: [
        {
          title: `Integrating ${missing[0] || 'Database'} with Express/Node.js`,
          details: 'Build robust REST APIs, handle validations, implement security parameters, and manage pools.',
          resources: ['https://expressjs.com', 'https://mongoosejs.com']
        },
        {
          title: `Handling ${missing[1] || 'State Management'} and Performance`,
          details: 'Optimize queries, learn indexing strategies, write compound requests, and secure API keys.',
          resources: ['https://web.dev/performance', 'https://graphql.org']
        }
      ]
    });

    weeks.push({
      weekNumber: 3,
      focus: 'Systems Architecture & Real Projects',
      topics: [
        {
          title: `Create a Mini Portfolio Project incorporating ${missingLabel}`,
          details: 'Design and deploy a small application showcasing key integrations, state control, and endpoints.',
          resources: ['https://vercel.com/docs', 'https://render.com/docs']
        },
        {
          title: 'Unit Testing and Mocking API Requests',
          details: 'Write test scripts using Jest or Mocha, mocking external services, verifying input structures.',
          resources: ['https://jestjs.io']
        }
      ]
    });

    weeks.push({
      weekNumber: 4,
      focus: 'Interview Drills & Final Polish',
      topics: [
        {
          title: 'Review System Design Principles',
          details: 'Brush up on load balancers, caching, microservices vs monolith, and data scaling rules.',
          resources: ['https://systemdesign.primer', 'https://github.com/donnemartin/system-design-primer']
        },
        {
          title: 'Practice Behavioral STAR Framework Questions',
          details: 'Formulate 4 stories covering leadership, conflict, debugging under pressure, and prioritization.',
          resources: ['https://leetcode.com', 'https://glassdoor.com']
        }
      ]
    });

    return { weeks };
  }

  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.2
    });

    const prompt = `You are an expert Technical Mentor and Study Guide Creator.
Create a personalized 4-week study roadmap for a candidate preparing for the role: ${roleTitle}.
Focus heavily on bridging the skill gaps identified in the context. Provide authentic documentation links and learning paths.

Return the output exactly matching this JSON schema:
{
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Focus theme of the week",
      "topics": [
        {
          "title": "Topic title",
          "details": "Details about what to learn and build",
          "resources": ["https://resource-link-1.com", "https://resource-link-2.com"]
        }
      ]
    }
  ]
}

Output ONLY valid JSON. Do not include markdown codeblocks, explanation, or conversational fillers.

Missing Skills:
${JSON.stringify(missing)}

Target Role:
${roleTitle} (${session.skillGaps?.gapAnalysis || ''})`;

    const response = await model.invoke(prompt);
    return safeParseJSON(response.content);
  } catch (error) {
    console.error('Error generating roadmap with LLM, returning mock:', error);
    // Return high-fidelity 4-week fallback to guarantee seamless UI
    const weeks = [];
    const missingLabel = missing.length > 0 ? missing.join(', ') : 'Advanced Web Architecture';

    weeks.push({
      weekNumber: 1,
      focus: `Master Fundamentals of ${missing[0] || 'Modern Tech Stack'}`,
      topics: [
        {
          title: `Intro to ${missing[0] || 'Advanced Architecture'}`,
          details: 'Learn basic syntax, configurations, data models, and core execution loops.',
          resources: ['https://developer.mozilla.org', 'https://react.dev/reference']
        },
        {
          title: 'Initial Development Environment Setup',
          details: 'Install local packages, run hello-world services, and write basic tests.',
          resources: ['https://github.com']
        }
      ]
    });

    weeks.push({
      weekNumber: 2,
      focus: 'Integration and Database Storage',
      topics: [
        {
          title: `Integrating ${missing[0] || 'Database'} with Express/Node.js`,
          details: 'Build robust REST APIs, handle validations, implement security parameters, and manage pools.',
          resources: ['https://expressjs.com', 'https://mongoosejs.com']
        }
      ]
    });

    weeks.push({
      weekNumber: 3,
      focus: 'Systems Architecture & Projects',
      topics: [
        {
          title: `Create a Portfolio Project incorporating ${missingLabel}`,
          details: 'Design and deploy a small application showcasing key integrations, state control, and endpoints.',
          resources: ['https://vercel.com/docs']
        }
      ]
    });

    weeks.push({
      weekNumber: 4,
      focus: 'Interview Drills & Final Polish',
      topics: [
        {
          title: 'Review System Design Principles',
          details: 'Brush up on load balancers, caching, microservices vs monolith, and data scaling rules.',
          resources: ['https://systemdesign.primer']
        },
        {
          title: 'Practice Behavioral STAR Questions',
          details: 'Formulate 4 stories covering leadership, conflict, debugging under pressure, and prioritization.',
          resources: ['https://leetcode.com']
        }
      ]
    });

    return { weeks };
  }
};
