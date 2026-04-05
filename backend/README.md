# Moodle Scraper Backend

Local Express proxy for Moodle web scraping. This backend handles:

- Login simulation (POST credentials to Moodle)
- Cookie/session management
- HTML parsing with Cheerio
- Assignment extraction
- Course listing

## Architecture

```
React Frontend (localhost:5173)
         ↓ (HTTP JSON)
  Express Backend (localhost:3001)
         ↓ (HTTPS scraping)
  Moodle Server (university.edu)
```

## Setup

1. **Install dependencies**:

```bash
npm install
```

2. **Create `.env` file** (copy from `.env.example`):

```bash
cp .env.example .env
```

3. **Configure Moodle URL**:

```env
MOODLE_BASE_URL=https://your-moodle-instance.com
```

4. **Start development server**:

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Authentication

**POST `/api/auth/login`**

```json
{
  "username": "student123",
  "password": "securepassword"
}
```

Response:

```json
{
  "success": true,
  "userId": "12345",
  "username": "student123",
  "sessionId": "session_1234567890_abc123"
}
```

**POST `/api/auth/logout`**

```json
{
  "sessionId": "session_1234567890_abc123"
}
```

**GET `/api/auth/verify?sessionId=...`**
Verify if session is still valid.

### Data Retrieval

**GET `/api/assignments?sessionId=...`**
Fetch assignments with caching (5min TTL).

**GET `/api/assignments/courses?sessionId=...`**
Fetch list of courses.

**POST `/api/assignments/clear-cache`**
Clear cached assignments for a session.

## How It Works

### 1. Login Flow

1. Frontend sends username/password
2. Backend POSTs to Moodle `/login/index.php`
3. Extracts MoodleSession cookie from response
4. Stores cookies in memory
5. Verifies login by requesting `/my/index.php`
6. Returns sessionId to frontend

### 2. Assignment Scraping

1. Frontend requests assignments with sessionId
2. Backend uses stored cookies to request dashboard
3. Parses HTML with Cheerio
4. Extracts assignment blocks (title, course, due date, status)
5. Calculates priority based on due date
6. Caches results for 5 minutes
7. Returns JSON to frontend

### 3. HTML Parsing Strategy

- Uses Cheerio (jQuery-like API) for DOM manipulation
- Targets common Moodle selectors:
  - `[data-type="assign"]` - Assignment blocks
  - `[data-course-id]` - Course containers
  - `.activity-name` - Assignment titles
  - `.due`, `.duedate` - Due date elements

## Security Considerations

⚠️ **Important for Local Development Only**

### In Production, You MUST:

1. **Never use in-memory sessions** - Use Redis or persistent session store
2. **Never log credentials** - Current code only logs usernames
3. **Use HTTPS** - All requests must be encrypted
4. **Implement proper authentication** - Add JWT tokens, session signing
5. **Rate limit aggressively** - Protect against brute force
6. **Add CSRF protection** - Use tokens for POST requests
7. **Validate all HTML parsing** - Can fail on Moodle updates
8. **Implement retry logic** - Handle temporary failures gracefully

### Current Safeguards

- ✅ Credentials sanitized (remove `<>"'`)
- ✅ Basic rate limiting (5 attempts per 15min)
- ✅ Session IDs generated (not credentials)
- ✅ Cookies stored server-side (not sent to frontend)
- ✅ Input validation on username/password
- ✅ Graceful error handling
- ❌ **NOT encrypted** - for dev only
- ❌ **NOT persistent** - sessions lost on restart
- ❌ **NOT audit logged** - no security events

## Troubleshooting

### "Login failed: Invalid credentials"

- Check username/password
- Check MOODLE_BASE_URL is correct
- Verify Moodle server is accessible

### "Too many login attempts"

- Wait 15 minutes (rate limit window)
- Or clear loginAttempts in code

### "Failed to extract assignments"

- Moodle HTML structure may have changed
- Check browser DevTools to compare selectors
- Update cheerio selectors in `moodleScraper.ts`

### CORS errors on frontend

- Verify CORS middleware is enabled
- Check frontend URL in cors() config
- Ensure both services running on different ports

## Testing

```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test assignments (replace SESSION_ID)
curl http://localhost:3001/api/assignments?sessionId=SESSION_ID

# Health check
curl http://localhost:3001/health
```

## Development Mode

```bash
npm run dev
```

Uses `tsx` for TypeScript hot-reload. Changes to `.ts` files auto-restart server.

## Production Build

```bash
npm run build
npm start
```

Compiles TypeScript to `dist/` folder.

## Known Limitations

1. **Fragile HTML parsing** - Breaks when Moodle UI changes
2. **No real-time updates** - Cached for 5 minutes
3. **Single server instance** - Sessions lost on restart
4. **No database** - In-memory only
5. **Basic date parsing** - May fail on unusual formats

## Recommended Improvements

1. **Persistent Sessions** - Use Redis/PostgreSQL
2. **Better Parsing** - Reverse-engineer Moodle JSON APIs
3. **Queue System** - Use Bull for background scraping
4. **Error Monitoring** - Sentry/LogRocket integration
5. **Automated Tests** - Jest + Moodle sandbox testing
6. **Rate Limiting Pro** - express-rate-limit middleware
7. **Encryption** - Encrypt stored sessions
8. **Webhooks** - Notify frontend of new assignments

## Support

See main README.md for architecture decisions and overall strategy.
