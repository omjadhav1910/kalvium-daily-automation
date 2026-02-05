const { chromium } = require('@playwright/test');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const BACKUP_TASK = 'Worked on assigned internship tasks.';

async function getTodayTask() {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['daily'];
    const rows = await sheet.getRows();

    const today = new Date().toISOString().split('T')[0];
    const row = rows.find(r => r.date === today);

    if (!row || !row.tasks) return BACKUP_TASK;
    return row.tasks;
  } catch {
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

  const context = await browser.newContext({
    storageState: JSON.parse(process.env.AUTH_STATE)
  });

  const page = await context.newPage();

  await page.goto('https://kalvium.community/internships', {
    waitUntil: 'networkidle'
  });

  await page.click('text=Submit Form');
  await page.selectOption('select', { index: 0 });
  await page.fill('textarea', finalText);
  await page.click('button:has-text("Submit")');

  await browser.close();
})();
