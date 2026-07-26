/**
 * SmartApply KZ — Popup UI Logic (v2)
 * Tabbed interface: Autofill + Resume Score + Cover Letter
 */

const SERVER_URL = 'http://localhost:3200';
const SUPPORTED_DOMAINS = ['hh.kz', 'kz.hh.ru', 'kaspi.kz', 'enbek.kz', 'jobs.enbek.kz'];

let currentLang = 'en';

// ── DOM References ──
const $ = (id) => document.getElementById(id);

// ── Tab Navigation ──
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Language selector (cover letter) ──
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.dataset.lang;
  });
});

// ── Status helper ──
function showStatus(el, message, type = 'info') {
  el.className = `status show ${type}`;
  if (type === 'loading') {
    el.innerHTML = `<span class="spinner"></span>${message}`;
  } else {
    el.textContent = message;
  }
}
function hideStatus(el) { el.className = 'status'; }

// ════════ AUTOFILL TAB ════════

const uploadZone = $('uploadZone');
const fileInput = $('fileInput');
const fileInfo = $('fileInfo');
const afStatus = $('afStatus');
const dataPreview = $('dataPreview');
const dataRows = $('dataRows');
const autofillBtn = $('autofillBtn');
const clearBtn = $('clearBtn');

// ── Check current site ──
async function checkCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const url = new URL(tab.url);
    const domain = url.hostname.replace('www.', '');
    const isSupported = SUPPORTED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

    const badge = $('siteBadge');
    const status = $('siteStatus');

    if (isSupported) {
      badge.className = 'site-badge supported';
      status.textContent = `✅ ${domain} — автозаполнение доступно`;

      // Ping the content script to count fields
      try {
        chrome.tabs.sendMessage(tab.id, { type: 'PING_AUTOFILL' }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response?.fields) {
            status.textContent = `✅ ${domain} — найдено ${response.fields.total} полей`;
          }
        });
      } catch {}
    } else {
      badge.className = 'site-badge unsupported';
      status.textContent = `⚠️ ${domain} — сайт не поддерживается`;
    }
  } catch {}
}

checkCurrentSite();

