/**
 * Site-specific field mappings for Kaspi.kz job applications
 */

const KASPI_KZ_MAPPINGS = {
  fullName: ['input[name="fullName"]', 'input[placeholder*="ФИО"]', 'input[data-field="name"]'],
  email: ['input[name="email"]', 'input[type="email"]'],
  phone: ['input[name="phone"]', 'input[type="tel"]', 'input[placeholder*="телефон"]'],
  city: ['input[name="city"]', 'select[name="city"]'],
  summary: ['textarea[name="about"]', 'textarea[placeholder*="о себе"]'],
  position: ['input[name="position"]', 'input[name="desiredPosition"]'],
  salary: ['input[name="salary"]', 'input[name="desiredSalary"]'],
};

module.exports = { KASPI_KZ_MAPPINGS };
