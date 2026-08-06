/**
 * AI Extractor Service
 * Uses LLM (GLM-4.5 Flash via z.ai) to extract structured resume data
 * Falls back to regex-based extraction if no API key is configured
 */

const { extractWithRegex } = require('./regex-fallback');

const ZAI_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const MODEL = process.env.LLM_MODEL || 'glm-4.5-flash';
const API_KEY = process.env.ZAI_API_KEY || process.env.LLM_API_KEY;

// ── System prompt for structured extraction ──
const SYSTEM_PROMPT = `You are a resume parsing assistant. Extract structured data from resume text.
Return ONLY valid JSON (no markdown, no explanation). Use this exact schema:

{
  "personal": {
    "fullName": "string",
    "middleName": "string (patronymic or middle name, empty if none)",
    "birthday": "string (YYYY-MM-DD if available, empty otherwise)",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string (URL or empty)",
    "github": "string (URL or empty)",
    "website": "string (URL or empty)"
  },
  "summary": "string (professional summary, max 3 sentences)",
  "skills": ["array of strings"],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "location": "string",
      "startDate": "string (e.g. 2024-01)",
      "endDate": "string (e.g. 2024-06 or Present)",
      "description": "string (key achievements, max 3 sentences)"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string (or empty)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech": ["array of strings"],
      "url": "string (or empty)"
    }
  ],
  "languages": [
    {
      "name": "string",
      "proficiency": "string (Native, Professional, Intermediate, Basic)"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ]
}

Rules:
- Use empty string "" for missing fields, NOT null
- Use empty arrays [] for missing array fields
- Normalize dates to YYYY-MM format where possible
- Extract phone numbers in international format
- Keep descriptions concise
- For fullName, use the complete name as written in the resume
- Extract middleName/patronymic separately if present (common in KZ/RU names)
- Extract birthday if explicitly mentioned (format: YYYY-MM-DD)`;

/**
 * Extract structured resume data using LLM
 * @param {string} resumeText - Raw text from document
 * @returns {Promise<object>} Parsed resume JSON
 */
async function extractResumeData(resumeText) {
  // If no API key, use regex fallback
  if (!API_KEY) {
    console.warn('[EXTRACTOR] No LLM API key found. Using regex fallback.');
    return extractWithRegex(resumeText);
  }

  try {
    const response = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Parse this resume:\n\n${resumeText.substring(0, 8000)}` },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonStr = extractJson(content);
    const parsed = JSON.parse(jsonStr);

    return parsed;
  } catch (err) {
    console.error('[EXTRACTOR] LLM extraction failed:', err.message);
    console.warn('[EXTRACTOR] Falling back to regex extraction.');
    return extractWithRegex(resumeText);
  }
}

/**
 * Extract JSON from text that might be wrapped in markdown code blocks
 */
function extractJson(text) {
  // Try direct parse first
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    // Continue to other methods
  }

  // Try extracting from code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try finding first { to last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }

  throw new Error('Could not extract valid JSON from LLM response.');
}

module.exports = { extractResumeData };
