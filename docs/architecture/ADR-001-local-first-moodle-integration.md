# ADR-001: Local-First Moodle Data Integration

## Status

**Superseded by ADR-002** - Web Services API blocked by university firewall

## Context

We need to connect our React frontend to real Moodle data without compromising student credentials. The system must be local-first, meaning all authentication and data fetching happens client-side in the browser, never touching our servers.

Key constraints:

- No server-side processing of credentials
- Must work with standard Moodle installations
- Simple, robust architecture
- Security-first approach

## Decision

Implement client-side integration using Moodle's Web Services API with local token storage and RxDB for offline capabilities.

## Options Considered

### Option 1: Direct API Calls (Chosen)

- Use fetch/axios to call Moodle Web Services directly from browser
- Handle CORS with proxy if needed
- Store tokens in IndexedDB via RxDB
- Pros: Simple, direct, no intermediate servers
- Cons: CORS issues possible, rate limiting

### Option 2: Web Scraping

- Use Playwright/Puppeteer in browser context
- Scrape Moodle pages after login simulation
- Pros: Bypasses API limitations
- Cons: Fragile, complex, security risks

### Option 3: Backend Proxy

- Create a proxy server that forwards requests
- Pros: Handles CORS, can cache
- Cons: Violates local-first principle, adds complexity

## Implementation Plan

### Phase 1: API Exploration

- Document Moodle Web Services endpoints
- Test authentication flow
- Identify required permissions

### Phase 2: Client-Side Auth

- Implement login form → token acquisition
- Store token securely in IndexedDB
- Handle token refresh/expiration

### Phase 3: Data Fetching

- Fetch assignments, courses, grades
- Implement caching with RxDB
- Handle offline scenarios

### Phase 4: Security Hardening

- Input validation and sanitization
- Rate limiting client-side
- Secure token storage

## Consequences

### Positive

- True local-first architecture
- No credential exposure
- Works with any Moodle instance
- Offline capabilities via RxDB

### Negative

- Dependent on Moodle API availability
- CORS challenges
- Limited by browser security model

### Risks

- Moodle API changes break integration
- CORS blocking requires workarounds
- Browser storage limits

## Libraries

- axios: HTTP client
- rxdb: Local database with sync
- @moodle-api/client: Moodle API wrapper (if available)

## Next Steps

1. Research Moodle Web Services documentation
2. Test API access with demo credentials
3. Implement basic auth flow
4. Add RxDB for local storage
