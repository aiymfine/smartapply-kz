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
   */
  function fillField(el, value) {
    // Clear existing value
    el.value = '';
    el.dispatchEvent(new Event('focus', { bubbles: true }));

    if (el.tagName === 'SELECT') {
      fillSelect(el, value);
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = Boolean(value);
    } else {
      // Text inputs, textareas
      el.value = value;

      // Simulate typing for React/Vue controlled inputs
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, value);
      } else {
        el.value = value;
      }
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
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
})();
