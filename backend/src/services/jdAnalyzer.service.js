import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import { safeParseJSON } from '../utils/jsonParser.js';

dotenv.config();

export const analyzeJobDescription = async (jobDescription, companyProfile = '', roleRequirements = '') => {
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  if (isDemo) {
    console.log('JDAnalyzerService: Running in DEMO_MODE or without valid Groq API key. Using mock JD analyzer.');
    
    // Heuristic parsing for demo
    const technicalSkills = ['React.js', 'Node.js', 'JavaScript', 'MongoDB', 'REST APIs', 'Git'];
    if (/python/i.test(jobDescription)) technicalSkills.push('Python');
    if (/django/i.test(jobDescription)) technicalSkills.push('Django');
    if (/aws/i.test(jobDescription)) technicalSkills.push('AWS');
    if (/typescript/i.test(jobDescription)) technicalSkills.push('TypeScript');
    if (/docker/i.test(jobDescription)) technicalSkills.push('Docker');
    if (/sql/i.test(jobDescription)) technicalSkills.push('SQL', 'PostgreSQL');

    let title = 'Full-Stack Developer';
    if (/frontend/i.test(jobDescription)) title = 'Frontend Developer';
    if (/backend/i.test(jobDescription)) title = 'Backend Developer';
    if (/senior/i.test(jobDescription)) title = 'Senior Full-Stack Developer';
    if (/data scientist/i.test(jobDescription)) title = 'Data Scientist';

    return {
      roleTitle: title,
      roleLevel: /senior/i.test(jobDescription) ? 'Senior' : /junior/i.test(jobDescription) ? 'Junior' : 'Mid-Level',
      technicalSkills,
      softSkills: ['Communication', 'Team Collaboration', 'Problem Solving', 'Agile Principles'],
      responsibilities: [
        'Design, develop, and maintain clean and efficient web applications.',
        'Collaborate with cross-functional teams to define, design, and ship new features.',
        'Optimize application performance and write unit tests for robustness.'
      ],
      companyCulture: companyProfile ? companyProfile.slice(0, 100) + '...' : 'Fast-paced, innovative tech company focused on growth.'
    };
  }

  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.1
    });

    const prompt = `You are an expert Job Description Analyzer. Extract details from the job description below, combining any additional company profile and role requirements provided.
Return the output exactly matching this JSON schema:
{
  "roleTitle": "Extracted role title (e.g. Senior Software Engineer)",
  "roleLevel": "Junior, Mid-Level, or Senior",
  "technicalSkills": ["list of required technical/hard skills"],
  "softSkills": ["list of required soft/interpersonal skills"],
  "responsibilities": ["3-5 main responsibilities bullet points"],
  "companyCulture": "Description of the company's culture/values based on the text, or a general default if missing"
}

Output ONLY valid JSON. Do not include markdown codeblocks, explanation, or conversational fillers.

Job Description:
${jobDescription}

Company Profile:
${companyProfile}

Role Requirements:
${roleRequirements}`;

    const response = await model.invoke(prompt);
    return safeParseJSON(response.content);
  } catch (error) {
    console.error('Error analyzing job description with LLM, falling back to mock analyzer:', error);
    return {
      roleTitle: 'Full-Stack Developer',
      roleLevel: 'Mid-Level',
      technicalSkills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
      softSkills: ['Problem Solving', 'Communication'],
      responsibilities: ['Write clean code', 'Deploy scalable microservices'],
      companyCulture: 'Dynamic technical startup'
    };
  }
};
