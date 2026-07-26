/**
 * Score and cover-letter endpoint tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('POST /api/score', () => {
  it('should reject empty body', async () => {
    const res = await request(app)
      .post('/api/score')
      .send({});
    expect(res.status).toBe(400);
  });

  it('should reject short text', async () => {
    const res = await request(app)
      .post('/api/score')
      .send({ resumeText: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/cover-letter', () => {
  it('should reject empty body', async () => {
    const res = await request(app)
      .post('/api/cover-letter')
      .send({});
    expect(res.status).toBe(400);
  });

  it('should reject missing job description', async () => {
    const res = await request(app)
      .post('/api/cover-letter')
      .send({ resumeData: { personal: { name: 'Test' } } });
    expect(res.status).toBe(400);
  });

  it('should reject missing resume data', async () => {
    const res = await request(app)
      .post('/api/cover-letter')
      .send({ jobDescription: 'We need a developer' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/sites', () => {
  it('should return list of supported sites', async () => {
    const res = await request(app).get('/api/sites');
    expect(res.status).toBe(200);
    expect(res.body.sites).toBeInstanceOf(Array);
    expect(res.body.supported).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('should return individual site by id', async () => {
    const res = await request(app).get('/api/sites/hh-kz');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('hh-kz');
    expect(res.body.name).toBeDefined();
  });

  it('should return 404 for unknown site', async () => {
    const res = await request(app).get('/api/sites/nonexistent');
    expect(res.status).toBe(404);
  });
});
