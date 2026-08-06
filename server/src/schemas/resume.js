/**
 * Resume Schema — Zod validation
 * Ensures extracted data conforms to expected structure
 */

const { z } = require('zod');

const ResumeSchema = z.object({
  personal: z.object({
    fullName: z.string().default(''),
    middleName: z.string().default(''),
    birthday: z.string().default(''),
    email: z.string().default(''),
    phone: z.string().default(''),
    location: z.string().default(''),
    linkedin: z.string().default(''),
    github: z.string().default(''),
    website: z.string().default(''),
  }),
  summary: z.string().default(''),
  skills: z.array(z.string()).default([]),
  experience: z.array(z.object({
    company: z.string().default(''),
    role: z.string().default(''),
    location: z.string().default(''),
    startDate: z.string().default(''),
    endDate: z.string().default(''),
    description: z.string().default(''),
  })).default([]),
  education: z.array(z.object({
    institution: z.string().default(''),
    degree: z.string().default(''),
    field: z.string().default(''),
    startDate: z.string().default(''),
    endDate: z.string().default(''),
    gpa: z.string().default(''),
  })).default([]),
  projects: z.array(z.object({
    name: z.string().default(''),
    description: z.string().default(''),
    tech: z.array(z.string()).default([]),
    url: z.string().default(''),
  })).default([]),
  languages: z.array(z.object({
    name: z.string().default(''),
    proficiency: z.string().default(''),
  })).default([]),
  certifications: z.array(z.object({
    name: z.string().default(''),
    issuer: z.string().default(''),
    date: z.string().default(''),
  })).default([]),
  _extractionMethod: z.string().optional(),
});

/**
 * Validate and sanitize resume data
 * @param {object} raw - Raw extracted data
 * @returns {{ data: object, warnings: string[] }}
 */
function validateResume(raw) {
  const warnings = [];

  // Trim all string values
  const sanitized = deepTrim(raw);

  // Validate
  const result = ResumeSchema.safeParse(sanitized);

  if (!result.success) {
    // Use the data we have, log issues as warnings
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    warnings.push(...errors);
  }

  const data = result.success ? result.data : ResumeSchema.parse(sanitized);

  // ── Quality checks ──
  if (!data.personal.email) {
    warnings.push('No email address found in resume.');
  }
  if (!data.personal.phone) {
    warnings.push('No phone number found in resume.');
  }
  if (data.experience.length === 0) {
    warnings.push('No work experience entries detected.');
  }
  if (data.skills.length === 0) {
    warnings.push('No skills detected. Consider adding a skills section.');
  }
  if (data.experience.length > 0 && data.experience.every(e => !e.startDate && !e.endDate)) {
    warnings.push('Experience entries missing dates.');
  }

  return { data, warnings };
}

/**
 * Deep trim all string values in an object
 */
function deepTrim(obj) {
  if (typeof obj === 'string') return obj.trim();
  if (Array.isArray(obj)) return obj.map(deepTrim);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, deepTrim(v)])
    );
  }
  return obj;
}

module.exports = { validateResume, ResumeSchema };
