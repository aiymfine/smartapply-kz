# 🚀 SmartApply KZ

**AI-powered resume autofill for Kazakhstani job sites.**

Upload your resume once. SmartApply extracts everything with AI and fills job application forms on hh.kz, Kaspi, Enbek.kz — automatically.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## 🎯 The Problem

Every job platform in Kazakhstan asks you to **manually re-enter** your entire resume — name, email, phone, experience, education, skills... Over and over. It's tedious, error-prone, and discourages people from applying to jobs.

## 💡 The Solution

1. **Upload your resume** (PDF or DOCX) — once
2. **AI extracts** structured data — name, contact, skills, experience, education
3. **Visit any supported job site** — hh.kz, Kaspi, Enbek.kz
4. **Click "Autofill"** — forms fill themselves instantly

Your data stays **in your browser**. No accounts, no servers storing your info.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER EXTENSION                      │
│  ┌──────────┐   ┌─────────────┐   ┌──────────────────┐  │
│  │  Popup   │──▶│  Background │──▶│  Content Script  │  │
│  │  (UI)    │   │  (Worker)   │   │  (Autofill)      │  │
│  └──────────┘   └──────┬──────┘   └────────┬─────────┘  │
│                        │                    │            │
│                        │     ┌──────────────┘            │
│                        ▼     ▼                           │
│                 ┌─────────────────┐                      │
│                 │  Chrome Storage │  ◀── Resume data     │
│                 │   (Local)       │      stored here     │
│                 └─────────────────┘                      │
│                        │                                 │
└────────────────────────┼─────────────────────────────────┘
                         │ HTTP (only for parsing)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                  │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  │
│  │  Express │─▶│  Parser   │─▶│ AI LLM   │─▶│ Zod    │  │
│  │  Server  │  │  (PDF/    │  │ (GLM-4.5 │  │ Valid- │  │
│  │  :3200   │  │   DOCX)   │  │  Flash)  │  │ ation  │  │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘  │
│                                                          │
│  ┌──────────────────┐  ┌────────────────────────────┐   │
│  │  Rate Limiting   │  │  Regex Fallback (no API)   │   │
│  │  + Helmet + CORS │  │  - email, phone, skills    │   │
│  └──────────────────┘  └────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
smartapply-kz/
├── server/                      # Backend API
│   ├── src/
│   │   ├── app.js               # Express app entry
│   │   ├── routes/
│   │   │   ├── health.js        # GET /api/health
│   │   │   └── parse.js         # POST /api/parse/upload, /text
│   │   ├── services/
│   │   │   ├── parser.js        # PDF/DOCX text extraction
│   │   │   ├── extractor.js     # LLM-based structured extraction
│   │   │   └── regex-fallback.js # No-API fallback extractor
│   │   └── schemas/
│   │       └── resume.js        # Zod validation schema
│   ├── tests/                   # Jest + Supertest tests
│   ├── Dockerfile
│   └── package.json
│
├── extension/                   # Chrome/Firefox Extension
│   ├── manifest.json            # Manifest V3
│   ├── background.js            # Service worker
│   ├── content/
│   │   ├── detector.js          # Form field detection engine
│   │   └── autofill.js          # Field filling + React/Vue compat
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   └── popup.js             # Upload, preview, autofill logic
│   ├── sites/                   # Per-site field mappings
│   │   ├── hh-kz.js
│   │   ├── kaspi-kz.js
│   │   └── enbek-kz.js
│   └── icons/
│
├── .github/workflows/ci.yml     # GitHub Actions CI
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Backend

```bash
# Clone
git clone https://github.com/aiymfine/smartapply-kz.git
cd smartapply-kz

# Install
cd server
npm install

# Configure (optional — works without API key using regex fallback)
cp ../.env.example ../.env
# Add your z.ai API key for better AI extraction

# Run
npm run dev

# Test
npm test
```

Server runs on `http://localhost:3200`.

### Browser Extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin SmartApply KZ to your toolbar
6. Click the icon → upload your resume → visit a job site → click **Autofill**

### Docker

```bash
docker compose up -d
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + system info |
| `POST` | `/api/parse/upload` | Upload PDF/DOCX resume → structured JSON |
| `POST` | `/api/parse/text` | Parse raw resume text → structured JSON |

### Example: Upload Resume

```bash
curl -X POST http://localhost:3200/api/parse/upload \
  -F "resume=@my_resume.pdf"
```

### Example: Parse Text

```bash
curl -X POST http://localhost:3200/api/parse/text \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe, Software Engineer, email: john@example.com..."}'
```

### Response Shape

```json
{
  "success": true,
  "meta": {
    "filename": "resume.pdf",
    "size": 245678,
    "type": "pdf",
    "textLength": 3421,
    "extractedAt": "2026-07-26T16:00:00.000Z"
  },
  "data": {
    "personal": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1 555 123 4567",
      "location": "Almaty, Kazakhstan"
    },
    "skills": ["JavaScript", "Node.js", "Docker", "PostgreSQL"],
    "experience": [...],
    "education": [...]
  },
  "warnings": []
}
```

---

## 🌐 Supported Job Sites

| Site | URL | Status |
|------|-----|--------|
| HeadHunter KZ | hh.kz | ✅ Supported |
| Kaspi Jobs | kaspi.kz | ✅ Supported |
| Enbek.kz | enbek.kz | ✅ Supported |
| OLX Jobs | olx.kz | 🔜 Planned |

Adding a new site is as simple as creating a field mapping file in `extension/sites/`.

---

## 🔒 Privacy

- Resume data is stored **locally** in your browser's Chrome Storage
- The backend only processes your file for extraction — **nothing is stored server-side**
- No accounts, no tracking, no analytics
- Works without internet once resume is parsed (autofill is client-side)

---

## 🧪 Testing

```bash
cd server
npm test
```

Tests cover:
- Health endpoint
- File upload validation
- Text parsing
- Regex fallback extraction
- Error handling (404, 413, unsupported types)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| AI/LLM | z.ai GLM-4.5 Flash (free tier) |
| Document Parsing | pdf-parse, mammoth |
| Validation | Zod |
| Extension | Manifest V3, Vanilla JS |
| Testing | Jest, Supertest |
| CI/CD | GitHub Actions |
| Container | Docker, docker-compose |
| Security | Helmet, CORS, Rate Limiting |

---

## 📝 License

MIT © [Aiym Kuzdenbay](https://github.com/aiymfine)

---

## 🤝 Contributing

PRs welcome! This project specifically focuses on **Kazakhstani job platforms**.

1. Fork it
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a PR

---

_Made with ☕ in Almaty, Kazakhstan_
