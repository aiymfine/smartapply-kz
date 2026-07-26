# 🚀 SmartApply KZ

**AI-powered resume toolkit for the Kazakhstani job market.**

Upload your resume once → AI extracts everything → autofill job applications, score your resume, and generate tailored cover letters. Works on hh.kz, Kaspi, Enbek.kz.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Tests](https://img.shields.io/badge/tests-23%20passing-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## ✨ Features

### 📋 Smart Autofill
Upload your resume (PDF/DOCX) → AI extracts structured data → **one-click autofill** on supported job sites. No more manual form filling.

### 🎯 Resume Scoring
Get a **100-point AI assessment** with category breakdowns (content, formatting, skills, experience, education, keywords) and actionable improvement suggestions.

### ✉️ Cover Letter Generator
Paste a job description → get a **tailored cover letter** in English, Russian, or Kazakh. Based on your actual experience, not templates.

### 🔒 Privacy First
Resume data stays in your browser's local storage. The server processes and forgets — nothing stored, nothing tracked.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER EXTENSION (MV3)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │  Popup UI    │  │ Background│  │  Content Scripts      │  │
│  │  (3 tabs)    │  │ Worker   │  │  (Detector + Autofill) │  │
│  │  - Autofill  │──▶│          │──▶│                       │  │
│  │  - Score     │  │  Storage │  │  hh.kz / Kaspi /      │  │
│  │  - Cover Ltr │  │  Manager │  │  Enbek.kz             │  │
│  └──────────────┘  └────┬─────┘  └───────────────────────┘  │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP (parsing, scoring, generation)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                      │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Express │─▶│  Parser   │─▶│ AI LLM   │─▶│ Zod Valid  │  │
│  │  Server  │  │  (PDF/    │  │ (GLM-4.5 │  │            │  │
│  │  :3200   │  │   DOCX)   │  │  Flash)  │  │            │  │
│  └──────────┘  └───────────┘  └────┬─────┘  └────────────┘  │
│                                    │                          │
│  ┌─────────────────────────────────┼──────────────────────┐  │
│  │           AI Services            │                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ Extract  │  │  Score   │  │  Cover   │             │  │
│  │  │ Resume   │  │  Resume  │  │  Letter  │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────┐  ┌───────────┐  ┌────────────────────────┐  │
│  │ Rate Limit │  │  Helmet   │  │  Regex Fallback (no    │  │
│  │  + CORS    │  │  Security │  │  API key needed)       │  │
│  └────────────┘  └───────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
smartapply-kz/
├── server/                         # Backend API
│   ├── src/
│   │   ├── app.js                  # Express app
│   │   ├── routes/
│   │   │   ├── health.js           # GET /api/health
│   │   │   ├── parse.js            # POST /api/parse/upload|text
│   │   │   ├── score.js            # POST /api/score
│   │   │   ├── cover-letter.js     # POST /api/cover-letter
│   │   │   └── sites.js            # GET /api/sites
│   │   ├── services/
│   │   │   ├── parser.js           # PDF/DOCX text extraction
│   │   │   ├── extractor.js        # LLM structured extraction
│   │   │   ├── regex-fallback.js   # No-API fallback extractor
│   │   │   └── ai-writer.js        # Scoring + cover letter AI
│   │   └── schemas/
│   │       └── resume.js           # Zod validation schema
│   ├── tests/                      # 23 Jest + Supertest tests
│   ├── Dockerfile
│   └── package.json
│
├── extension/                      # Chrome/Firefox Extension (MV3)
│   ├── manifest.json
│   ├── background.js               # Service worker
│   ├── content/
│   │   ├── detector.js             # Universal form field detector
│   │   └── autofill.js             # React/Vue-compatible autofill
│   ├── popup/
│   │   ├── popup.html              # Tabbed UI (Autofill/Score/Cover)
│   │   └── popup.js                # Full popup logic
│   ├── sites/                      # Per-site field mappings
│   │   ├── hh-kz.js
│   │   ├── kaspi-kz.js
│   │   └── enbek-kz.js
│   └── icons/                      # Extension icons
│
├── .github/workflows/ci.yml        # GitHub Actions CI
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Backend

```bash
git clone https://github.com/aiymfine/smartapply-kz.git
cd smartapply-kz/server
npm install

# Optional: add API key for AI features (works without it using regex)
cp ../.env.example ../.env
# Edit .env: ZAI_API_KEY=your_key

npm run dev    # Start server
npm test       # Run tests
```

### Browser Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/` folder
4. Click the SmartApply icon → upload resume
5. Visit any supported job site → click **Autofill**

### Docker

```bash
docker compose up -d
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + system info |
| `POST` | `/api/parse/upload` | Upload PDF/DOCX → structured JSON |
| `POST` | `/api/parse/text` | Parse raw text → structured JSON |
| `POST` | `/api/score` | AI score resume (0-100) + suggestions |
| `POST` | `/api/cover-letter` | Generate tailored cover letter (EN/RU/KZ) |
| `GET` | `/api/sites` | List supported job sites |

### Example: Score a Resume

```bash
curl -X POST http://localhost:3200/api/score \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "John Doe, Software Engineer with 5 years..."}'
```

### Example: Generate Cover Letter

```bash
curl -X POST http://localhost:3200/api/cover-letter \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {"personal": {"fullName": "Aiym"}, "skills": ["Node.js"]},
    "jobDescription": "Looking for a backend developer with Node.js experience...",
    "language": "ru"
  }'
```

---

## 🌐 Supported Job Sites

| Site | URL | Status |
|------|-----|--------|
| HeadHunter KZ | hh.kz | ✅ Supported |
| Kaspi Jobs | kaspi.kz | ✅ Supported |
| Enbek.kz | enbek.kz | ✅ Supported |
| OLX Jobs | olx.kz | 🔜 Planned |

---

## 🔒 Privacy

- Resume data stored **locally** in Chrome Storage — never on servers
- Backend processes files in memory, **nothing persisted**
- No accounts, no tracking, no analytics
- Autofill runs entirely **client-side**

---

## 🧪 Testing

```bash
cd server && npm test
```

23 tests covering: health, parsing, scoring, cover letter, sites, validation, error handling.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| AI/LLM | z.ai GLM-4.5 Flash |
| Document Parsing | pdf-parse, mammoth |
| Validation | Zod |
| Extension | Manifest V3, Vanilla JS |
| Testing | Jest, Supertest (23 tests) |
| CI/CD | GitHub Actions |
| Container | Docker, docker-compose |
| Security | Helmet, CORS, Rate Limiting |

---

## 📝 License

MIT © [Aiym Kuzdenbay](https://github.com/aiymfine)

---

_Made with ☕ in Almaty, Kazakhstan_
