/**
 * Site-specific field mappings for hh.kz (HeadHunter Kazakhstan)
 * hh.kz uses data-qa attributes extensively
 * Apply flow: one-click "Откликнуться" + optional cover letter popup
 * Cover letter textarea: data-qa="vacancy-response-popup-form-letter-input"
 */

const HH_KZ_MAPPINGS = {
  // Cover letter popup (the main fillable field on hh.kz)
  coverLetter: [
    'textarea[data-qa="vacancy-response-popup-form-letter-input"]',
    'textarea[data-qa="vacancy-response-letter"]',
    'textarea[name="letter"]',
  ],
  // Profile fields (rarely visible, but just in case)
  firstName: ['input[data-qa="firstname"]', 'input[name="firstName"]'],
  lastName:  ['input[data-qa="lastname"]', 'input[name="lastName"]'],
  email:     ['input[data-qa="email"]', 'input[name="email"]'],
  phone:     ['input[data-qa="phone"]', 'input[name="phone"]'],
  city:      ['input[data-qa="city"]', 'select[data-qa="city"]'],
  // Vacancy interaction buttons
  applyButton:    ['button[data-qa="vacancy-serp__vacancy_response"]', 'button[data-qa="vacancy-response"]'],
  closeButton:    ['button[data-qa="response-popup-close"]'],
};

module.exports = { HH_KZ_MAPPINGS };
