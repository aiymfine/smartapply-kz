/**
 * Regex-based fallback extractor
 * Used when no LLM API key is available — basic but functional
 */

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i;
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

/**
 * Basic resume extraction using regex patterns
 * @param {string} text - Resume text
 * @returns {object} Partially structured resume data
 */
function extractWithRegex(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // ── Personal Info ──
  const email = text.match(EMAIL_REGEX)?.[0] || '';
  const phone = text.match(PHONE_REGEX)?.[0] || '';
  const linkedin = text.match(LINKEDIN_REGEX)?.[0] || '';
  const github = text.match(GITHUB_REGEX)?.[0] || '';
  const fullName = lines[0] || '';
  const location = findLocation(lines);

  // ── Skills (find lines with tech keywords) ──
  const skills = findSkills(text);

  // ── Experience (basic detection) ──
  const experience = findExperience(lines);

  // ── Education ──
  const education = findEducation(lines);

  // ── Summary (first paragraph after name/contact) ──
  const summary = lines
    .slice(1, 6)
    .filter(l => l.length > 50 && !EMAIL_REGEX.test(l))
    .join(' ')
    .substring(0, 500);

  return {
    personal: {
      fullName,
      email,
      phone,
      location,
      linkedin,
      github,
      website: '',
    },
    summary,
    skills,
    experience,
    education,
    projects: [],
    languages: [],
    certifications: [],
    _extractionMethod: 'regex-fallback',
  };
}

function findLocation(lines) {
  const locationPatterns = [
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
    /(Almaty|Astana|Shymkent|Karaganda|Aktobe|Taraz|Pavlodar|Oskemen|Semey|Atyrau|Kostanay|Kyzylorda)/i,
  ];
  for (const line of lines.slice(0, 5)) {
    for (const pattern of locationPatterns) {
      const match = line.match(pattern);
      if (match) return match[0];
    }
  }
  return '';
}

function findSkills(text) {
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust',
    'Node\\.js', 'Express', 'React', 'Vue', 'Angular', 'Next\\.js',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
    'Docker', 'Kubernetes', 'Nginx', 'Linux', 'Git', 'GitHub Actions',
    'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible',
    'HTML', 'CSS', 'Bootstrap', 'Tailwind', 'SASS',
    'REST API', 'GraphQL', 'JWT', 'OAuth', 'Prisma',
    'Jest', 'Mocha', 'Cypress', 'Playwright',
    'Nmap', 'Wireshark', 'Burp Suite', 'Metasploit',
    'Spring Boot', 'Django', 'Flask', 'FastAPI',
  ];

  const found = [];
  for (const keyword of techKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      found.push(keyword.replace(/\\/g, ''));
    }
  }
  return found;
}

function findExperience(lines) {
  const experiences = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for company patterns
    if (/(LLC|Inc|Corp|Ltd|ООО|ТОО|Company|University|Bank)/i.test(line) && line.length < 100) {
      experiences.push({
        company: line.split('—')[0].split('—')[0].trim(),
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        description: lines.slice(i + 1, i + 4).join(' ').substring(0, 300),
      });
    }
  }
  return experiences.slice(0, 5);
}

function findEducation(lines) {
  const education = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(University|Университет|Институт|College|Bachelor|Master|NARXOZ|KBTU|KIMEP|SDU|KazNU|AITU)/i.test(line)) {
      education.push({
        institution: line.split('—')[0].trim(),
        degree: '',
        field: '',
        startDate: '',
        endDate: lines[i + 1]?.match(/20\d{2}/g)?.join('-') || '',
        gpa: '',
      });
    }
  }
  return education;
}

module.exports = { extractWithRegex };
