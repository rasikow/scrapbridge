const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

  async function shot(name, fullPage = true) {
    await page.screenshot({ path: `/home/claude/work/marketplace/qa/${name}.png`, fullPage });
  }
  async function signOut() {
    await page.locator('header button').last().click();
    await page.waitForTimeout(200);
    await page.click('text=Sign out');
    await page.waitForURL('**/login', { timeout: 5000 });
  }

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Seller (approved)', exact: true }).click();
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/seller/dashboard', { timeout: 8000 });
  await page.waitForTimeout(1800); // let count-up animation finish
  await shot('seller-dashboard-full');
  console.log('SELLER DASHBOARD LOADED');

  // hero-only crop
  await page.screenshot({ path: '/home/claude/work/marketplace/qa/seller-dashboard-hero.png', clip: { x: 0, y: 0, width: 1440, height: 420 } });

  // mobile
  await page.setViewportSize({ width: 390, height: 1400 });
  await page.waitForTimeout(300);
  await shot('seller-dashboard-mobile');
  console.log('MOBILE OK');

  await page.setViewportSize({ width: 1440, height: 1200 });

  // regression: buyer + admin dashboards still fine, marketplace with real photos
  await signOut();
  await page.getByRole('button', { name: 'Buyer (approved)', exact: true }).click();
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/buyer/dashboard', { timeout: 8000 });
  await page.waitForTimeout(800);
  await shot('buyer-dashboard-regression');
  console.log('BUYER DASHBOARD REGRESSION OK');

  await page.goto('http://localhost:5173/buyer/marketplace', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await shot('marketplace-regression');
  console.log('MARKETPLACE REGRESSION OK');

  await signOut();
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/admin/dashboard', { timeout: 8000 });
  await page.waitForTimeout(800);
  await shot('admin-dashboard-regression');
  console.log('ADMIN DASHBOARD REGRESSION OK');

  console.log('JS ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})();
