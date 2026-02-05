const { chromium } = require('@playwright/test');

/* ✅ Static data only */
const BACKUP_TASK = `
📋 Tasks completed today :
• Worked on assigned tasks.
• Attended standup

⚡ Challenges encountered and how you overcame them
• Faced no difficulty

🚧 Blockers faced (challenges that you couldn't overcome)
• No blockers faced
`.trim();

(async () => {
  // ✅ Directly use static text (no Google Sheets)
  const finalText = BACKUP_TASK;

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    storageState: JSON.parse(process.env.AUTH_STATE)
  });

  const page = await context.newPage();

  await page.goto('https://kalvium.community/internships', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(3000);

  await page.click('text=Complete');
  await page.click('button[role="combobox"]');
  await page.waitForSelector('[role="option"]');

  // Select first dropdown option
  await page.locator('[role="option"]').first().click();

  // ===== EDITOR PART (UNCHANGED) =====
  const editor = page.locator('div[contenteditable="true"]').first();

  await editor.waitFor({ timeout: 10000 });
  await editor.click();

  await editor.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A'
  );

  await editor.type(finalText, { delay: 5 });
  // ==================================

// Wait a bit to ensure editor updates are registered
await page.waitForTimeout(1000);

// Click Submit
// const submitBtn = page.locator('button[type="submit"]:has-text("Submit")');
// await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
// await submitBtn.click();

  await browser.close();
})();
