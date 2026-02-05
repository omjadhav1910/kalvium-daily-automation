const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://kalvium.community/internships');

  console.log('👉 Login manually using Google...');
  console.log('👉 Select sahil.kharatmol@kalvium.community');

  // Wait until user is logged in and redirected
  await page.waitForURL('**/internships**', { timeout: 0 });

  // Save login session
  await context.storageState({ path: 'auth.json' });

  console.log('✅ Login session saved as auth.json');
  await browser.close();
})();
