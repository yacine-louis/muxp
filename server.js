import express from 'express';
import { chromium } from 'playwright';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

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
    console.error('Error during page navigation:', e);
  }

  await browser.close();
  if (muxId) res.json({ muxPlaybackId: muxId });
  else res.status(404).json({ error: 'muxPlaybackId not found' });
});

app.listen(3001, () => {
  console.log('✅ Extractor API running on http://localhost:3001');
});