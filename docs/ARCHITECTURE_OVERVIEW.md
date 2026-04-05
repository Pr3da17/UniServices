# Architecture Overview : Plan B (Web Scraping)

## 📂 Project Structure

```
moodle/
├── src/                                    # React Frontend
│   ├── App.tsx                            # Main app (updated for backend)
│   ├── services/
│   │   └── moodleService.ts              # Calls backend /api/*, not Moodle directly
│   ├── components/
│   │   └── Sidebar.tsx                   # Navigation
│   └── index.css                         # Tailwind styles
│
├── backend/                               # NEW: Express Proxy Server
│   ├── package.json                      # Dependencies
│   ├── tsconfig.json                     # TypeScript config
│   ├── .env.example                      # Configuration template
│   ├── README.md                         # Backend docs
│   └── src/
│       ├── server.ts                     # Express main server
│       ├── types.ts                      # TypeScript interfaces
│       ├── scrapers/
│       │   └── moodleScraper.ts         # Web scraping logic
│       └── routes/
│           ├── auth.ts                  # POST /login, /logout, /verify
│           └── assignments.ts           # GET /assignments, /courses
│
├── docs/                                  # Documentation
│   ├── ADR-001-*.md                     # Plan A (superseded)
│   ├── ADR-002-web-scraping-*.md        # Plan B (current)
│   ├── IMPLEMENTATION_PLAN.md           # Detailed 6-phase plan
│   ├── QUICK_START_BACKEND.md           # 5-minute setup
│   ├── PLAN_B_SUMMARY.md                # High-level overview
│   └── ARCHITECTURE_OVERVIEW.md         # This file
│
├── package.json                          # Frontend dependencies
├── vite.config.ts                        # Vite configuration
├── tsconfig.json                         # Frontend TypeScript
└── .env.example                          # Frontend env template
```

---

## 🔄 Request Flow

### Login Request

```
Student Browser
    ↓ Type credentials
React Form Component
    ↓ POST /api/auth/login
Express Proxy (localhost:3001)
    ├─ Receive: {username, password}
    ├─ POST to Moodle: /login/index.php
    ├─ Extract: MoodleSession cookie
    ├─ Store: in memory {sessionId → {cookies, userId}}
    └─ Return: {success, sessionId, userId}
React Component
    ↓ Store sessionId in state
Student sees dashboard
```

### Assignments Fetch

```
Student clicks "Load Assignments"
    ↓
React calls: GET /api/assignments?sessionId=XXX
    ↓
Express Proxy
    ├─ Lookup: sessionId in memory
    ├─ Get: stored Moodle cookies
    ├─ Request: GET /my/index.php (with cookies)
    ├─ Parse: HTML with Cheerio selectors
    ├─ Extract: title, course, dueDate, status
    ├─ Cache: Results for 5 minutes
    └─ Return: JSON {success, data: [assignments]}
React
    ├─ Receive: Array of assignments
    ├─ Sort: by due date
    └─ Display: Urgences + Derniers Documents
```

---

## 🛠️ Technology Stack

| Component     | Technology          | Purpose                           |
| ------------- | ------------------- | --------------------------------- |
| Frontend      | React 19.2 + Vite 8 | UI, state management, hot reload  |
| Styling       | Tailwind CSS v4     | Utility-first CSS framework       |
| Icons         | lucide-react        | Beautiful SVG icons               |
| Frontend HTTP | axios               | Promise-based HTTP client         |
| Backend       | Node.js + Express   | REST API server                   |
| Scraping HTTP | axios               | Cross-site requests with cookies  |
| HTML Parsing  | Cheerio 1.0.0-rc.12 | jQuery-like DOM manipulation      |
| Cookie Mgmt   | cookie 0.5.0        | Parse/format HTTP cookies         |
| CORS          | cors middleware     | Enable cross-origin requests      |
| TypeScript    | 5.3.3               | Type safety (frontend & backend)  |
| Dev Server    | tsx                 | TypeScript hot-reload for backend |

---

## 🔐 Security Architecture

### Credential Flow

```
❌ NEVER: Browser → Moodle (CORS blocked anyway)
❌ NEVER: Store credentials in localStorage
✅ YES: Browser → Backend → Moodle (proxied)
✅ YES: sessionId (anonymous token) in React state
✅ YES: Cookies stored server-side only
```

### Authentication Lifecycle

```
1. User submits credentials
   └─ Browser receives sessionId (not credentials)

2. Browser uses sessionId for all requests
   └─ Backend maps sessionId → Moodle cookies

3. Backend sends cookies with Moodle requests
   └─ Moodle sees valid session, returns data

4. Backend parses data, returns JSON
   └─ Frontend displays (no credentials exposed)

5. Session expires (1h)
   └─ Browser gets 401, prompts re-login
```

### Rate Limiting

- 5 login attempts per IP per 15 minutes
- Backend returns 429 (Too Many Requests)
- Client-side: Lock UI for 5 minutes

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint                       | Body                 | Response                      |
| ------ | ------------------------------ | -------------------- | ----------------------------- |
| POST   | /api/auth/login                | {username, password} | {sessionId, userId, username} |
| POST   | /api/auth/logout               | {sessionId}          | {success: true}               |
| GET    | /api/auth/verify?sessionId=XXX | Query param          | {valid: true/false, ...}      |

### Data Retrieval

| Method | Endpoint                     | Params      | Response               |
| ------ | ---------------------------- | ----------- | ---------------------- |
| GET    | /api/assignments             | sessionId   | {data: [Assignment[]]} |
| GET    | /api/assignments/courses     | sessionId   | {data: [Course[]]}     |
| POST   | /api/assignments/clear-cache | {sessionId} | {success: true}        |

---

## 🚀 Development Workflow

