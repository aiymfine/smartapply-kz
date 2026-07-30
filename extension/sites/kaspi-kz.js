/**
 * Site-specific field mappings for job.kaspi.kz (Kaspi job application form)
 * Verified against live site — Nuxt.js/Vue SPA
 * Form fields use ID attributes (no name attributes)
 */

const KASPI_KZ_MAPPINGS = {
  firstName:  ['input#first_name', 'input[name="first_name"]', 'input[placeholder*="имя" i]'],
  lastName:   ['input#last_name', 'input[name="last_name"]', 'input[placeholder*="фамили" i]'],
  email:      ['input#email', 'input[type="email"]', 'input[name="email"]'],
  phone:      ['input#phone', 'input[type="tel"]', 'input[name="phone"]'],
  city:       ['input#city_residence', 'input[name="city_residence"]', 'input[name="city"]'],
  education:  ['select#type_of_education', 'select[name="type_of_education"]'],
  birthday:   ['input#birthday', 'input[name="birthday"]', 'input[type="date"]'],
  resumeUpload: ['input#file', 'input[type="file"]'],
};

module.exports = { KASPI_KZ_MAPPINGS };
