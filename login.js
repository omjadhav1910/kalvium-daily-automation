const { chromium } = require('@playwright/test');
const readline = require('readline');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://kalvium.community/internships');

  console.log('👉 Click "Continue with Google"');
  console.log('👉 Select sahil.kharatmol@kalvium.community');
  console.log('👉 WAIT until you see the Kalvium page');
  console.log('👉 THEN press ENTER here');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise(resolve => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });

  await context.storageState({ path: 'auth.json' });
  console.log('✅ auth.json saved AFTER full login');

  await browser.close();
})();
