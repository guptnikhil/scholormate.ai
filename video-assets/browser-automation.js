/**
 * browser-automation.js
 * Programmatically drives a Chromium 1080p browser instance to execute
 * the ScholarMate AI user journey and records HD video.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const RECORDINGS_DIR = path.join(__dirname, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Simple local static file server to ensure the web app is always available
function startLocalServer(port = 5500) {
  const rootDir = path.resolve(__dirname, '..');
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(rootDir, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`🌐 Local static server listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// Injects a sleek visual pointer to illustrate human clicks and mouse motion
async function injectVisualCursor(page) {
  await page.addStyleTag({
    content: `
      #v-cursor {
        position: fixed;
        width: 24px;
        height: 24px;
        background: rgba(37, 99, 235, 0.85);
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1), background-color 0.15s ease, width 0.15s ease, height 0.15s ease;
      }
      #v-cursor.is-clicked {
        transform: translate(-50%, -50%) scale(0.7);
        background: rgba(22, 163, 74, 0.95);
      }
    `
  });

  await page.evaluate(() => {
    if (!document.getElementById('v-cursor')) {
      const c = document.createElement('div');
      c.id = 'v-cursor';
      c.style.left = '960px';
      c.style.top = '540px';
      document.body.appendChild(c);
    }
  });
}

async function moveCursor(page, x, y, duration = 600) {
  try {
    await page.evaluate(({ targetX, targetY, dur }) => {
      const c = document.getElementById('v-cursor');
      if (!c) return;
      const startX = parseFloat(c.style.left) || 960;
      const startY = parseFloat(c.style.top) || 540;
      const startTime = performance.now();

      function step(now) {
        const progress = Math.min((now - startTime) / dur, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        c.style.left = (startX + (targetX - startX) * ease) + 'px';
        c.style.top = (startY + (targetY - startY) * ease) + 'px';
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { targetX: x, targetY: y, dur: duration });
    await page.waitForTimeout(duration + 40);
  } catch (_) {}
}

async function clickElementWithCursor(page, selector, waitAfter = 700) {
  try {
    const el = await page.$(selector);
    if (!el) {
      console.warn(`Element ${selector} not found`);
      return;
    }
    const box = await el.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      await moveCursor(page, targetX, targetY, 550);
      try {
        await page.evaluate(() => {
          const c = document.getElementById('v-cursor');
          if (c) c.classList.add('is-clicked');
        });
      } catch (_) {}
      await el.click();
      await page.waitForTimeout(160);
      try {
        await page.evaluate(() => {
          const c = document.getElementById('v-cursor');
          if (c) c.classList.remove('is-clicked');
        });
      } catch (_) {}
    } else {
      await el.click();
    }
    await page.waitForTimeout(waitAfter);
  } catch (_) {}
}

async function runAutomation() {
  const baseUrl = process.env.TARGET_URL || 'http://127.0.0.1:5500';
  let server = null;
  if (!process.env.TARGET_URL) {
    server = await startLocalServer(5500);
  }

  console.log(`🎬 Launching Playwright 1080p recording session for: ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    // =========================================================================
    // SCENE 1: Introduction & Landing Hero (approx 18.5s)
    // =========================================================================
    console.log('▶️ Scene 1: Homepage Hero & Live-typing simulation...');
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await moveCursor(page, 960, 480, 800);
    await page.waitForTimeout(2000);

    // Hover over search console to observe query typing
    const searchConsole = await page.$('.search-console');
    if (searchConsole) {
      const box = await searchConsole.boundingBox();
      if (box) await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 700);
    }
    await page.waitForTimeout(6500);

    // Hover over Primary CTA
    await clickElementWithCursor(page, '.hero__ctas a.btn-primary', 2000);

    // =========================================================================
    // SCENE 2: Dark / Light Mode Transition (approx 12s)
    // =========================================================================
    console.log('▶️ Scene 2: Demonstrating Zero-FOUC Dark Theme Toggle...');
    // Return to home to show theme switch across hero & navbar
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await moveCursor(page, 1820, 31, 800); // Navbar theme toggle location
    await clickElementWithCursor(page, '#themeToggle', 2200);

    // Show theme switch worked cleanly
    await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    // =========================================================================
    // SCENE 3: Eligibility Finder (approx 20s)
    // =========================================================================
    console.log('▶️ Scene 3: Scholarship Eligibility Finder form...');
    await page.goto(`${baseUrl}/pages/finder.html`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await page.waitForTimeout(1200);

    // Fill domicile state
    await clickElementWithCursor(page, '#state', 400);
    await page.selectOption('#state', 'Bihar');
    await page.waitForTimeout(600);

    // Fill academic category
    await clickElementWithCursor(page, '#category', 400);
    await page.selectOption('#category', 'STEM');
    await page.waitForTimeout(600);

    // Fill income
    await clickElementWithCursor(page, '#income', 400);
    await page.fill('#income', '80000');
    await page.waitForTimeout(600);

    // Fill class
    await clickElementWithCursor(page, '#currentClass', 400);
    await page.selectOption('#currentClass', 'undergraduate');
    await page.waitForTimeout(600);

    // Toggle Minority: Yes
    await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'smooth' }));
    await page.waitForTimeout(600);
    await clickElementWithCursor(page, '[data-toggle-group="minority"] .toggle-chip[data-value="yes"]', 700);

    // Submit Finder form
    await clickElementWithCursor(page, '#findBtn', 2500);

    // =========================================================================
    // SCENE 4: Results Directory & Filtering (approx 18s)
    // =========================================================================
    console.log('▶️ Scene 4: Filterable Results Directory...');
    await page.waitForURL(/results\.html/);
    await injectVisualCursor(page);
    await page.waitForTimeout(1800);

    // Smooth hover across top cards
    await moveCursor(page, 450, 420, 800);
    await page.waitForTimeout(2000);

    // Type query into instant filter
    const searchFilter = await page.$('#filterSearch');
    if (searchFilter) {
      await clickElementWithCursor(page, '#filterSearch', 300);
      await page.fill('#filterSearch', 'engineering');
      await page.waitForTimeout(2000);
      await page.fill('#filterSearch', '');
    }

    // Sort by highest amount
    await clickElementWithCursor(page, '#sortSelect', 400);
    await page.selectOption('#sortSelect', 'amount');
    await page.waitForTimeout(2200);

    // =========================================================================
    // SCENE 5: Scheme Dossier & Interactive Document Checklist (approx 22s)
    // =========================================================================
    console.log('▶️ Scene 5: Scheme Dossier & Document Readiness Checklist...');
    await page.goto(`${baseUrl}/pages/details.html?id=sch_001`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await page.waitForTimeout(1600);

    // Scroll down to the Document Checklist
    await page.evaluate(() => window.scrollTo({ top: 480, behavior: 'smooth' }));
    await page.waitForTimeout(1200);

    // Check each document one by one with visible progress updates
    await clickElementWithCursor(page, 'label[for="doc-0"]', 1000);
    await clickElementWithCursor(page, 'label[for="doc-1"]', 1000);
    await clickElementWithCursor(page, 'label[for="doc-2"]', 1000);
    await clickElementWithCursor(page, 'label[for="doc-3"]', 1600);

    // Highlight the official application button
    await moveCursor(page, 1500, 360, 800);
    await page.waitForTimeout(2500);

    // =========================================================================
    // SCENE 6: Natural Language AI Assistant (approx 15s)
    // =========================================================================
    console.log('▶️ Scene 6: Conversational AI Assistant...');
    await page.goto(`${baseUrl}/pages/assistant.html`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await page.waitForTimeout(1400);

    // Click suggested prompt
    await clickElementWithCursor(page, '.suggested-q', 3000);

    // Hover microphone button to show Web Speech voice option
    const micBtn = await page.$('#micBtn');
    if (micBtn) {
      const box = await micBtn.boundingBox();
      if (box) await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 800);
    }
    await page.waitForTimeout(2500);

    // =========================================================================
    // SCENE 7: Branded Closing (approx 12s)
    // =========================================================================
    console.log('▶️ Scene 7: Overview & Closing...');
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(3500);

  } catch (err) {
    console.error('Automation encountered an error:', err);
  } finally {
    console.log('🏁 Closing browser context and flushing video stream...');
    await page.close();
    await context.close();
    await browser.close();

    if (server) {
      server.close();
    }
  }

  // Find the generated webm file
  const videoFiles = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    const rawVideoPath = path.join(RECORDINGS_DIR, videoFiles[videoFiles.length - 1]);
    console.log(`✅ Raw 1080p recording successfully created at: ${rawVideoPath}`);
    return rawVideoPath;
  } else {
    throw new Error('No video recording file found.');
  }
}

if (require.main === module) {
  runAutomation().catch(console.error);
}

module.exports = { runAutomation };
