// link_check.js
const { chromium } = require('playwright');
require('dotenv').config();

async function checkLink() {
  console.log('--- LINK PHASE: Connectivity & Handshake ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const targetUrl = process.env.BASE_URL;
  console.log(`Navigating to: ${targetUrl}`);

  try {
    const startTime = Date.now();
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const latency = Date.now() - startTime;

    if (response && response.status() === 200) {
      console.log(`[PASS] URL Accessible. Status: 200. Latency: ${latency}ms`);
    } else {
      console.log(`[FAIL] URL not accessible. Status: ${response ? response.status() : 'No Response'}`);
      process.exit(1);
    }

    // Check selectors
    const userField = await page.$(process.env.SELECTOR_USERNAME);
    const passField = await page.$(process.env.SELECTOR_PASSWORD);
    const loginBtn = await page.$(process.env.SELECTOR_LOGIN_BTN);

    if (userField && passField && loginBtn) {
      console.log('[PASS] All login page selectors found.');
    } else {
      console.log('[FAIL] Some selectors are missing:');
      console.log(`- Username: ${!!userField}`);
      console.log(`- Password: ${!!passField}`);
      console.log(`- Login Button: ${!!loginBtn}`);
      process.exit(1);
    }

    console.log('--- LINK PHASE: SUCCESS ---');
  } catch (err) {
    console.error(`[ERROR] Link check failed: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkLink();
