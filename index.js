const { chromium } = require('@playwright/test');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const BACKUP_TASK = 'Worked on assigned internship tasks.';

async function getTodayTask() {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    await doc.useServiceAccountAuth(
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
    );
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['daily'];
    const rows = await sheet.getRows();

    const today = new Date().toISOString().split('T')[0];
    const row = rows.find(r => r.date === today);

    if (!row || !row.tasks) return BACKUP_TASK;
    return row.tasks;
  } catch (err) {
    console.error('Sheet error, using backup:', err.message);
    return BACKUP_TASK;
  }
}

(async () => {
  const taskText = await getTodayTask();

  const finalText = `
📋 Tasks completed today :
${taskText}

⚡ Challenges encountered and how you overcame them
• Faced no difficulty

🚧 Blockers faced (challenges that you couldn't overcome)
• No blockers faced
`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Open website
  await page.goto('https://kalvium.community/internships', {
    waitUntil: 'networkidle'
  });

  // 2. Login
  await page.fill('input[type="email"]', process.env.USERNAME);
  await page.fill('input[type="password"]', process.env.PASSWORD);
  await page.click('button:has-text("Login")');

  // 3. Go to submit form
  await page.waitForSelector('text=Submit Form');
  await page.click('text=Submit Form');

  // 4. Select first dropdown option
  await page.waitForSelector('select');
  await page.selectOption('select', { index: 0 });

  // 5. Replace textarea content
  await page.waitForSelector('textarea');
  await page.fill('textarea', finalText);

  // 6. Submit
  await page.click('button:has-text("Submit")');

  await browser.close();
})();
