/**
 * browser-automation.js
 * Programmatically drives a Chromium 1080p browser instance with
 * strict timeline synchronization based on timeline-manifest.json.
 * Records discrete, frame-accurate clips for each scene.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const RECORDINGS_DIR = path.join(__dirname, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Built-in static server so the app runs without external daemons
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
      console.log(`🌐 Local static server active on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// Injects visual cursor and compositor keep-alive heartbeat
async function setupVisualCursor(page) {
  await page.addStyleTag({
    content: `
      #v-cursor {
        position: fixed;
        width: 22px;
        height: 22px;
        background: rgba(37, 99, 235, 0.90);
        border: 2.5px solid #ffffff;
        box-shadow: 0 3px 12px rgba(0,0,0,0.40);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%);
        transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1), background-color 0.15s ease;
      }
      #v-cursor.is-clicked {
        transform: translate(-50%, -50%) scale(0.65);
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

      // Force 60fps compositor repaint so video encoder produces steady frames
      let t = 0;
      function tick() {
        t += 0.05;
        c.style.outline = (Math.sin(t) * 0.01) + 'px solid transparent';
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
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
    await page.waitForTimeout(duration + 30);
  } catch (_) {}
}

async function clickElement(page, selector, waitAfter = 500) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
    const el = await page.$(selector);
    if (!el) return;
    const box = await el.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      await moveCursor(page, targetX, targetY, 450);
      try {
        await page.evaluate(() => {
          const c = document.getElementById('v-cursor');
          if (c) c.classList.add('is-clicked');
        });
      } catch (_) {}
      await el.click();
      await page.waitForTimeout(140);
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
  } catch (err) {
    console.warn(`Click failed on ${selector}:`, err.message);
  }
}

/**
 * Executes a single scene recording locked to scene.duration
 */
async function recordScene(browser, baseUrl, scene) {
  console.log(`\n🎬 [${scene.id}] Starting: "${scene.name}" (Target: ${scene.duration}s)...`);

  const sceneRecDir = path.join(RECORDINGS_DIR, scene.id);
  if (fs.existsSync(sceneRecDir)) {
    fs.rmSync(sceneRecDir, { recursive: true, force: true });
  }
  fs.mkdirSync(sceneRecDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: sceneRecDir,
      size: { width: 1920, height: 1080 }
    },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  const sceneStart = Date.now();

  try {
    // 1. Navigation
    const targetUrl = `${baseUrl}${scene.route}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await setupVisualCursor(page);

    // 2. Scheduled Action Loop
    for (const action of scene.actions) {
      const targetMs = sceneStart + (action.offsetSec * 1000);
      const now = Date.now();
      const waitTime = targetMs - now;
      if (waitTime > 0) {
        await page.waitForTimeout(waitTime);
      }

      console.log(`   ⏱️ [${action.offsetSec.toFixed(1)}s] Action: ${action.desc}`);

      if (action.type === 'move') {
        if (action.selector) {
          try {
            await page.waitForSelector(action.selector, { state: 'visible', timeout: 4000 });
            const el = await page.$(action.selector);
            if (el) {
              const box = await el.boundingBox();
              if (box) {
                await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, action.duration || 500);
              }
            }
          } catch (_) {}
        } else if (action.x !== undefined && action.y !== undefined) {
          await moveCursor(page, action.x, action.y, action.duration || 500);
        }
      } else if (action.type === 'click') {
        await clickElement(page, action.selector);
      } else if (action.type === 'select') {
        try {
          await page.waitForSelector(action.selector, { state: 'visible', timeout: 4000 });
          const el = await page.$(action.selector);
          if (el) {
            const box = await el.boundingBox();
            if (box) await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 400);
          }
          await page.selectOption(action.selector, action.value);
        } catch (_) {}
      } else if (action.type === 'fill') {
        try {
          await page.waitForSelector(action.selector, { state: 'visible', timeout: 4000 });
          const el = await page.$(action.selector);
          if (el) {
            const box = await el.boundingBox();
            if (box) await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 400);
          }
          await page.fill(action.selector, action.value);
        } catch (_) {}
      } else if (action.type === 'scroll') {
        if (action.bottom) {
          await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
        } else {
          await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), action.top || 0);
        }
        await page.waitForTimeout(600);
      } else if (action.type === 'hold') {
        // Hold screen steady
      }
    }

    // 3. Ensure visual footage stays stable until the narration concludes
    const elapsed = (Date.now() - sceneStart) / 1000;
    const remainingMs = Math.max(0, (scene.duration - elapsed) * 1000);
    if (remainingMs > 0) {
      console.log(`   ⏳ Holding visual state for remaining ${ (remainingMs / 1000).toFixed(2) }s to match voiceover...`);
      await page.waitForTimeout(remainingMs);
    }

  } catch (err) {
    console.error(`❌ Error in scene ${scene.id}:`, err);
  } finally {
    await page.close();
    await context.close();
  }

  // Retrieve the generated video
  const files = fs.readdirSync(sceneRecDir).filter(f => f.endsWith('.webm'));
  if (files.length === 0) {
    throw new Error(`No recording found for scene ${scene.id}`);
  }

  const rawRecPath = path.join(sceneRecDir, files[0]);
  const destRecPath = path.join(RECORDINGS_DIR, `${scene.id}.webm`);
  fs.copyFileSync(rawRecPath, destRecPath);

  const realElapsed = ((Date.now() - sceneStart) / 1000).toFixed(2);
  console.log(`   ✅ [${scene.id}] Recorded successfully (${realElapsed}s) -> ${destRecPath}`);
  return destRecPath;
}

/**
 * Runs browser automation for the given manifest scenes
 */
async function runAutomation(manifest) {
  const baseUrl = process.env.TARGET_URL || 'http://127.0.0.1:5500';
  let server = null;
  if (!process.env.TARGET_URL) {
    server = await startLocalServer(5500);
  }

  console.log(`🚀 Launching Playwright browser instance targeting: ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true
  });

  const recordedScenes = [];

  try {
    for (const scene of manifest.scenes) {
      const recPath = await recordScene(browser, baseUrl, scene);
      recordedScenes.push({
        sceneId: scene.id,
        videoPath: recPath,
        audioPath: scene.audioFile,
        duration: scene.duration
      });
    }
  } finally {
    await browser.close();
    if (server) {
      server.close();
      console.log('🛑 Local static server stopped.');
    }
  }

  return recordedScenes;
}

module.exports = { runAutomation, startLocalServer };
