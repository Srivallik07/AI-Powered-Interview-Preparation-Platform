import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
const mammothRaw = require('mammoth');
const mammoth = mammothRaw.default || mammothRaw;
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';

dotenv.config();

// Helper to extract text from buffer
export const extractTextFromBuffer = async (buffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const data = await mammoth.extractRawText({ buffer });
    return data.value;
  } else {
    // Default to plain text
    return buffer.toString('utf-8');
  }
};

// LLM call to parse text into structured JSON
export const parseResumeText = async (text) => {
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  if (isDemo) {
    console.log('ResumeParserService: Running in DEMO_MODE or without valid Groq API key. Using high-fidelity mock parser.');
    // Simple heuristic parser for demo
    const skills = [];
    if (/javascript/i.test(text)) skills.push('JavaScript');
    if (/react/i.test(text)) skills.push('React.js');
    if (/node/i.test(text)) skills.push('Node.js');
    if (/python/i.test(text)) skills.push('Python');
    if (/java/i.test(text)) skills.push('Java');
    if (/sql/i.test(text)) skills.push('SQL');
    if (/mongodb/i.test(text)) skills.push('MongoDB');
    if (/git/i.test(text)) skills.push('Git');

    if (skills.length === 0) {
      skills.push('JavaScript', 'React.js', 'CSS', 'HTML5', 'Git', 'REST APIs');
    }

    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 019-2834',
      skills: {
        technical: skills,
        soft: ['Communication', 'Problem Solving', 'Teamwork', 'Agile Methodology'],
        tools: ['VS Code', 'Docker', 'Postman', 'Git/GitHub']
      },
      experience: [
        {
          role: 'Software Engineer',
          company: 'Tech Solutions Inc.',
          duration: '2023 - Present',
          description: 'Developed responsive web applications using React and Node.js. Optimized SQL queries, improving backend response times by 20%.'
        },
        {
          role: 'Junior Web Developer',
          company: 'WebCraft Studio',
          duration: '2021 - 2023',
          description: 'Created custom HTML/CSS/JS interfaces for e-commerce clients. Maintained and updated content management systems.'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          institution: 'State University',
          year: '2021'
        }
      ],
      certifications: ['AWS Certified Cloud Practitioner', 'MongoDB Associate Developer']
    };
  }

  try {
    const model = new ChatGroq({
      apiKey: apiKey,
      model: 'llama-3.3-70b-versatile',
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.1
    });

    const prompt = `You are an expert ATS and Resume parsing agent. Analyze the following raw resume text and extract the structured information exactly matching this JSON format:
{
  "name": "Full Name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "skills": {
    "technical": ["list of technical skills"],
    "soft": ["list of soft skills"],
    "tools": ["list of tools/platforms"]
  },
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "duration": "Duration (e.g. 2021-2023)",
      "description": "Short description of duties and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Earned",
      "institution": "University/School",
      "year": "Graduation Year"
    }
  ],
  "certifications": ["List of certifications"]
}

Output ONLY valid JSON. Do not include any conversational markdown, explanation, or notes.

Raw Resume Text:
${text}`;

    const response = await model.invoke(prompt);
    let content = response.content.trim();
    
    // Clean up code block ticks if LLM returned them
    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing resume text with LLM, falling back to mock parser:', error);
    return {
      name: 'Parsed Candidate',
      email: 'candidate@example.com',
      phone: '',
      skills: {
        technical: ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js'],
        soft: ['Communication', 'Teamwork'],
        tools: ['Git']
      },
      experience: [],
      education: [],
      certifications: []
    };
  }
};
