# ADR-002: Web Scraping with Local Express Proxy Backend

## Status

Accepted (Plan B - API blocked)

## Context

The Moodle Web Services API is completely blocked by the university firewall. We need to pivot to web scraping while maintaining security and avoiding CORS issues in the browser. The solution must:

1. Scrape Moodle login and course data
2. Extract assignment/deadline information from HTML
3. Maintain session cookies for authenticated requests
4. Avoid CORS issues by proxying through a local backend
5. Never expose student credentials beyond the proxy layer
6. Handle rate limiting and responsible scraping

## Decision

Implement a **two-layer architecture**:

- **Layer 1 (Backend)**: Local Node.js/Express proxy that handles scraping, login, session management
- **Layer 2 (Frontend)**: React app calls the lightweight proxy instead of Moodle directly

## Why This Approach

### ✅ Advantages

- Bypasses university firewall/API blocks
- No CORS issues (React → Express = same origin)
- Session/cookie management server-side
- Can add caching, rate limiting, error recovery
- Credentials never exposed to browser
- Works with any Moodle version (scrapes HTML)

### ⚠️ Trade-offs

- Requires running local backend service
- More fragile than API (HTML parsing breaks on page changes)
- Requires responsible rate limiting
- Higher maintenance (changes to Moodle UI = code updates)

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Student Browser                        │
│  ┌────────────────────────────────────────────┐ │
│  │    React Frontend (Vite)                    │ │
│  │    - Login form UI                          │ │
│  │    - Dashboard display                      │ │
│  │    - Calls http://localhost:3000/api/*     │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                      │
          (JSON requests, HTTP)
                      ↓
┌─────────────────────────────────────────────────┐
│    Local Backend (Express microservice)          │
│    Running on http://localhost:3001              │
│  ┌────────────────────────────────────────────┐ │
│  │  Routes:                                    │ │
│  │  POST /api/auth/login                       │ │
│  │  GET /api/assignments                       │ │
│  │  GET /api/courses                           │ │
│  │  POST /api/auth/logout                      │ │
│  │                                             │ │
│  │  Internal Logic:                            │ │
│  │  - axios for HTTP requests                 │ │
│  │  - cookie-jar for session management       │ │
│  │  - cheerio for HTML parsing                │ │
│  │  - In-memory session store (initially)      │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                      │
          (HTTPS to Moodle server)
                      ↓
┌─────────────────────────────────────────────────┐
│    Moodle Instance (University Server)           │
│    https://moodle.universite.edu                │
└─────────────────────────────────────────────────┘
```

## Technical Stack

| Layer        | Technology                   | Purpose                           |
| ------------ | ---------------------------- | --------------------------------- |
| Frontend     | React 19 + Vite              | UI, state management              |
| Backend HTTP | Express.js                   | Router, middleware, API endpoints |
| Scraping     | axios                        | HTTP requests with cookies        |
| Sessions     | cookie-jar + express-session | Manage Moodle cookies             |
| HTML Parsing | cheerio                      | jQuery-like DOM manipulation      |
| Validation   | joi/zod                      | Input validation                  |

## Implementation Phases

### Phase 1: Backend Setup

1. Create Express microservice in `/backend` folder
2. Install dependencies
3. Implement basic authentication route
4. Test login flow with Moodle

### Phase 2: HTML Parsing

1. Identify Moodle HTML structure for courses/assignments
2. Implement Cheerio parsers
3. Map HTML elements to data types
4. Test parsing accuracy

### Phase 3: Session Management

1. Store cookies from login response
2. Reuse cookies for subsequent requests
3. Handle session expiration
4. Implement logout

### Phase 4: Frontend Integration

1. Update React to call backend instead of direct API
2. Handle backend errors gracefully
3. Loading states and offline fallbacks
4. Environment configuration

### Phase 5: Security & Hardening

1. Input validation (sanitize credentials)
2. Rate limiting on backend
3. HTTPS for local backend (optional but recommended)
4. Credential encryption in backend memory
5. Logs without sensitive data

### Phase 6: Production Readiness

1. Environment variables for Moodle URL
2. Proper error handling
3. Unit tests for parsers
4. Integration tests with Moodle sandbox
5. Documentation

## Responsible Scraping Guidelines

1. **Rate Limiting**: Add delays between requests (1-2 seconds)
2. **User-Agent**: Identify as legitimate client
3. **Respect Robots.txt**: Check `/robots.txt`
4. **Cache Results**: Don't request same data repeatedly
5. **Handle Errors**: Gracefully degrade on changes

## Risks & Mitigation

| Risk                      | Mitigation                                        |
| ------------------------- | ------------------------------------------------- |
| HTML structure changes    | Automated tests on Moodle changes, fuzzy matching |
| Account lockout           | Rate limiting, exponential backoff                |
| Session timeout           | Auto-refresh, handle 403 responses                |
| Credentials exposed       | Never log them, encrypt in memory, HTTPS          |
| Too many requests         | Cache results (Redis-like), batch requests        |
| University blocks backend | Use VPN, proxy, or reverse proxy                  |

## Success Criteria

- ✅ Login without API (cookie-based)
- ✅ Extract 3+ assignment fields (title, duedate, status)
- ✅ Parse 3+ courses from dashboard
- ✅ React app displays real Moodle data
- ✅ No CORS errors
- ✅ Zero credentials in browser memory
- ✅ <2s response time per request

## Next Steps

1. **Backend Initialization**: Create Express server structure
2. **Scraping Development**: Test login + course extraction locally
3. **Parser Testing**: Validate HTML parsing against real Moodle
4. **Integration**: Wire React frontend to backend
5. **Security Audit**: Review credential handling

## Notes

- This approach is **fragile by design** - HTML changes require code updates
- **Preferred solution remains direct API** if university can whitelist
- **Consider** asking IT to enable Web Services API as long-term solution
- **Backup**: Can migrate to Puppeteer/Playwright if simple HTTP fails

---

**Decision Made**: Proceed with Express proxy + Cheerio scraping for immediate unblocking
**Reviewer**: Pentester audit pending
**Date**: 23 mars 2026
