/**
 * SmartApply KZ — Auto-fill Engine
 * Fills detected form fields with resume data
 */

(function () {
  'use strict';

  /**
   * Main autofill function — fills all detected fields
   * @param {object} resumeData - Parsed resume data
   * @returns {object} Fill report
   */
  function autofill(resumeData) {
    if (!window.__smartApplyDetector) {
      return { error: 'Detector not loaded' };
    }

    const detected = window.__smartApplyDetector.detectFields();
    const report = {
      filled: 0,
      skipped: 0,
      fields: {},
      errors: [],
    };

    for (const [fieldType, elements] of Object.entries(detected)) {
      const config = window.__smartApplyDetector.FIELD_PATTERNS[fieldType];
      const value = config.getValue(resumeData);

      if (!value) {
        report.skipped += elements.length;
        report.fields[fieldType] = { status: 'no-data', count: elements.length };
        continue;
      }

      for (const el of elements) {
        try {
          fillField(el, value);
          report.filled++;
        } catch (err) {
          report.errors.push(`${fieldType}: ${err.message}`);
          report.skipped++;
        }
      }

      report.fields[fieldType] = { status: 'filled', count: elements.length, value: value.substring(0, 50) };
    }

    // Dispatch events so frameworks (React, Vue) pick up changes
    dispatchInputEvents();

    return report;
  }

  /**
   * Fill a single field based on its tag type
   * Handles React, Vue, and Nuxt controlled inputs
   */
  function fillField(el, value) {
    // Clear existing value first
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

    // Clear
    if (nativeSetter) {
      nativeSetter.call(el, '');
    } else {
      el.value = '';
    }
    el.dispatchEvent(new Event('focus', { bubbles: true }));

    if (el.tagName === 'SELECT') {
      fillSelect(el, value);
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = Boolean(value);
    } else if (el.type === 'date') {
      // Date inputs need YYYY-MM-DD
      const date = new Date(value);
      if (!isNaN(date)) {
        el.value = date.toISOString().split('T')[0];
      } else {
        el.value = value;
      }
    } else if (el.id === 'birthday' || el.name === 'birthday') {
      // Kaspi birthday field uses DD.MM.YYYY mask format
      const formatted = formatBirthday(value);
      fillMaskedInput(el, formatted);
    } else if (el.id === 'phone' || el.type === 'tel' || el.name === 'phone') {
      // Phone fields often have input masks
      fillMaskedInput(el, value);
    } else {
      // Standard text inputs
      if (nativeSetter) {
        nativeSetter.call(el, value);
      } else {
        el.value = value;
      }
    }

    // Trigger all events frameworks listen to
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  /**
   * Format a date string to DD.MM.YYYY (Kaspi birthday format)
   */
  function formatBirthday(value) {
    // Try parsing YYYY-MM-DD
    let m = value.match(/(\d{4})[-.](\d{2})[-.](\d{2})/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    // Try parsing DD.MM.YYYY already
    m = value.match(/(\d{2})[.](\d{2})[.](\d{4})/);
    if (m) return value;
    // Try parsing any date
    const d = new Date(value);
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }
    return value;
  }

  /**
   * Fill a masked input field using execCommand
   * This properly triggers Vue/React mask libraries by simulating real text insertion
   */
  function fillMaskedInput(el, value) {
    el.focus();
    // Clear any existing value
    el.select?.();
    document.execCommand('delete', false);

    // Use execCommand for proper input event dispatch
    // Some browsers/libraries need character-by-character insertion
    try {
      document.execCommand('insertText', false, value);
    } catch (e) {
      // Fallback: native setter + InputEvent
      const proto = el.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, value);
      else el.value = value;

      el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: value,
        inputType: 'insertText',
      }));
    }
  }

  /**
   * Try to match a select option by text or value
   */
  function fillSelect(el, value) {
    const options = Array.from(el.options);
    const lowerValue = value.toLowerCase().trim();

    // Try exact match first
    let match = options.find(o => o.text.toLowerCase().trim() === lowerValue);

    // Try partial match
    if (!match) {
      match = options.find(o =>
        o.text.toLowerCase().includes(lowerValue) ||
        lowerValue.includes(o.text.toLowerCase().trim())
      );
    }

    // Try value match
    if (!match) {
      match = options.find(o => o.value.toLowerCase() === lowerValue);
    }

    if (match) {
      el.value = match.value;
    }
  }

  /**
   * Trigger input events on all modified fields
   */
  function dispatchInputEvents() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.value) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  // Export globally for background.js to call
  window.__smartApplyAutofill = autofill;

  // Listen for direct messages from extension
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PING_AUTOFILL') {
        const count = window.__smartApplyDetector?.getFieldCount() || { categories: 0, total: 0 };
        sendResponse({ ready: true, fields: count });
      }
      if (message.type === 'DO_AUTOFILL') {
        const result = autofill(message.data);
        sendResponse(result);
      }
    });
  }
})();
