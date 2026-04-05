# Deployment Checklist : Plan B Implementation

## ✅ Pre-Implementation (What's Done)

- [x] Architecture designed (ADR-002)
- [x] Backend project structure created
  - [x] Express server boilerplate
  - [x] TypeScript configuration
  - [x] Routes (auth + assignments)
  - [x] Web scraper class (Cheerio)
  - [x] Session management
  - [x] Error handling & rate limiting
- [x] Frontend updated to use backend proxy
  - [x] moodleService.ts refactored
  - [x] App.tsx updated for sessionId
  - [x] Type definitions aligned
- [x] Documentation complete
  - [x] ADR for decision tracking
  - [x] 6-phase implementation plan
  - [x] Quick start guide
  - [x] Architecture overview
  - [x] This checklist

---

## 🔧 Phase 1: Local Development Setup (30 min)

### Backend Installation

- [ ] `cd backend && npm install`
- [ ] Verify no install errors
- [ ] Check node_modules created

### Environment Configuration

- [ ] Copy `.env.example` → `.env`
- [ ] Set `MOODLE_BASE_URL=https://your-instance.edu`
- [ ] Verify URL is accessible from your machine

### Server Launch

- [ ] `npm run dev` in backend folder
- [ ] Verify: "🎓 Moodle Scraper Backend running on http://localhost:3001"
- [ ] Check no port conflicts (if 3001 taken, adjust)

### Frontend Verification

- [ ] Verify `src/.env` has `VITE_BACKEND_URL=http://localhost:3001`
- [ ] Frontend already updated, no changes needed

---

## 🧪 Phase 2: Manual Testing (30 min)

### Test 1: Backend Health

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","moodleUrl":"..."}
```

- [ ] Health endpoint responds

### Test 2: Login Endpoint

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_LOGIN","password":"YOUR_PASS"}'
```

- [ ] Returns 200 OK
- [ ] Response has `sessionId` field
- [ ] No CORS errors

### Test 3: Assignments Fetch

```bash
# Use SESSION_ID from Test 2
curl 'http://localhost:3001/api/assignments?sessionId=SESSION_ID'
```

- [ ] Returns 200 OK
- [ ] Response has `data` array
- [ ] Can see assignment objects

### Test 4: Session Verification

```bash
curl 'http://localhost:3001/api/auth/verify?sessionId=SESSION_ID'
```

- [ ] Returns valid: true
- [ ] Shows user info

---

## 🎨 Phase 3: Frontend Integration (30 min)

### Start Local Servers

- [ ] Backend running: `npm run dev` (port 3001)
- [ ] Frontend running: `npm run dev` (port 5173)

### Test Login UI

- [ ] Open http://localhost:5173
- [ ] See login form visible
- [ ] Enter credentials from Phase 2 Test 2

### Verify Login Works

- [ ] Click "Se connecter"
- [ ] No CORS errors in DevTools
- [ ] Dashboard appears after login
- [ ] "Urgences" section loads
- [ ] Assignments display with real data

### Test Data Display

- [ ] Assignments sorted by due date
- [ ] Priority colors correct (high=red, medium=yellow, low=green)
- [ ] Course names showing
- [ ] Due dates formatted correctly

### Test Error Handling

- [ ] Try wrong password → error message
- [ ] Try again after 5 failures → rate limit message
- [ ] Close browser, reopen → must login again

---

## 🔐 Phase 4: Security Review (30 min)

### Frontend Security

- [ ] No credentials in localStorage
- [ ] No passwords logged to console
- [ ] sessionId stored in React state (cleared on logout)
- [ ] Network tab shows no password being sent to Moodle

### Backend Security

- [ ] Check `auth.ts`: credentials not logged
- [ ] Check rate limiting works (5 attempts/15min)
- [ ] Check `scraper.ts`: input sanitization applied
- [ ] Check error messages don't leak credentials

### CORS & Network

- [ ] No CORS headers errors
- [ ] Backend responds with correct CORS headers
- [ ] HTTPS ready (locally OK with HTTP)

---

## 📝 Phase 5: Documentation & Deployment Notes (15 min)

