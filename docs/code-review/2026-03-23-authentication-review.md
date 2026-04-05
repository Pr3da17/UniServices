# Code Review: Authentication and Request Handling

**Ready for Production**: No (Mock implementation, requires real backend integration)
**Critical Issues**: 3

## Priority 1 (Must Fix) ⛔

- **Broken Access Control (A01)**: Token generation is predictable and client-side only. Replace with server-generated JWT with expiration. Current mock token `btoa(JSON.stringify(payload))` is insecure.
- **Cryptographic Failures (A02)**: No salting in password hash. Add salt (e.g., PBKDF2) for stronger hashing. Token lacks encryption/signing.
- **Identification Failures (A07)**: No rate limiting on login attempts. Added client-side rate limiting (5 attempts, 5min lock), but server-side required for production.

## Priority 2 (Should Fix) ⚠️

- **Injection Risks (A03)**: Inputs not sanitized. Added basic sanitization for username (remove <>"'). For real API, use parameterized queries.
- **Storage Security**: Token in React state only (good), but if persisting, use httpOnly cookies, not localStorage. Avoid localStorage for sensitive data.
- **CSRF Protection**: No HTTP requests yet, but when adding fetch, implement CSRF tokens or SameSite cookies.

## Recommended Changes

- Integrate real Moodle API with secure proxy/backend to handle auth server-side.
- Use HTTPS everywhere.
- Add MFA for student accounts.
- Log security events (failed logins) without sensitive data.
- Implement session management with automatic logout on inactivity.

## Security Fixes Applied

- Added token expiration check in `getUpcomingAssignments`.
- Sanitized username input in `loginMoodle`.
- Implemented client-side rate limiting in `App.tsx`.
