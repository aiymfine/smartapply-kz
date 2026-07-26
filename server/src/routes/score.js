/**
 * Score routes — AI resume scoring and cover letter generation
 */

const express = require('express');
const router = express.Router();

const { extractResumeData } = require('../services/extractor');
const { generateScore, generateCoverLetter } = require('../services/ai-writer');

// ── POST /api/score — Score a resume and give improvement suggestions ──
router.post('/', async (req, res, next) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({
        error: 'Request body must include "resumeText" field.',
      });
    }

    if (resumeText.length < 50) {
      return res.status(400).json({
        error: 'Resume text too short. Minimum 50 characters.',
      });
    }

    const score = await generateScore(resumeText);

    res.json({
      success: true,
      score: score.score,
      grade: score.grade,
      categories: score.categories,
      suggestions: score.suggestions,
      summary: score.summary,
      scoredAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