### Document Your Setup

- [ ] Note actual Moodle URL used
- [ ] Document any HTML selector customizations
- [ ] Record test user credentials (securely, not in repo!)
- [ ] Note any issues encountered

### Prepare for Distribution

- [ ] Create local `.gitignore` entries:
  ```
  backend/.env
  backend/node_modules/
  .env
  node_modules/
  ```
- [ ] Ensure `.env.example` files are committed (no secrets!)
- [ ] Add setup instructions to main README.md

---

## 🚀 Phase 6: Production Preparation (2-4 hours)

### Before Going Live

#### Session Persistence

- [ ] Install Redis locally: `brew install redis` (Mac) or equivalent
- [ ] Update backend to use Redis instead of in-memory
- [ ] Update `.env` with Redis URL

#### HTTPS Setup

- [ ] Generate self-signed cert (local dev):
  ```bash
  openssl req -x509 -newkey rsa:2048 -nodes \
    -out cert.pem -keyout key.pem -days 365
  ```
- [ ] Update `backend/server.ts` to use HTTPS
- [ ] Update `VITE_BACKEND_URL` to `https://localhost:3001`

#### Database & Logging

- [ ] Set up PostgreSQL for audit logs
- [ ] Add Sentry/LogRocket integration
- [ ] Configure error monitoring

#### Testing

- [ ] Write Jest tests for HTML parsers
- [ ] Test edge cases (missing fields, format variations)
- [ ] Load test with multiple concurrent users
- [ ] Test fallback when Moodle HTML changes

#### Monitoring

- [ ] Add health check endpoint dashboards
- [ ] Set up alerts for failed logins
- [ ] Monitor upload/download bandwidth
- [ ] Track parsing failures

---

## 📋 Final Verification Checklist

### Functional

- [ ] login endpoint returns sessionId
- [ ] assignments endpoint returns real data
- [ ] Frontend displays assignments
- [ ] Rate limiting prevents brute force
- [ ] Error messages helpful & secure

### Technical

- [ ] Backend compiles (npm run build)
- [ ] Frontend builds (npm run build)
- [ ] No TypeScript errors
- [ ] No console errors in DevTools
- [ ] No warnings in terminal

### Security

- [ ] Credentials never leave backend
- [ ] sessionId is anonymous token
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation working

### Documentation

- [ ] README.md updated
- [ ] Architecture documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide provided
- [ ] All files properly commented

---

## 🎯 Go/No-Go Decision

### Green Light If:

- ✅ All Phase 1-3 tests pass
- ✅ No security issues found
- ✅ Frontend displays real Moodle data
- ✅ Rate limiting working
- ✅ Error handling graceful

### Red Light If:

- ❌ HTML parsing returns empty
- ❌ CORS errors persist
- ❌ Rate limiting bypassable
- ❌ Credentials exposed in any way
- ❌ Documentation incomplete

---

## 📞 Support & Escalation

### If Login Fails

1. Check Moodle URL in `.env`
2. Verify credentials manually in browser
3. Check network tab for actual error
4. Enable debug logging in `moodleScraper.ts`

### If Parsing Fails

1. Visit Moodle in browser
2. Inspect HTML structure
3. Compare with Cheerio selectors
4. Add `console.log()` in parser

### If CORS Issues

1. Check Express CORS middleware
2. Verify frontend URL in cors() config
3. Check X-Requested-With headers
4. Try preflight request with OPTIONS

### If Rate Limiting Blocks

1. Check `loginAttempts` Map in auth.ts
2. Clear it or wait 15 minutes
3. In production, use Redis to track across servers

---

## 🎓 Next Steps After Go-Live

1. **Monitor** : Track error rates & performance
2. **Iterate** : Improve HTML parser selectors
3. **Scale** : Add Redis, persistent storage
4. **Extend** : Add grades, file uploads, notifications
5. **Integrate** : Connect to student portal

---

**Checklist Created**: 23 mars 2026
**Status**: Ready for Phase 1
**Estimated Total Time**: 4-6 hours
**Last Review**: [Your name here]
