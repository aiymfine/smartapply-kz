/**
 * SmartApply KZ — Form Field Detector
 * Detects input fields on job application pages
 * Creates site-specific and generic mappings
 */

(function () {
  'use strict';

  // ── Field detection patterns ──
  const FIELD_PATTERNS = {
    // Personal info
    fullName: {
      selectors: [
        'input[name*="name" i]',
        'input[name*="fullname" i]',
        'input[name*="fio" i]',
        'input[placeholder*="имя" i]',
        'input[placeholder*="ФИО" i]',
        'input[placeholder*="name" i]',
        'input[id*="name" i]',
        'input[data-field="name"]',
      ],
      getValue: (data) => data.personal?.fullName || '',
    },
    firstName: {
      selectors: [
        'input[name*="firstname" i]',
        'input[name*="first_name" i]',
        'input[placeholder*="имя" i]:not([placeholder*="фамилия" i])',
      ],
      getValue: (data) => (data.personal?.fullName || '').split(' ')[1] || '',
    },
    lastName: {
      selectors: [
        'input[name*="lastname" i]',
        'input[name*="last_name" i]',
        'input[name*="surname" i]',
        'input[placeholder*="фамилия" i]',
      ],
      getValue: (data) => (data.personal?.fullName || '').split(' ')[0] || '',
    },
    email: {
      selectors: [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[name*="mail" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="почт" i]',
        'input[id*="email" i]',
      ],
      getValue: (data) => data.personal?.email || '',
    },
    phone: {
      selectors: [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[name*="tel" i]',
        'input[placeholder*="телефон" i]',
        'input[placeholder*="phone" i]',
        'input[id*="phone" i]',
      ],
      getValue: (data) => data.personal?.phone || '',
    },
    city: {
      selectors: [
        'input[name*="city" i]',
        'input[name*="location" i]',
        'input[placeholder*="город" i]',
        'input[placeholder*="city" i]',
        'select[name*="city" i]',
      ],
      getValue: (data) => {
        const loc = data.personal?.location || '';
        return loc.split(',')[0].trim();
      },
    },
    linkedin: {
      selectors: [
        'input[name*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
      ],
      getValue: (data) => data.personal?.linkedin || '',
    },
    summary: {
      selectors: [
        'textarea[name*="summary" i]',
        'textarea[name*="about" i]',
        'textarea[name*="description" i]',
        'textarea[placeholder*="о себе" i]',
        'textarea[placeholder*="about" i]',
      ],
      getValue: (data) => data.summary || '',
    },
  };

  /**
   * Detect all fillable fields on the page
   * @returns {object} Map of field type → DOM element(s)
   */
  function detectFields() {
    const detected = {};

    for (const [fieldType, config] of Object.entries(FIELD_PATTERNS)) {
      for (const selector of config.selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          detected[fieldType] = Array.from(elements);
          break;
        }
      }
    }

    return detected;
  }

  /**
   * Get count of detected fields for UI feedback
   */
  function getFieldCount() {
    const fields = detectFields();
    const total = Object.values(fields).reduce((sum, arr) => sum + arr.length, 0);
    return { categories: Object.keys(fields).length, total };
  }

  // Export for content script
  window.__smartApplyDetector = { detectFields, getFieldCount, FIELD_PATTERNS };
})();
