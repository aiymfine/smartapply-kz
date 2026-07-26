/**
 * Site-specific field mappings for Enbek.kz (government job portal)
 */

const ENBEK_KZ_MAPPINGS = {
  fullName: ['input[name="fio"]', 'input[name="fullName"]', 'input[placeholder*="Аты"]'],
  email: ['input[name="email"]', 'input[type="email"]'],
  phone: ['input[name="phone"]', 'input[type="tel"]'],
  city: ['select[name="cityId"]', 'input[name="city"]'],
  summary: ['textarea[name="about"]', 'textarea[name="description"]'],
  position: ['input[name="professionName"]', 'input[name="position"]'],
};

module.exports = { ENBEK_KZ_MAPPINGS };
