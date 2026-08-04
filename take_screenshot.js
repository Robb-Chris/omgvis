const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/Chris/.gemini/antigravity-ide/brain/c8c5ca08-fedf-48dc-8510-98b06a0be6fc/screenshot.png' });
    console.log('SCREENSHOT_SUCCESS');
    await browser.close();
  } catch (err) {
    console.error('SCREENSHOT_ERROR:', err);
    process.exit(1);
  }
})();
