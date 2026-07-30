/**
 * SmartApply KZ — Form Field Detector
 * Detects input fields on job application pages
 * Creates site-specific and generic mappings
 */

(function () {
  'use strict';

  // ── Field detection patterns ──
  const FIELD_PATTERNS = {
    // Personal info — first name
    firstName: {
      selectors: [
        'input#first_name',
        'input[name="first_name"]',
        'input[name*="firstname" i]',
        'input[name*="first_name" i]',
        'input[placeholder*="имя" i]:not([placeholder*="фамили" i])',
        'input[id*="firstname" i]',
        'input[id*="first_name" i]',
      ],
      getValue: (data) => {
        const full = data.personal?.fullName || '';
        // For Western names: "John Doe" → first="John"
        // For KZ/RU names: "Айым Кузденбай" → first="Айым"
        const parts = full.trim().split(/\s+/);
        return parts[0] || '';
      },
    },
    // Last name
    lastName: {
      selectors: [
        'input#last_name',
        'input[name="last_name"]',
        'input[name*="lastname" i]',
        'input[name*="last_name" i]',
        'input[name*="surname" i]',
        'input[placeholder*="фамили" i]',
        'input[id*="lastname" i]',
        'input[id*="last_name" i]',
      ],
      getValue: (data) => {
        const full = data.personal?.fullName || '';
        const parts = full.trim().split(/\s+/);
        return parts.slice(1).join(' ') || '';
      },
    },
    // Full name (single field)
    fullName: {
      selectors: [
        'input[name*="fullname" i]',
        'input[name*="full_name" i]',
        'input[name*="fio" i]',
        'input[placeholder*="ФИО" i]',
        'input[placeholder*="name" i]',
        'input[id*="fullname" i]',
        'input[id*="full_name" i]',
        'input[data-field="name"]',
      ],
      getValue: (data) => data.personal?.fullName || '',
    },
    // Email
    email: {
      selectors: [
        'input#email',
        'input[type="email"]',
        'input[name*="email" i]',
        'input[name*="mail" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="почт" i]',
        'input[id*="email" i]',
      ],
      getValue: (data) => data.personal?.email || '',
    },
    // Phone
    phone: {
      selectors: [
        'input#phone',
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[name*="tel" i]',
        'input[placeholder*="телефон" i]',
        'input[placeholder*="phone" i]',
        'input[id*="phone" i]',
      ],
      getValue: (data) => data.personal?.phone || '',
    },
    // City
    city: {
      selectors: [
        'input#city_residence',
        'select#city_residence',
        'select#city',
        'input#city',
        'input[name="city_residence"]',
        'select[name="city"]',
        'input[name*="city" i]',
        'input[name*="location" i]',
        'input[placeholder*="город" i]',
        'input[placeholder*="city" i]',
        'input[id*="city" i]',
        'select[name*="city" i]',
      ],
      getValue: (data) => {
        const loc = data.personal?.location || '';
        return loc.split(',')[0].trim();
      },
    },
    // Birthday
    birthday: {
      selectors: [
        'input#birthday',
        'input[name="birthday"]',
        'input[name*="birth" i]',
        'input[type="date"]',
        'input[id*="birthday" i]',
      ],
      getValue: (data) => data.personal?.birthday || '',
    },
    // Education type (dropdown)
    education: {
      selectors: [
        'select#type_of_education',
        'select[name="type_of_education"]',
        'select[name*="education" i]',
        'select[id*="education" i]',
      ],
      getValue: (data) => {
        const education = data.education?.[0];
        if (!education) return '';
        const degree = (education.degree || '').toUpperCase();
        // Map common degrees to Kaspi dropdown values
        if (degree.includes('BS') || degree.includes('BACHELOR') || degree.includes('БАКАЛАВР'))
          return 'Высшее';
        if (degree.includes('MS') || degree.includes('MASTER') || degree.includes('МАГИСТР'))
          return 'Высшее';
        if (degree.includes('PHD'))
          return 'Высшее';
        return 'Высшее'; // default for CS students
      },
    },
    // Cover letter / About
    coverLetter: {
      selectors: [
        'textarea[data-qa="vacancy-response-popup-form-letter-input"]',
        'textarea[data-qa="vacancy-response-letter"]',
        'textarea[name*="letter" i]',
        'textarea[name*="summary" i]',
        'textarea[name*="about" i]',
        'textarea[placeholder*="о себе" i]',
        'textarea[placeholder*="about" i]',
        'textarea[placeholder*="сопроводительн" i]',
      ],
      getValue: (data) => data.coverLetter || data.summary || '',
    },
    // LinkedIn
    linkedin: {
      selectors: [
        'input[name*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
      ],
      getValue: (data) => data.personal?.linkedin || '',
    },
    // Resume/CV upload
    resumeUpload: {
      selectors: [
        'input#file',
        'input[type="file"]',
        'input[accept*="pdf"]',
        'input[accept*="docx"]',
      ],
      getValue: () => '', // Can't autofill file inputs via JS
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
