/**
 * Health endpoint tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('should return service info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('SmartApply KZ API');
    expect(res.body.version).toBeDefined();
    expect(res.body.uptime).toBeDefined();
  });

  it('should list available endpoints', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.endpoints).toBeInstanceOf(Array);
    expect(res.body.endpoints.length).toBeGreaterThan(0);
  });
});
