/**
 * Site-specific field mappings for hh.kz (HeadHunter Kazakhstan)
 * These selectors handle hh.kz's specific DOM structure
 */

const HH_KZ_MAPPINGS = {
  firstName: ['input[name="firstName"]', 'input[data-qa="firstname"]'],
  lastName: ['input[name="lastName"]', 'input[data-qa="lastname"]'],
  email: ['input[data-qa="email"]', 'input[name="email"]'],
  phone: ['input[data-qa="phone"]', 'input[name="phone"]'],
  city: ['input[data-qa="city"]', 'select[data-qa="city"]'],
  summary: ['textarea[data-qa="about-me"]', 'textarea[name="summary"]'],
  resumeUpload: ['input[type="file"][accept*="pdf"]'],
};

module.exports = { HH_KZ_MAPPINGS };
