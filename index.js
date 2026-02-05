const { chromium } = require('@playwright/test');

const BACKUP_TASK = `
📋 Tasks completed today :
• Worked on testcase automation tasks.

⚡ Challenges encountered and how you overcame them
• Faced no Challenges

🚧 Blockers faced (challenges that you couldn't overcome)
• No blockers faced
`.trim();

(async () => {
  const finalText = BACKUP_TASK;

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    storageState: process.env.AUTH_STATE
      ? JSON.parse(process.env.AUTH_STATE)
      : undefined
  });

  const page = await context.newPage();

  await page.goto('https://kalvium.community/internships', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(3000);

  await page.click('text=Complete');
  await page.click('button[role="combobox"]');
  await page.waitForSelector('[role="option"]');
  await page.locator('[role="option"]').first().click();

  const editor = page.locator('div[contenteditable="true"]').first();
  await editor.waitFor({ timeout: 10000 });
  await editor.click();
  await editor.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await editor.type(finalText, { delay: 5 });

  // Force TipTap update
  await editor.press('Enter');
  await page.waitForTimeout(500);

  // Scroll modal
  await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (modal) modal.scrollTop = modal.scrollHeight;
  });

  // Submit
  const submitBtn = page.locator('button[type="submit"]:has-text("Submit")');
  await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
  await submitBtn.click();

  // Confirm submission
  await page.waitForSelector(
    'button[type="submit"]:has-text("Submit")',
    { state: 'detached', timeout: 10000 }
  );

  // Allow network to finish
  await page.waitForTimeout(2000);
  await browser.close();
})();
