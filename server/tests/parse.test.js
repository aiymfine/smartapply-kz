/**
 * Parse endpoint tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('POST /api/parse/text', () => {
  it('should reject empty body', async () => {
    const res = await request(app)
      .post('/api/parse/text')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/text/i);
  });

  it('should reject text shorter than 50 chars', async () => {
    const res = await request(app)
      .post('/api/parse/text')
      .send({ text: 'Too short resume text' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/short/i);
  });

  it('should parse valid resume text', async () => {
    const sampleResume = `
      John Doe
      Software Engineer
      Email: john.doe@email.com
      Phone: +1 555 123 4567
      Location: Almaty, Kazakhstan

      Professional Summary:
      Experienced software engineer with 5 years building scalable web applications.
      Specialized in Node.js, React, and cloud architecture.

      Skills:
      JavaScript, TypeScript, Node.js, Express, React, PostgreSQL, Docker, AWS

      Experience:
      TechCorp LLC — Software Engineer (2022-Present)
      Built REST APIs serving 1M+ daily requests using Node.js and Express.
      Led migration to microservices architecture on Kubernetes.

      Education:
      NARXOZ University — Bachelor of Computer Science (2018-2022)
    `;

    const res = await request(app)
      .post('/api/parse/text')
      .send({ text: sampleResume });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.personal).toBeDefined();
    expect(res.body.data.skills).toBeInstanceOf(Array);
    expect(res.body.data.skills.length).toBeGreaterThan(0);
  });
});

describe('POST /api/parse/upload', () => {
  it('should reject request without file', async () => {
    const res = await request(app)
      .post('/api/parse/upload');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  it('should reject unsupported file types', async () => {
    const res = await request(app)
      .post('/api/parse/upload')
      .attach('resume', Buffer.from('fake txt content'), 'resume.txt');
    expect(res.status).toBe(400);
  });
});

describe('404 handler', () => {
  it('should return available endpoints on unknown route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.availableEndpoints).toBeInstanceOf(Array);
  });
});
