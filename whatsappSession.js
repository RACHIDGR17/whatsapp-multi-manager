const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // not headless so you can see it
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://web.whatsapp.com');
  // Wait for user to scan QR code manually
  // Keep the browser open
})();