// ── Upload zone events ──
uploadZone.addEventListener('click', () => fileInput.click());

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

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// ── File handling ──
async function handleFile(file) {
  const validExts = ['.pdf', '.docx', '.doc'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!validExts.includes(ext)) {
    showStatus(afStatus, `❌ Неподдерживаемый формат: ${ext}. Используйте PDF или DOCX.`, 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showStatus(afStatus, '❌ Файл слишком большой. Максимум 5MB.', 'error');
    return;
  }

  fileInfo.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
  fileInfo.style.display = 'block';
  uploadZone.classList.add('has-file');

  showStatus(afStatus, 'AI обрабатывает резюме...', 'loading');

  try {
    const dataUrl = await fileToDataUrl(file);
    const response = await chrome.runtime.sendMessage({
      type: 'PARSE_RESUME',
      file: { name: file.name, type: file.type, dataUrl },
    });

    if (response.error) throw new Error(response.error);

    showStatus(afStatus, `✅ Готово! Извлечено ${Object.keys(response.data).length} разделов.`, 'success');
    displayData(response.data);

    autofillBtn.disabled = false;
    clearBtn.style.display = 'block';

    // Enable score button too
    $('scoreBtn').disabled = false;
    $('generateCoverBtn').disabled = false;
  } catch (err) {
    showStatus(afStatus, `❌ ${err.message}`, 'error');
    fileInfo.style.display = 'none';
    uploadZone.classList.remove('has-file');
  }
}

function displayData(data) {
  const rows = [];
  if (data.personal?.fullName) rows.push(['Имя', data.personal.fullName]);
  if (data.personal?.email) rows.push(['Email', data.personal.email]);
  if (data.personal?.phone) rows.push(['Телефон', data.personal.phone]);
  if (data.personal?.location) rows.push(['Город', data.personal.location]);
  if (data.skills?.length) rows.push(['Навыки', data.skills.slice(0, 5).join(', ') + (data.skills.length > 5 ? '...' : '')]);
  if (data.experience?.length) rows.push(['Опыт', `${data.experience.length} записей`]);
  if (data.education?.length) rows.push(['Образование', `${data.education.length} записей`]);

  dataRows.innerHTML = rows.map(([label, value]) =>
    `<div class="data-row"><span class="label">${label}</span><span class="value">${escapeHtml(value)}</span></div>`
  ).join('');

  dataPreview.classList.add('show');
}

// ── Autofill button ──
autofillBtn.addEventListener('click', async () => {
  showStatus(afStatus, 'Заполнение формы...', 'loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { showStatus(afStatus, '❌ Нет активной вкладки', 'error'); return; }

    const resumeResponse = await chrome.runtime.sendMessage({ type: 'GET_STORED_RESUME' });
    if (!resumeResponse) {
      showStatus(afStatus, '❌ Сначала загрузите резюме', 'error');
      return;
    }

    const result = await chrome.tabs.sendMessage(tab.id, { type: 'DO_AUTOFILL', data: resumeResponse });

    if (result?.error) {
      showStatus(afStatus, `⚠️ ${result.error}`, 'error');
    } else {
      showStatus(afStatus, `✅ Заполнено ${result.filled} полей! (${result.skipped} пропущено)`, 'success');
    }
  } catch (err) {
    showStatus(afStatus, `❌ ${err.message}. Откройте сайт вакансий (hh.kz, kaspi.kz)`, 'error');
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
  showStatus(afStatus, 'Данные очищены.', 'info');
});

// ════════ SCORE TAB ════════

$('scoreBtn').addEventListener('click', async () => {
  showStatus($('scStatus'), 'AI анализирует резюме...', 'loading');

  try {
    const resumeResponse = await chrome.runtime.sendMessage({ type: 'GET_STORED_RESUME' });
    if (!resumeResponse) {
      showStatus($('scStatus'), '❌ Сначала загрузите резюме', 'error');
      return;
    }

    // Use the rawText if available, otherwise stringify
    const resumeText = resumeResponse._meta ? JSON.stringify(resumeResponse, null, 2) : JSON.stringify(resumeResponse);

    const response = await fetch(`${SERVER_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const score = await response.json();
    displayScore(score);
    hideStatus($('scStatus'));
  } catch (err) {
    showStatus($('scStatus'), `❌ ${err.message}`, 'error');
  }
});

function displayScore(scoreData) {
  $('scorePlaceholder').style.display = 'none';
  const result = $('scoreResult');
  result.style.display = 'block';

  const scoreColor = scoreData.score >= 80 ? '#22c55e' : scoreData.score >= 60 ? '#f59e0b' : '#ef4444';

  let html = `
    <div class="score-display">
      <div class="score-circle" style="--score-color: ${scoreColor}; --score-percent: ${scoreData.score};">
        <span style="color: ${scoreColor};">${scoreData.score}</span>
      </div>
      <div class="score-grade" style="color: ${scoreColor};">Оценка: ${scoreData.grade}</div>
      <div class="score-summary">${escapeHtml(scoreData.summary || '')}</div>
      <div class="score-categories">
  `;

  for (const [cat, data] of Object.entries(scoreData.categories || {})) {
    const catColor = data.score >= 80 ? '#4ade80' : data.score >= 60 ? '#fbbf24' : '#f87171';
    html += `
      <div class="score-cat">
        <div class="score-cat-name">${cat}</div>
        <div class="score-cat-value" style="color: ${catColor};">${data.score}/100</div>
      </div>
    `;
  }

  html += '</div></div>';

  // Suggestions
  if (scoreData.suggestions?.length) {
    html += '<h3 style="font-size:11px;color:#94a3b8;text-transform:uppercase;margin:14px 0 8px;letter-spacing:0.5px;">💡 Рекомендации</h3>';
    for (const s of scoreData.suggestions) {
      html += `
        <div class="suggestion ${s.priority}">
          <span class="priority">${s.priority}</span>
          <div class="issue"><strong>${escapeHtml(s.category)}:</strong> ${escapeHtml(s.issue)}</div>
          <div class="fix">→ ${escapeHtml(s.fix)}</div>
        </div>
      `;
    }
  }

  result.innerHTML = html;
}

// ════════ COVER LETTER TAB ════════

$('generateCoverBtn').addEventListener('click', async () => {
  const jobDesc = $('jobDescription').value.trim();

  if (!jobDesc || jobDesc.length < 30) {
    showStatus($('clStatus'), '❌ Вставьте описание вакансии (минимум 30 символов)', 'error');
    return;
  }

  showStatus($('clStatus'), 'AI пишет сопроводительное письмо...', 'loading');

  try {
    const resumeResponse = await chrome.runtime.sendMessage({ type: 'GET_STORED_RESUME' });
    if (!resumeResponse) {
      showStatus($('clStatus'), '❌ Сначала загрузите резюме', 'error');
      return;
    }

    const response = await fetch(`${SERVER_URL}/api/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: resumeResponse,
        jobDescription: jobDesc,
        language: currentLang,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    $('coverLetterOutput').textContent = result.coverLetter;
    $('coverLetterOutput').classList.add('show');
    $('copyCoverBtn').style.display = 'block';
    hideStatus($('clStatus'));
  } catch (err) {
    showStatus($('clStatus'), `❌ ${err.message}`, 'error');
  }
});

$('copyCoverBtn').addEventListener('click', () => {
  const text = $('coverLetterOutput').textContent;
  navigator.clipboard.writeText(text).then(() => {
    $('copyCoverBtn').textContent = '✅ Скопировано!';
    setTimeout(() => { $('copyCoverBtn').textContent = '📋 Копировать текст'; }, 2000);
  });
});

// ── Check for stored resume on load ──
chrome.runtime.sendMessage({ type: 'GET_STORED_RESUME' }, (response) => {
  if (response) {
    displayData(response);
    autofillBtn.disabled = false;
    clearBtn.style.display = 'block';
    fileInfo.textContent = '✓ Резюме загружено из памяти';
    fileInfo.style.display = 'block';
    uploadZone.classList.add('has-file');
    $('scoreBtn').disabled = false;
    $('generateCoverBtn').disabled = false;
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
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
