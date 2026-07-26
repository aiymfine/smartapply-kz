/**
 * Regex fallback extractor tests
 */

const { extractWithRegex } = require('../src/services/regex-fallback');

const SAMPLE_RESUME = `
AIYM KUZDENBAY
Developer & AI Automation Developer
Email: aiymfine@gmail.com
Phone: +7 707 922 3063
Location: Almaty, Kazakhstan
GitHub: github.com/aiymfine

Professional Summary:
Backend developer and security specialist with hands-on industry experience.
Skilled in Node.js, Express, PostgreSQL, Docker, Nmap, and Wireshark.

Skills: Python, JavaScript, Node.js, Express.js, PostgreSQL, Docker, Linux, Git

Experience:
ITWorldz LLC — Developer (2024-Present)
Building AI-powered automation solutions for e-commerce.

Education:
NARXOZ University — Bachelor of Cybersecurity (2023-2027)
`;

describe('extractWithRegex', () => {
  const result = extractWithRegex(SAMPLE_RESUME);

  test('extracts email', () => {
    expect(result.personal.email).toBe('aiymfine@gmail.com');
  });

  test('extracts phone', () => {
    expect(result.personal.phone).toContain('707');
  });

  test('extracts GitHub URL', () => {
    expect(result.personal.github).toContain('github.com');
  });

  test('extracts skills', () => {
    expect(result.skills).toBeInstanceOf(Array);
    expect(result.skills).toContain('Python');
    expect(result.skills).toContain('Docker');
    expect(result.skills).toContain('JavaScript');
  });

  test('detects extraction method', () => {
    expect(result._extractionMethod).toBe('regex-fallback');
  });

  test('returns structured shape', () => {
    expect(result).toHaveProperty('personal');
    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('experience');
    expect(result).toHaveProperty('education');
  });
});
