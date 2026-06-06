import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import { safeParseJSON } from '../utils/jsonParser.js';

dotenv.config();

export const detectSkillGaps = async (resumeData, jdData) => {
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  const resumeSkills = [
    ...(resumeData?.skills?.technical || []),
    ...(resumeData?.skills?.tools || [])
  ];
  
  const requiredSkills = jdData?.technicalSkills || [];

  if (isDemo) {
    console.log('SkillGapService: Running in DEMO_MODE or without valid Groq API key. Using mock gap detector.');
    
    const matchedSkills = [];
    const missingSkills = [];
    const skillScores = [];

    // Simple normalization and check
    const normalizedResume = resumeSkills.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    requiredSkills.forEach(reqSkill => {
      const normReq = reqSkill.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Synonym mappings
      const hasMatch = normalizedResume.some(resSkill => {
        return resSkill.includes(normReq) || normReq.includes(resSkill) ||
               (normReq === 'react' && resSkill.includes('react')) ||
               (normReq === 'node' && resSkill.includes('node')) ||
               (normReq === 'mongodb' && resSkill.includes('mongo'));
      });

      if (hasMatch) {
        matchedSkills.push(reqSkill);
        skillScores.push({ skill: reqSkill, score: Math.floor(Math.random() * 20) + 80 }); // 80 - 99
      } else {
        missingSkills.push(reqSkill);
        skillScores.push({ skill: reqSkill, score: Math.floor(Math.random() * 40) + 20 }); // 20 - 59
      }
    });

    // Handle case where we have no skills
    if (skillScores.length === 0) {
      skillScores.push(
        { skill: 'React.js', score: 90 },
        { skill: 'Node.js', score: 85 },
        { skill: 'MongoDB', score: 40 },
        { skill: 'System Design', score: 30 }
      );
      missingSkills.push('MongoDB', 'System Design');
      matchedSkills.push('React.js', 'Node.js');
    }

    const gapAnalysis = `Based on the matching results:
1. You have solid experience in ${matchedSkills.join(', ')}.
2. Key gaps exist in ${missingSkills.join(', ')}. To be competitive for this ${jdData?.roleTitle || 'role'}, we recommend prioritizing these technologies.`;

    return {
      matchedSkills,
      missingSkills,
      skillScores,
      gapAnalysis
    };
  }

  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.1
    });

    const prompt = `You are an expert Talent Acquisition Skill Matcher and Skill Gap Analyst.
Compare the user's Resume Skills against the Job Description Required Skills. Identify synonyms and semantic overlap (e.g. "MongoDB" and "NoSQL databases" have high overlap).

Return the output exactly matching this JSON schema:
{
  "matchedSkills": ["list of skills that candidate has that match required skills"],
  "missingSkills": ["list of required skills missing from candidate resume"],
  "skillScores": [
    { "skill": "skill_name_1", "score": 95 },
    { "skill": "skill_name_2", "score": 40 }
  ],
  "gapAnalysis": "A detailed 2-3 paragraph textual analysis explaining which skills match well, what critical gaps exist, and how they impact the candidate's fit for this specific job."
}

Scoring criteria (score between 0 and 100):
- 90-100: Candidate fully possesses this skill with professional experience.
- 60-89: Candidate has partial experience, mentions it in projects or uses related tech.
- 0-59: Candidate does not mention this skill or related concepts in their resume.

Output ONLY valid JSON. Do not include markdown codeblocks, explanation, or conversational fillers.

Candidate Resume Skills:
${JSON.stringify(resumeSkills)}

Required Job Skills:
${JSON.stringify(requiredSkills)}

Job Details:
Role: ${jdData?.roleTitle}
Level: ${jdData?.roleLevel}`;

    const response = await model.invoke(prompt);
    return safeParseJSON(response.content);
  } catch (error) {
    console.error('Error analyzing skill gaps with LLM, falling back to mock gap detector:', error);
    return {
      matchedSkills: requiredSkills.slice(0, Math.ceil(requiredSkills.length / 2)),
      missingSkills: requiredSkills.slice(Math.ceil(requiredSkills.length / 2)),
      skillScores: requiredSkills.map((s, idx) => ({ skill: s, score: idx % 2 === 0 ? 85 : 35 })),
      gapAnalysis: 'An error occurred during skill gap analysis. Using basic mapping details.'
    };
  }
};
