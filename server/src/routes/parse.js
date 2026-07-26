/**
 * Parse routes — resume upload and text parsing
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { parseDocument } = require('../services/parser');
const { extractResumeData } = require('../services/extractor');
const { validateResume } = require('../schemas/resume');

// ── Multer Config ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: PDF, DOCX`), false);
    }
  },
});

// ── POST /api/parse/upload ──
router.post('/upload', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "resume".' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const buffer = req.file.buffer;

    // Step 1: Extract raw text
    const rawText = await parseDocument(buffer, ext);

    // Step 2: Extract structured data via LLM
    const extracted = await extractResumeData(rawText);

    // Step 3: Validate & sanitize
    const validation = validateResume(extracted);

    res.json({
      success: true,
      meta: {
        filename: req.file.originalname,
        size: req.file.size,
        type: ext.replace('.', ''),
        textLength: rawText.length,
        extractedAt: new Date().toISOString(),
      },
      rawText: rawText.substring(0, 5000),
      data: validation.data,
      warnings: validation.warnings,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/parse/text ──
router.post('/text', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Request body must include "text" field.' });
    }

    if (text.length < 50) {
      return res.status(400).json({ error: 'Text too short. Minimum 50 characters.' });
    }

    const extracted = await extractResumeData(text);
    const validation = validateResume(extracted);

    res.json({
      success: true,
      meta: {
        textLength: text.length,
        extractedAt: new Date().toISOString(),
      },
      data: validation.data,
      warnings: validation.warnings,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
