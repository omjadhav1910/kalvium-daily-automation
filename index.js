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

  try {
    await page.goto('https://kalvium.community/internships', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(5000); // Give it some extra time to load

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if we got redirected to a login page (session expired)
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (currentUrl.includes('login') || bodyText.includes('Continue with Google') || bodyText.includes('Sign in')) {
      throw new Error('❌ Session expired! You have been redirected to the login page. Please run "node login.js" locally and update the AUTH_STATE secret in GitHub.');
    }

    // Try finding the 'Complete' button, or fallback locators
    const possibleLocators = [
      'text="Complete"',
      'button:has-text("Complete")',
      'text="Add Report"',
      'text="Submit Report"',
      'text="Daily Report"'
    ];

    let clicked = false;
    for (const selector of possibleLocators) {
      const el = page.locator(selector).first();
      try {
        if (await el.isVisible({ timeout: 2000 })) {
          console.log(`Found and clicking element: ${selector}`);
          await el.click();
          clicked = true;
          break;
        }
      } catch (e) { }
    }

    if (!clicked) {
      console.log('Could not find known buttons. Trying original "text=Complete" just in case...');
      await page.click('text=Complete', { timeout: 10000 });
    }

    await page.waitForTimeout(2000);
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
    console.log('✅ Successfully submitted the daily report!');
  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    // Take a screenshot of the page where it failed
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Saved error screenshot to error-screenshot.png');
    
    // Dump some page text to the console to help debug if UI changed
    const textSnippet = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('📄 Page content snippet:\n', textSnippet);
    
    throw error;
  } finally {
    await browser.close();
  }
})();
