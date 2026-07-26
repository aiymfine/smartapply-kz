/**
 * Cover letter routes — AI-generated cover letters
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { generateCoverLetter } = require('../services/ai-writer');

// Stricter rate limit for generation (more expensive)
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many generation requests. Please try again later.' },
});

// ── POST /api/cover-letter — Generate a tailored cover letter ──
router.post('/', generateLimiter, async (req, res, next) => {
  try {
    const { resumeData, jobDescription, language } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({
        error: 'Request body must include "jobDescription" field.',
      });
    }

    if (!resumeData) {
      return res.status(400).json({
        error: 'Request body must include "resumeData" (parsed resume object or raw text).',
      });
    }

    const result = await generateCoverLetter(resumeData, jobDescription, language || 'en');

    res.json({
      success: true,
      coverLetter: result.text,
      language: result.language,
      wordCount: result.text.split(/\s+/).length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
