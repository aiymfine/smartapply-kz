/**
 * Sites routes — list supported job sites
 */

const express = require('express');
const router = express.Router();

const SUPPORTED_SITES = [
  {
    id: 'hh-kz',
    name: 'HeadHunter Kazakhstan',
    url: 'https://hh.kz',
    domain: 'hh.kz',
    alternativeDomains: ['kz.hh.ru'],
    status: 'supported',
    fields: ['fullName', 'email', 'phone', 'city', 'summary', 'experience'],
  },
  {
    id: 'kaspi-kz',
    name: 'Kaspi Jobs',
    url: 'https://kaspi.kz',
    domain: 'kaspi.kz',
    status: 'supported',
    fields: ['fullName', 'email', 'phone', 'city', 'summary', 'position', 'salary'],
  },
  {
    id: 'enbek-kz',
    name: 'Enbek.kz',
    url: 'https://enbek.kz',
    domain: 'enbek.kz',
    alternativeDomains: ['jobs.enbek.kz'],
    status: 'supported',
    fields: ['fullName', 'email', 'phone', 'city', 'summary', 'position'],
  },
  {
    id: 'olx-kz',
    name: 'OLX Jobs Kazakhstan',
    url: 'https://olx.kz',
    domain: 'olx.kz',
    status: 'planned',
    fields: [],
  },
];

router.get('/', (req, res) => {
  res.json({
    total: SUPPORTED_SITES.length,
    supported: SUPPORTED_SITES.filter(s => s.status === 'supported').length,
    sites: SUPPORTED_SITES,
    updatedAt: new Date().toISOString(),
  });
});

router.get('/:id', (req, res) => {
  const site = SUPPORTED_SITES.find(s => s.id === req.params.id);
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  res.json(site);
});

module.exports = router;
