# ADR-003: Authentication Method for Moodle Scraping

## Status

Accepted

## Context

The Moodle scraper initially attempted direct form-based login, but the target Moodle instance (https://moodle.univ-artois.fr) uses Central Authentication Service (CAS) SSO. Additionally, the Moodle Web Services API is blocked by the university.

When attempting direct login, users encounter redirects to the CAS login page (https://sso.univ-artois.fr/cas/login), causing authentication to fail with "Invalid credentials or server error".

## Problem

- Direct HTTP login fails due to CAS redirects
- API access is blocked by university policy
- Users cannot authenticate to their Moodle instance

## Constraints

- Scale: Single university instance (~10K-50K users)
- Team: Solo developer
- Budget: Free/open-source
- Security: Must handle credentials securely
- Reliability: Authentication must be robust
- API: Blocked by university

## Options Considered

### Option 1: Implement CAS Client

- **Description**: Add CAS protocol support to handle SAML authentication flow
- **Pros**: Native integration, no external dependencies for auth
- **Cons**: Complex implementation (SAML parsing, ticket validation), high maintenance
- **Effort**: High (2-3 weeks)
- **Risk**: Medium (CAS versions vary)

### Option 2: Browser Automation (Puppeteer)

- **Description**: Use headless browser to simulate full login flow including CAS redirects
- **Pros**: Handles any authentication method, reliable for complex flows, works with blocked API
- **Cons**: Higher resource usage, slower performance, additional dependencies
- **Effort**: Medium (1 week)
- **Risk**: Low (proven technology)

### Option 3: Moodle Web Services API

- **Description**: Use official Moodle API if enabled
- **Pros**: Most reliable, secure, performant, future-proof
- **Cons**: Blocked by university, requires admin enablement
- **Effort**: Low (few days)
- **Risk**: N/A (blocked)

## Decision

**Use browser automation with Puppeteer** for authentication and scraping.

**Rationale**: API is blocked, direct HTTP fails on CAS, browser automation provides the most reliable solution for complex authentication flows.

## Consequences

- **Positive**: Robust authentication handling any SSO method, works with current constraints
- **Negative**: Increased resource usage and response time, additional dependency
- **Mitigation**: Optimize browser launch settings, implement connection pooling if needed

## Implementation Plan

1. Add Puppeteer dependency
2. Implement browser-based login flow
3. Extract cookies after successful authentication
4. Use cookies for subsequent HTTP requests
5. Add error handling for browser failures
6. Test with CAS authentication

## Related ADRs

- ADR-002: Web Scraping with Express Proxy
