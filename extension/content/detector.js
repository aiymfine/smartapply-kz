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
        'input[placeholder*="имя" i]:not([placeholder*="фамили" i]):not([placeholder*="отчеств" i])',
        'input[id*="firstname" i]',
        'input[id*="first_name" i]',
      ],
      getValue: (data) => {
        const full = data.personal?.fullName || '';
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
        // If 3 parts (KZ/RU: First Last Middle), last name is parts[1]
        // If 2 parts (Western: First Last), last name is parts[1]
        if (parts.length >= 3) return parts[1] || '';
        return parts.slice(1).join(' ') || '';
      },
    },
    // Middle name / patronymic (Отчество)
    middleName: {
      selectors: [
        'input#middle_name',
        'input[name="middle_name"]',
        'input[name*="middlename" i]',
        'input[name*="middle_name" i]',
        'input[name*="patronymic" i]',
        'input[placeholder*="отчеств" i]',
        'input[id*="middle_name" i]',
        'input[id*="middlename" i]',
      ],
      getValue: (data) => {
        const full = data.personal?.fullName || '';
        const parts = full.trim().split(/\s+/);
        // KZ/RU: "Айым Кузденбай Кызы" → middle = "Кызы"
        // RU: "Иван Иванович Иванов" pattern varies, but if 3+ parts, last is patronymic
        if (parts.length >= 3) return parts.slice(2).join(' ') || '';
        return data.personal?.middleName || '';
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
    // University / Institution
    university: {
      selectors: [
        'input#university',
        'input[name="university"]',
        'input[name*="university" i]',
        'input[name*="institution" i]',
        'input[placeholder*="ВУЗ" i]',
        'input[placeholder*="университет" i]',
        'input[placeholder*="institution" i]',
        'input[id*="university" i]',
      ],
      getValue: (data) => data.education?.[0]?.institution || '',
    },
    // Major / Speciality
    major: {
      selectors: [
        'input#major',
        'input[name="major"]',
        'input[name*="major" i]',
        'input[name*="specialty" i]',
        'input[name*="speciality" i]',
        'input[placeholder*="специальн" i]',
        'input[placeholder*="major" i]',
        'input[id*="major" i]',
      ],
      getValue: (data) => data.education?.[0]?.field || '',
    },
    // Graduation year
    graduationYear: {
      selectors: [
        'input#graduation_year',
        'input[name="graduation_year"]',
        'input[name*="graduation" i]',
        'input[name*="end_year" i]',
        'input[placeholder*="год окончания" i]',
        'input[placeholder*="graduation" i]',
        'input[id*="graduation_year" i]',
      ],
      getValue: (data) => {
        const edu = data.education?.[0];
        if (!edu) return '';
        // Extract year from endDate or startDate
        const dateStr = edu.endDate || edu.startDate || '';
        const yearMatch = dateStr.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : dateStr;
      },
    },
    // Is student (Yes/No radio or checkbox)
    isStudent: {
      selectors: [
        'input[name="is_student"]',
        'input[name*="is_student" i]',
        'input[id*="is_student" i]',
        'input[type="radio"][value="yes"]',
        'input[type="radio"][value="no"]',
      ],
      getValue: (data) => {
        // Heuristic: if education endDate is in the future or within 1 year, likely a student
        const edu = data.education?.[0];
        if (!edu?.endDate) return '';
        const gradDate = new Date(edu.endDate);
        const now = new Date();
        const diffMs = gradDate - now;
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        return diffMs > -oneYear ? 'yes' : 'no';
      },
    },
    // Resume link (URL field)
    resumeLink: {
      selectors: [
        'input#link_to_resume',
        'input[name="link_to_resume"]',
        'input[name*="link_to_resume" i]',
        'input[name*="resume_link" i]',
        'input[placeholder*="ссылка на резюме" i]',
        'input[placeholder*="resume link" i]',
        'input[id*="link_to_resume" i]',
      ],
      getValue: (data) => data.personal?.website || data.personal?.linkedin || '',
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
