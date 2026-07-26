/**
 * Match routes — AI job-resume matching
 * Compares resume data against a job description and returns match analysis
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { analyzeMatch } = require('../services/ai-writer');

const matchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many match requests. Please try again later.' },
});

// ── POST /api/match — Analyze how well resume matches a job ──
router.post('/', matchLimiter, async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({
        error: 'Request body must include "jobDescription" field.',
      });
    }

    if (!resumeData) {
      return res.status(400).json({
        error: 'Request body must include "resumeData" (parsed resume or raw text).',
      });
    }

    if (jobDescription.length < 30) {
      return res.status(400).json({
        error: 'Job description too short. Minimum 30 characters.',
      });
    }

    const analysis = await analyzeMatch(resumeData, jobDescription);

    res.json({
      success: true,
      ...analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
