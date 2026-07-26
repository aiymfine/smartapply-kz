/**
 * SmartApply KZ — Background Service Worker
 * Handles communication between popup and content scripts
 * Manages resume data in Chrome storage
 */

const SERVER_URL = 'http://localhost:3200';

// ── Install handler ──
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SmartApply] Extension installed. Opening setup.');
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
  }
});

// ── Message handler ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PARSE_RESUME':
      handleParseResume(message.file)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true; // async

    case 'AUTOFILL_PAGE':
      handleAutofill(sender.tab.id, message.data)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'GET_STORED_RESUME':
      chrome.storage.local.get('resumeData', (result) => {
        sendResponse(result.resumeData || null);
      });
      return true;

    case 'CLEAR_RESUME':
      chrome.storage.local.remove('resumeData', () => {
        sendResponse({ success: true });
      });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Send file to backend for parsing, store result
 */
async function handleParseResume(fileData) {
  const { name, type, dataUrl } = fileData;

  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append('resume', blob, name);

  const apiResponse = await fetch(`${SERVER_URL}/api/parse/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!apiResponse.ok) {
    const err = await apiResponse.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${apiResponse.status}`);
  }

  const result = await apiResponse.json();

  // Store in Chrome local storage
  await chrome.storage.local.set({
    resumeData: {
      ...result.data,
      _meta: result.meta,
      _storedAt: new Date().toISOString(),
    },
  });

  return { success: true, data: result.data, meta: result.meta };
}

/**
 * Trigger autofill on the active tab
 */
async function handleAutofill(tabId, data) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (resumeData) => {
      // This runs in the page context
      if (window.__smartApplyAutofill) {
        return window.__smartApplyAutofill(resumeData);
      }
      return { error: 'Autofill script not loaded on this page.' };
    },
    args: [data],
  });

  return results[0]?.result || { error: 'No result' };
}
