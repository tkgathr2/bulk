import { chromium } from 'playwright';
import { readdirSync, mkdirSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mockupsDir = resolve(__dirname, '..', 'mockups');
const screenshotsDir = resolve(mockupsDir, 'screenshots');

mkdirSync(screenshotsDir, { recursive: true });

const htmlFiles = readdirSync(mockupsDir)
  .filter(f => f.endsWith('.html'))
  .sort();

console.log(`Found ${htmlFiles.length} HTML files:`, htmlFiles);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'ja-JP',
});

for (const file of htmlFiles) {
  const name = basename(file, extname(file));
  const filePath = resolve(mockupsDir, file);
  const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
  const outputPath = resolve(screenshotsDir, `${name}.png`);

  console.log(`Capturing: ${file} -> screenshots/${name}.png`);

  const page = await context.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, fullPage: true });
  await page.close();
}

await browser.close();
console.log('Done! All screenshots saved to mockups/screenshots/');
