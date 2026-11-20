'use strict';

/**
 * Browser checks for the interactive parts: the cycle explorer, the phase tabs,
 * the "Myth or fact?" game and the language switch.
 *
 * Run with `npm run test:e2e`. Needs Playwright with Chromium
 * (`npm install --no-save playwright && npx playwright install chromium`); the
 * checks are skipped when it is not installed, so `npm test` stays dependency-free.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  chromium = null;
}

const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

/** Serve the repository folder on a free local port. */
function startServer() {
  const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const isoDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString('en-CA');
};

test('interactive page', { skip: chromium ? false : 'Playwright is not installed' }, async (t) => {
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith(`http://127.0.0.1:${server.address().port}/`)) {
      problems.push(`request to another site: ${request.url()}`);
    }
  });
  t.after(async () => {
    await browser.close();
    server.close();
  });

  await page.goto(base, { waitUntil: 'networkidle' });
  const value = () => page.$eval('#day-slider', (el) => el.value);
  const openTab = () => page.$eval('[role="tab"][aria-selected="true"]', (el) => el.dataset.phase);
  const slide = (day) =>
    page.$eval('#day-slider', (el, d) => {
      el.value = String(d);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, day);

  await t.test('the slider moves the panel, the diagram and the open tab together', async () => {
    await slide(21);
    assert.match(await page.textContent('.today-title'), /day 21/i);
    assert.match(await page.textContent('#body-day'), /Day 21/);
    assert.equal(await openTab(), 'luteal');
    assert.equal(
      await page.$eval('#day-slider', (el) => el.getAttribute('aria-valuetext')),
      'Day 21 of 28: Luteal phase'
    );
  });

  await t.test('step buttons wrap round the cycle and the ring can be clicked', async () => {
    await slide(28);
    await page.click('#day-next');
    assert.equal(await value(), '1');
    const box = await page.locator('#wheel').boundingBox();
    await page.mouse.click(box.x + box.width * (254 / 300), box.y + box.height / 2);
    assert.ok(['7', '8'].includes(await value()), 'three o’clock is about a quarter of the way round');
  });

  await t.test('the chart and the tabs can be used from the keyboard', async () => {
    await page.click('#wheel-legend li[data-phase="follicular"] button');
    await page.focus('#hormone-chart');
    await page.keyboard.press('ArrowRight');
    assert.equal(await value(), '7');
    await page.click('#tab-ovulatory');
    assert.equal(await value(), '13', 'opening a tab moves the day into that phase');
    await page.keyboard.press('ArrowRight');
    assert.equal(await openTab(), 'luteal');
    assert.equal(await page.$eval('#phase-ovulatory', (el) => el.hidden), true);
  });

  await t.test('a full game can be played, and survives a language change', async () => {
    await page.click('[data-action="start"]');
    for (let card = 0; card < 10; card += 1) {
      await page.click(card % 2 ? '[data-answer="fact"]' : '[data-answer="myth"]');
      assert.ok(await page.$('.game-evidence .chip'), 'every answer shows its evidence label');
      if (card === 3) {
        await page.click('.lang-btn[data-lang="es"]');
        assert.match(await page.textContent('.game-label'), /Afirmación 4 de 10/);
      }
      await page.click('[data-action="next"]');
    }
    assert.match(await page.textContent('.game-result-title'), /de 10/);
    assert.equal(await page.$$eval('.game-recap li', (items) => items.length), 10);
    await page.click('.lang-btn[data-lang="en"]');
  });

  await t.test('every citation points at a listed source', async () => {
    const targets = await page.$$eval('sup.cite a', (links) => links.map((a) => a.getAttribute('href')));
    for (const href of new Set(targets)) {
      assert.ok(await page.$(href), `${href} exists`);
    }
    assert.equal(await page.$$eval('#source-list li', (items) => items.length), 30);
  });

  await t.test('entered dates select today and offer a way back to it', async () => {
    await page.fill('#last-start', isoDaysAgo(16));
    await page.click('button[type="submit"]');
    assert.equal(await value(), '17');
    await slide(24);
    assert.equal(await page.$eval('#back-today', (el) => el.hidden), false);
    assert.match(await page.textContent('.today-meta'), /Expected around/);
    await page.click('#back-today');
    assert.equal(await value(), '17');
  });

  await t.test('a link to a phase opens its tab', async () => {
    const linked = await context.newPage();
    await linked.goto(`${base}#phase-ovulatory`, { waitUntil: 'networkidle' });
    assert.equal(await linked.$eval('[role="tab"][aria-selected="true"]', (el) => el.dataset.phase), 'ovulatory');
    await linked.close();
  });

  await t.test('no console errors and no requests to other sites', () => {
    assert.deepEqual(problems, []);
  });
});
