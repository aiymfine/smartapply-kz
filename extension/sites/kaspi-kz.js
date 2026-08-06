/**
 * Site-specific field mappings for job.kaspi.kz (Kaspi job application form)
 * Verified against live site — Nuxt.js/Vue SPA
 * Form fields use ID attributes (no name attributes on most fields)
 *
 * Full field list discovered from Nuxt.js inline state (i18n keys):
 * first_name, last_name, middle_name, email, phone, city_residence,
 * birthday, type_of_education, is_student, university, major,
 * graduation_year, link_to_resume, file upload, tell_about_yourself
 */

const KASPI_KZ_MAPPINGS = {
  firstName:      ['input#first_name', 'input[name="first_name"]', 'input[placeholder*="имя" i]:not([placeholder*="фамили" i]):not([placeholder*="отчеств" i])'],
  lastName:       ['input#last_name', 'input[name="last_name"]', 'input[placeholder*="фамили" i]'],
  middleName:     ['input#middle_name', 'input[name="middle_name"]', 'input[placeholder*="отчеств" i]'],
  email:          ['input#email', 'input[type="email"]', 'input[name="email"]'],
  phone:          ['input#phone', 'input[type="tel"]', 'input[name="phone"]'],
  city:           ['input#city_residence', 'select#city_residence', 'input[name="city_residence"]', 'input[name="city"]'],
  education:      ['select#type_of_education', 'select[name="type_of_education"]'],
  birthday:       ['input#birthday', 'input[name="birthday"]', 'input[type="date"]'],
  university:     ['input#university', 'input[name="university"]', 'input[placeholder*="ВУЗ" i]'],
  major:          ['input#major', 'input[name="major"]', 'input[placeholder*="специальн" i]'],
  graduationYear: ['input#graduation_year', 'input[name="graduation_year"]', 'input[placeholder*="год окончания" i]'],
  isStudent:      ['input[name="is_student"]', 'input[id*="is_student" i]'],
  resumeLink:     ['input#link_to_resume', 'input[name="link_to_resume"]', 'input[placeholder*="ссылка на резюме" i]'],
  resumeUpload:   ['input#file', 'input[type="file"]'],
};

module.exports = { KASPI_KZ_MAPPINGS };
