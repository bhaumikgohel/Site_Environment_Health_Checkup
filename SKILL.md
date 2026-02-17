---
name: checking-qa-environment-health
description: Performs automated environment health checks before QA execution. Validates URL accessibility, login flows, API responsiveness, database connectivity, and browser console errors. Use when a Test Manager or QA engineer needs to verify system readiness before starting a test cycle.
---

# Checking QA Environment Health

As a Test Manager with 10+ years of experience, a "Go/No-Go" decision depends on the environment's health. This skill automates the critical checks required before any QA execution begins, ensuring that the team doesn't waste time on a broken environment.

## When to use this skill
- Before starting a new regression cycle.
- After a fresh deployment to QA/Staging.
- When the testing team reports "environment down" issues.
- As part of a daily sanity check.

## Workflow
1. **Identify Target Environment**: Obtain the base URL, login credentials, and API endpoints.
2. **Pre-Check Validation**: Verify basic connectivity (HTTP 200) within strict timeouts.
3. **Deep Health Check**: Execute the automated script to check login flows and console errors.
4. **Integration Check**: Verify Backend APIs and Database connectivity.
5. **Report Generation**: Provide a summary of "Healthy" vs "Blocked" status.

## Checklists
- [ ] Application URL returns 200 OK within 5 seconds.
- [ ] Login page loads without critical console errors.
- [ ] Successful login with valid credentials.
- [ ] Proper error handling for invalid credentials.
- [ ] Backend APIs respond within 3 seconds (Success) or are flagged if over 5 seconds.
- [ ] Database connection is active (via health-check endpoint or direct ping).

## Instructions

### 1. Environment Readiness Script (Playwright)
Use the following Playwright script pattern to perform browser-based checks.

```javascript
// health_check.js
const { chromium } = require('playwright');

async function checkHealth(config) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // 1. URL Accessibility
    const startTime = Date.now();
    const response = await page.goto(config.url, { timeout: 5000 });
    const latency = Date.now() - startTime;

    if (response.status() !== 200) throw new Error(`Status ${response.status()}`);
    if (latency > 5000) throw new Error(`Latency exceeded 5s: ${latency}ms`);

    // 2. Login Check (Invalid)
    await page.fill(config.selectors.username, 'invalid_user');
    await page.fill(config.selectors.password, 'wrong_pass');
    await page.click(config.selectors.loginButton);
    // Add logic to verify error message appears

    // 3. Login Check (Valid)
    await page.fill(config.selectors.username, config.credentials.username);
    await page.fill(config.selectors.password, config.credentials.password);
    await page.click(config.selectors.loginButton);
    await page.waitForURL(config.postLoginUrl, { timeout: 5000 });

    console.log('Environment Health: PASSED');
  } catch (err) {
    console.error('Environment Health: FAILED', err.message);
  } finally {
    await browser.close();
  }
}
```

### 2. API & Database Validation
Ensure API checks follow these latency rules:
- **Pass**: <= 3 seconds.
- **Fail/Warning**: >= 5 seconds.

### 3. Reporting Format
Always provide a structured table:
| Check | Status | Latency | Notes |
|-------|--------|---------|-------|
| UI URL | ✅ | 1.2s | 200 OK |
| Login | ✅ | 2.5s | Valid/Invalid scenarios passed |
| Backend API | ⚠️ | 5.2s | Slow response |
| Database | ✅ | - | Connected |
| Console | ✅ | - | No critical errors |

## Resources
- [Example Config](examples/config.example.json)
- [Selenium Java Template](resources/selenium_template.java)
- [Playwright Health Script](scripts/check_health.js)
