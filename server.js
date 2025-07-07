import express from 'express';
import { chromium } from 'playwright';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill for process in case it's undefined (for some ESM environments)
if (typeof process === 'undefined') {
  globalThis.process = { env: {} };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist')));

function findMuxPlaybackIds(obj, found = []) {
  if (typeof obj !== 'object' || obj === null) return found;
  if ('muxPlaybackId' in obj && typeof obj.muxPlaybackId === 'string') {
    found.push(obj.muxPlaybackId);
  }
  for (const key in obj) {
    findMuxPlaybackIds(obj[key], found);
  }
  return found;
}

app.post('/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let muxId = null;

  page.on('response', async (response) => {
    const u = response.url();
    if (u.includes('modules.rules,lesson') && !muxId) {
      try {
        const json = await response.json();
        const ids = findMuxPlaybackIds(json);
        if (ids.length) muxId = ids[0];
      } catch {
        // Intentionally ignore errors from parsing response JSON
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
  } catch (e) {
    
  }

  await browser.close();
  if (muxId) res.json({ muxPlaybackId: muxId });
  else res.status(404).json({ error: 'muxPlaybackId not found' });
});




app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Modify this to use Railway's PORT
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});