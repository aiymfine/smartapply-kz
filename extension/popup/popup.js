/**
 * SmartApply KZ — Popup UI Logic
 * Handles file upload, displays extracted data, triggers autofill
 */

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const statusEl = document.getElementById('status');
const dataPreview = document.getElementById('dataPreview');
const dataRows = document.getElementById('dataRows');
const autofillBtn = document.getElementById('autofillBtn');
const clearBtn = document.getElementById('clearBtn');

// ── Status helpers ──
function showStatus(message, type = 'info') {
  statusEl.className = `status show ${type}`;
  if (type === 'loading') {
    statusEl.innerHTML = `<span class="spinner"></span>${message}`;
  } else {
    statusEl.textContent = message;
  }
}

function hideStatus() {
  statusEl.className = 'status';
}

// ── Upload zone click ──
uploadZone.addEventListener('click', () => fileInput.click());

// ── Drag & drop ──
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = '#2563eb';
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '#334155';
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = '#334155';

  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ── File input change ──
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// ── Handle file upload ──
async function handleFile(file) {
  const validExts = ['.pdf', '.docx', '.doc'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!validExts.includes(ext)) {
    showStatus(`Unsupported format: ${ext}. Use PDF or DOCX.`, 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showStatus('File too large. Maximum 5MB.', 'error');
    return;
  }

  fileInfo.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
  fileInfo.style.display = 'block';
  uploadZone.classList.add('has-file');

  showStatus('Sending to AI for parsing...', 'loading');

  try {
    // Convert file to data URL
    const dataUrl = await fileToDataUrl(file);

    // Send to background script → server
    const response = await chrome.runtime.sendMessage({
      type: 'PARSE_RESUME',
      file: { name: file.name, type: file.type, dataUrl },
    });

    if (response.error) {
      throw new Error(response.error);
    }

    showStatus(`✅ Parsed successfully! ${Object.keys(response.data).length} fields extracted.`, 'success');
    displayData(response.data);

    autofillBtn.disabled = false;
    clearBtn.style.display = 'block';
  } catch (err) {
    showStatus(`❌ ${err.message}`, 'error');
    fileInfo.style.display = 'none';
    uploadZone.classList.remove('has-file');
  }
}

// ── Display extracted data preview ──
function displayData(data) {
  const rows = [];

  if (data.personal?.fullName) {
    rows.push(['Name', data.personal.fullName]);
  }
  if (data.personal?.email) {
    rows.push(['Email', data.personal.email]);
  }
  if (data.personal?.phone) {
    rows.push(['Phone', data.personal.phone]);
  }
  if (data.personal?.location) {
    rows.push(['Location', data.personal.location]);
  }
  if (data.skills?.length) {
    rows.push(['Skills', data.skills.slice(0, 5).join(', ') + (data.skills.length > 5 ? '...' : '')]);
  }
  if (data.experience?.length) {
    rows.push(['Experience', `${data.experience.length} entries`]);
  }
  if (data.education?.length) {
    rows.push(['Education', `${data.education.length} entries`]);
  }
  if (data.languages?.length) {
    rows.push(['Languages', data.languages.map(l => l.name).join(', ')]);
  }

  dataRows.innerHTML = rows.map(([label, value]) => `
    <div class="data-row">
      <span class="label">${label}</span>
      <span class="value">${escapeHtml(value)}</span>
    </div>
  `).join('');

  dataPreview.classList.add('show');
}

// ── Autofill button ──
autofillBtn.addEventListener('click', async () => {
  showStatus('Checking page for forms...', 'loading');

  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showStatus('No active tab found.', 'error');
      return;
    }

    // Get stored resume data
    const resumeResponse = await chrome.runtime.sendMessage({ type: 'GET_STORED_RESUME' });
    if (!resumeResponse) {
      showStatus('No resume data found. Upload a resume first.', 'error');
      return;
    }

    showStatus('Filling forms...', 'loading');

    // Send autofill command to content script
    const result = await chrome.tabs.sendMessage(tab.id, {
      type: 'DO_AUTOFILL',
      data: resumeResponse,
    });

    if (result?.error) {
      showStatus(`⚠️ ${result.error}`, 'error');
    } else {
      showStatus(
        `✅ Filled ${result.filled} fields! (${result.skipped} skipped)`,
        'success'
      );
    }
  } catch (err) {
    showStatus(`❌ ${err.message}. Make sure you're on a supported job site.`, 'error');
  }
});

// ── Clear button ──
clearBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR_RESUME' });
  dataPreview.classList.remove('show');
  autofillBtn.disabled = true;
  clearBtn.style.display = 'none';
  fileInfo.style.display = 'none';
  uploadZone.classList.remove('has-file');
  showStatus('Resume data cleared.', 'info');
});

// ── Check for stored resume on load ──
chrome.runtime.sendMessage({ type: 'GET_STORED_RESUME' }, (response) => {
  if (response) {
    displayData(response);
    autofillBtn.disabled = false;
    clearBtn.style.display = 'block';
    fileInfo.textContent = `✓ Resume loaded from storage`;
    fileInfo.style.display = 'block';
    uploadZone.classList.add('has-file');
  }
});

// ── Utilities ──
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
