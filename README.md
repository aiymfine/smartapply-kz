# SmartApply KZ

**Resume intelligence API and autofill engine for Kazakhstani job platforms.**

Upload a resume → AI extracts structured data → autofill job application forms, score resumes, generate cover letters. Built for hh.kz, Kaspi.kz, and Enbek.kz.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Tests](https://img.shields.io/badge/tests-26%20passing-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

**Live API:** https://smartapply-kz-production.up.railway.app/api/health

---

## Features

- **Resume parsing** — PDF/DOCX → structured JSON via GLM-4.5 Flash
- **Form autofill** — detects and fills up to 13 form fields on supported sites
- **Resume scoring** — quantitative 0–100 score across 6 categories
- **Cover letter generation** — context-aware, in EN/RU/KZ
- **Job match analysis** — resume vs. job description comparison
- **Privacy-first** — data stays in browser, server processes and forgets

---

## Architecture

```
Browser Extension (MV3)
├── Popup UI (autofill / score / cover letter tabs)
├── Background worker (storage + API communication)
└── Content scripts
    ├── Detector — scans page for form fields
    └── Autofill — fills fields with resume data
        Works with: Vue/Nuxt, React, vanilla HTML
        Handles: text, select, radio, date, masked inputs

Backend API (Express.js)
├── POST /api/parse/upload   — PDF/DOCX → structured JSON
├── POST /api/parse/text     — raw text → structured JSON
├── POST /api/score          — 0-100 score + suggestions
├── POST /api/cover-letter   — AI cover letter (EN/RU/KZ)
├── POST /api/match          — resume vs job description
├── GET  /api/sites          — supported platforms info
└── GET  /api/health         — status + system info
```

---

## Quick Start

### Backend

```bash
git clone https://github.com/aiymfine/smartapply-kz.git
cd smartapply-kz/server
npm install

# Optional: add LLM key for AI features (regex fallback works without it)
echo "ZAI_API_KEY=your_key" > .env
echo "LLM_MODEL=glm-4.5-flash" >> .env

npm run dev    # Start on port 3200
npm test       # Run 26 tests
```

### Browser Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/` folder
4. Click SmartApply icon → upload resume
5. Visit a supported job site → click **Autofill**

### Docker

```bash
docker compose up -d
```

---

## API Reference

**Base URL:** `https://smartapply-kz-production.up.railway.app`

### Parse resume from upload

```bash
curl -X POST /api/parse/upload \
  -F "resume=@my_resume.pdf"
```

### Parse resume from text

```bash
curl -X POST /api/parse/text \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe, Software Engineer..."}'
```

### Score resume

```bash
curl -X POST /api/score \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Full resume text..."}'
```

### Generate cover letter

```bash
curl -X POST /api/cover-letter \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {"personal": {"fullName": "Aiym"}, "skills": ["Node.js"]},
    "jobDescription": "Looking for a backend developer...",
    "language": "ru"
  }'
```

### Job match analysis

```bash
curl -X POST /api/match \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {"skills": ["Node.js", "Docker"]},
    "jobDescription": "Need Node.js + Kubernetes experience..."
  }'
```

---

## Supported Job Sites

| Site | URL | Form Fields | Status |
|------|-----|-------------|--------|
| Kaspi.kz Jobs | job.kaspi.kz | 13 fields mapped | Verified |
| HeadHunter KZ | hh.kz | One-click apply + cover letter | Verified |
| Enbek.kz | enbek.kz | Mapped | Untested |
| OLX Jobs | olx.kz | — | Planned |

---

## Kaspi.kz Form Fields

Fields detected and mapped on job.kaspi.kz application form:

| Field | HTML ID | Auto-filled |
|-------|---------|-------------|
| First name | `#first_name` | Yes |
| Last name | `#last_name` | Yes |
| Middle name | `#middle_name` | Yes |
| Email | `#email` | Yes |
| Phone | `#phone` | Yes (masked input) |
| City | `#city_residence` | Yes |
| Birthday | `#birthday` | Yes (DD.MM.YYYY) |
| Education type | `#type_of_education` | Yes (select) |
| University | `#university` | Yes |
| Major | `#major` | Yes |
| Graduation year | `#graduation_year` | Yes |
| Is student | `input[name="is_student"]` | Yes (radio) |
| Resume link | `#link_to_resume` | Yes |
| File upload | `#file` | No (browser security) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| AI/LLM | z.ai GLM-4.5 Flash |
| Document Parsing | pdf-parse, mammoth |
| Validation | Zod |
| Extension | Manifest V3, Vanilla JS |
| Testing | Jest, Supertest (26 tests) |
| CI/CD | GitHub Actions |
| Deploy | Railway |
| Security | Helmet, CORS, Rate Limiting |

---

## Testing

```bash
cd server && npm test
```

26 tests covering: health, parsing, scoring, cover letter, match analysis, sites API, validation, and error handling.

---

## Project Structure

```
smartapply-kz/
├── server/
│   ├── src/
│   │   ├── app.js              # Express app + landing page
│   │   ├── routes/             # 6 API route handlers
│   │   ├── services/           # Parser, extractor, AI writer, regex fallback
│   │   └── schemas/            # Zod resume schema
│   ├── tests/                  # Jest + Supertest
│   ├── public/                 # Landing page (served by Express)
│   └── package.json
├── extension/
│   ├── manifest.json           # MV3 with host permissions
│   ├── background.js           # Service worker
│   ├── content/
│   │   ├── detector.js         # Universal field detector (14 field types)
│   │   └── autofill.js         # Framework-compatible autofill engine
│   ├── popup/                  # 3-tab UI (Autofill / Score / Cover Letter)
│   ├── options/                # Settings page
│   └── sites/                  # Per-site field mappings
├── landing/                    # Landing page source
├── .github/workflows/ci.yml    # GitHub Actions CI
├── Dockerfile
└── docker-compose.yml
```

---

## License

MIT © [Aiym Kuzdenbay](https://github.com/aiymfine)