### Start Frontend

```bash
npm run dev
# Runs on http://localhost:5173
# Hot-reloads on file changes
```

### Start Backend (New Terminal)

```bash
cd backend
npm run dev
# Runs on http://localhost:3001
# Uses tsx for TS hot-reload
```

### Test Flow

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# Returns: {sessionId: "session_xxx"}

# 2. Fetch Assignments
curl 'http://localhost:3001/api/assignments?sessionId=session_xxx'
# Returns: {data: [{id, title, course, dueDate, ...}]}

# 3. Open browser at localhost:5173
# Should show login form → dashboard
```

---

## 🔍 How HTML Parsing Works

### Moodle Dashboard HTML

```html
<div class="my-courses">
  <div data-type="assign" data-course-id="101">
    <span class="activity-name">Devoir Mathématiques</span>
    <span class="duedate">25/03/2026 23:59</span>
    <div class="submitted">✓ Soumis</div>
  </div>
</div>
```

### Cheerio Extraction

```typescript
// File: backend/src/scrapers/moodleScraper.ts
const $ = cheerio.load(htmlResponse);

$('[data-type="assign"]').each((index, element) => {
  const $el = $(element);

  const title = $el.find(".activity-name").text().trim();
  const courseId = $el.attr("data-course-id");
  const dueDate = $el.find(".duedate").text().trim();
  const isSubmitted = $el.find(".submitted").length > 0;

  assignments.push({
    id: `${courseId}-${index}`,
    title,
    courseId,
    dueDate: parseDateString(dueDate),
    submissionStatus: isSubmitted ? "submitted" : "not_submitted",
    priority: calculatePriority(dueDate),
  });
});
```

### Frontend Receives JSON

```json
{
  "success": true,
  "data": [
    {
      "id": "101-0",
      "title": "Devoir Mathématiques",
      "course": "MAT101",
      "courseId": "101",
      "dueDate": "2026-03-25T23:59:00Z",
      "priority": "high",
      "submissionStatus": "submitted",
      "url": "https://moodle/.../view.php?id=123"
    }
  ],
  "cached": false,
  "timestamp": 1711228800000
}
```

---

## ⚠️ Known Limitations

### Current Limitations

- Sessions lost on backend restart (in-memory)
- HTML parsing fragile (breaks if Moodle UI changes)
- 5-minute cache (no real-time updates)
- No persistent session storage
- Basic error handling

### For Production

- [ ] Migrate to Redis for sessions
- [ ] Automated tests for HTML selectors
- [ ] Puppeteer fallback for complex pages
- [ ] Audit logging for security events
- [ ] HTTPS for local backend
- [ ] Rate limiting enhanced
- [ ] Monitoring & alerting

---

## 🆘 Troubleshooting

| Issue               | Cause                         | Solution                                   |
| ------------------- | ----------------------------- | ------------------------------------------ |
| "Login failed"      | Bad credentials or Moodle URL | Check .env, verify credentials             |
| CORS error          | Frontend port mismatch        | Verify VITE_BACKEND_URL is correct         |
| Empty assignments   | HTML selectors don't match    | Inspect real Moodle HTML, update selectors |
| Session 401 error   | Session expired (1h)          | Prompt user to log in again                |
| Backend won't start | Port 3001 in use              | `lsof -i :3001` and kill process           |
| TypeScript errors   | Missing types                 | Ensure `backend/tsconfig.json` exists      |

---

## 📊 Comparison: Plan A vs Plan B

| Aspect             | Plan A (API)            | Plan B (Scraping)        |
| ------------------ | ----------------------- | ------------------------ |
| **Source**         | Moodle Web Services API | Moodle HTML pages        |
| **Auth**           | OAuth/Token API         | Cookie-based session     |
| **Parsing**        | JSON native             | HTML + Cheerio           |
| **CORS**           | Blocked by university   | Bypassed via proxy       |
| **Fragility**      | Official → stable       | HTML-dependent → fragile |
| **Maintenance**    | API versioning          | Monitor UI changes       |
| **Implementation** | Simple REST             | Complex parsing          |

---

## 🎓 Design Patterns Used

1. **Proxy Pattern** : Express proxies all Moodle requests
2. **Session Pattern** : Server-side session storage (server-side sessions)
3. **Caching Pattern** : In-memory cache with TTL
4. **Adapter Pattern** : HTML → JSON conversion
5. **Single Responsibility** : Routes, scrapers, types separated

---

## ✅ Success Metrics

- [x] Architecture documented
- [x] Backend structure created
- [x] Frontend updated to use backend
- [x] All APIs defined
- [x] Security plan outlined
- [ ] Backend tests passing (next)
- [ ] Full integration tested (next)
- [ ] Production-ready (next)

---

## 📖 Documentation Index

| Document                     | Purpose               | Audience         |
| ---------------------------- | --------------------- | ---------------- |
| **QUICK_START_BACKEND.md**   | 5-min setup guide     | Developers       |
| **IMPLEMENTATION_PLAN.md**   | Detailed 6-phase plan | Project managers |
| **ADR-002-\*.md**            | Architecture decision | Stakeholders     |
| **PLAN_B_SUMMARY.md**        | Executive overview    | Leadership       |
| **ARCHITECTURE_OVERVIEW.md** | Technical reference   | Developers       |
| **backend/README.md**        | Backend docs          | Backend devs     |

---

## 🔗 Environment Setup

### Frontend (.env)

```
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (.env)

```
MOODLE_BASE_URL=https://moodle.universite.edu
PORT=3001
NODE_ENV=development
```

---

**Last Updated**: 23 mars 2026
**Status**: Plan B Ready for Implementation
**Next Step**: Follow QUICK_START_BACKEND.md to begin
