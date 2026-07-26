/**
 * Health check route
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const path = require('path');
const fs = require('fs');

const packageJson = require('../../package.json');

router.get('/', (req, res) => {
  const uptimeSecs = process.uptime();
  const memUsage = process.memoryUsage();

  res.json({
    status: 'healthy',
    service: 'SmartApply KZ API',
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.round(uptimeSecs),
      human: `${Math.floor(uptimeSecs / 60)}m ${Math.round(uptimeSecs % 60)}s`,
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      cpuCores: os.cpus().length,
      memoryMB: Math.round(memUsage.rss / 1024 / 1024),
    },
    endpoints: [
      'GET  /api/health',
      'POST /api/parse/upload  — Upload PDF/DOCX resume',
      'POST /api/parse/text    — Parse raw resume text',
      'POST /api/score         — Score resume + improvement suggestions',
      'POST /api/cover-letter  — Generate tailored cover letter',
    ],
  });
});

module.exports = router;
