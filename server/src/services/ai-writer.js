/**
 * AI Writer Service
 * Handles resume scoring and cover letter generation via LLM
 */

const ZAI_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const MODEL = process.env.LLM_MODEL || 'glm-4.5-flash';
const API_KEY = process.env.ZAI_API_KEY || process.env.LLM_API_KEY;

// ── Resume Scoring Prompt ──
const SCORE_SYSTEM_PROMPT = `You are an expert resume reviewer with 15+ years of experience in tech recruitment.
Analyze the resume and provide a detailed score. Return ONLY valid JSON (no markdown, no explanation).

Schema:
{
  "score": <number 0-100>,
  "grade": "<A+ | A | B+ | B | C+ | C | D>",
  "categories": {
    "content": { "score": <0-100>, "notes": "<brief assessment>" },
    "formatting": { "score": <0-100>, "notes": "<brief assessment>" },
    "skills": { "score": <0-100>, "notes": "<brief assessment>" },
    "experience": { "score": <0-100>, "notes": "<brief assessment>" },
    "education": { "score": <0-100>, "notes": "<brief assessment>" },
    "keywords": { "score": <0-100>, "notes": "<brief assessment>" }
  },
  "suggestions": [
    {
      "priority": "high | medium | low",
      "category": "<category name>",
      "issue": "<what's wrong>",
      "fix": "<specific actionable fix>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>"
}

Scoring guide:
- 90-100: A+ (exceptional, top 5%)
- 80-89: A (strong, competitive)
- 70-79: B+ (good, needs minor improvements)
- 60-69: B (decent, several areas to improve)
- 50-59: C+ (below average, needs work)
- Below 50: C/D (significant improvements needed)

Be honest but constructive. Focus on actionable improvements.`;

// ── Cover Letter Prompt ──
const COVER_LETTER_SYSTEM_PROMPT = `You are a professional cover letter writer.
Generate a tailored cover letter based on the candidate's resume data and the job description.
Return ONLY the cover letter text (no JSON, no markdown headers, no explanation).

Guidelines:
- 3-4 paragraphs, 250-400 words total
- Opening: Hook the reader, mention the specific role
- Body: Match 2-3 key qualifications from the job description to specific experience
- Close: Express enthusiasm, call to action
- Professional but not robotic — show personality
- Use specific details from the resume, not generic statements
- Never invent experience or skills not in the resume
- Adapt tone based on language:
  - "en": Professional English
  - "ru": Professional Russian (деловой стиль)
  - "kz": Professional Kazakh (қазақ тілі)`;

// ── Job Match Prompt ──
const MATCH_SYSTEM_PROMPT = `You are an expert tech recruiter analyzing how well a candidate's resume matches a job description.
Return ONLY valid JSON (no markdown, no explanation).

Schema:
{
  "overallMatch": <number 0-100>,
  "verdict": "<strong-match | good-match | partial-match | weak-match | no-match>",
  "matchedSkills": ["skills that appear in both resume and JD"],
  "missingSkills": ["skills required in JD but not in resume"],
  "additionalAssets": ["skills in resume not required but valuable"],
  "experienceMatch": { "score": <0-100>, "notes": "<assessment>" },
  "educationMatch": { "score": <0-100>, "notes": "<assessment>" },
  "recommendations": [
    { "type": "<highlight | gap | suggestion>", "text": "<specific actionable advice>" }
  ],
  "summary": "<2-3 sentence overall assessment>"
}

Verdict guide:
- strong-match (85-100): Excellent fit
- good-match (70-84): Solid fit, minor gaps
- partial-match (50-69): Some relevant experience
- weak-match (30-49): Significant gaps
- no-match (0-29): Wrong role
Be honest and specific.`;

/**
 * Call LLM API
 */
async function callLLM(systemPrompt, userMessage, temperature = 0.3) {
  if (!API_KEY) {
    throw new Error('LLM API key not configured. Set ZAI_API_KEY in .env');
  }

  const response = await fetch(ZAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LLM API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Score a resume
 */
async function generateScore(resumeText) {
  const content = await callLLM(
    SCORE_SYSTEM_PROMPT,
    `Score this resume:\n\n${resumeText.substring(0, 8000)}`,
    0.2
  );

  // Extract JSON
  let jsonStr = content;
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1];
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonStr.trim());
}

/**
 * Generate a cover letter
 */
async function generateCoverLetter(resumeData, jobDescription, language) {
  const resumeStr = typeof resumeData === 'string'
    ? resumeData
    : JSON.stringify(resumeData, null, 2);

  const userMessage = `CANDIDATE RESUME:
${resumeStr.substring(0, 6000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

LANGUAGE: ${language}

Write the cover letter now.`;

  const content = await callLLM(
    COVER_LETTER_SYSTEM_PROMPT,
    userMessage,
    0.5
  );

  return {
    text: content.trim(),
    language,
  };
}

module.exports = { generateScore, generateCoverLetter, analyzeMatch };

/**
 * Analyze how well resume matches a job description
 */
async function analyzeMatch(resumeData, jobDescription) {
  const resumeStr = typeof resumeData === 'string'
    ? resumeData
    : JSON.stringify(resumeData, null, 2);

  const userMessage = `CANDIDATE RESUME:
${resumeStr.substring(0, 6000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 4000)}

Analyze the match.`;

  const content = await callLLM(
    MATCH_SYSTEM_PROMPT,
    userMessage,
    0.2
  );

  // Extract JSON
  let jsonStr = content;
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1];
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonStr.trim());
}
