const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  fs.mkdirSync('evidence', { recursive: true });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const results = {};
  try {
    for (const [name, url] of [
      ['reference', process.env.REFERENCE_URL || 'http://127.0.0.1:5174/stage/'],
      ['source', process.env.SOURCE_URL || 'http://127.0.0.1:5373/'],
    ]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
      try {
        await context.addInitScript(() => {
          localStorage.setItem('flow-landing-dismissed', '1');
          localStorage.setItem('flow-guide-dismissed-v1', '1');
        });
        const page = await context.newPage();
        await page.goto(url);
        await page.waitForFunction(() => window.flowAgent?.inspect());
        await page.evaluate(() => window.flowAgent.setBackground({ kind: 'solid', colors: ['#edf0f5', '#edf0f5', '#edf0f5', '#edf0f5'] }));
        results[name] = {};
        const ids = await page.evaluate(() => window.flowAgent.listPresets().filter(p => !p.legacy).map(p => p.id));
        for (const id of ids) {
          await page.evaluate(presetId => window.flowAgent.apply({ scene: 1, presetId, headings: ['对齐验证', '第二行标题'], texts: ['同一份内容检查布局', '第二段文字'], font: 'sans', fontSize: 1, motion: false }), id);
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(id.startsWith('chart') ? 900 : 180);
          results[name][id] = await page.locator('.swiper-slide-active .scene-content').evaluate(root =>
            ['.scene-heading', '.scene-small-text', '.scene-footnote', '.photo-frame', '.scene-chart', '.scene-table', '.stage-data-table', '.stage-process-card'].flatMap(selector =>
              Array.from(root.querySelectorAll(selector), node => {
                const rect = node.getBoundingClientRect(), css = getComputedStyle(node);
                return { selector, text: node.innerText, x: rect.x, y: rect.y, width: rect.width, height: rect.height, font: css.fontFamily, fontSize: css.fontSize, color: css.color };
              })));
        }
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
  const differences = {};
  for (const key of new Set([...Object.keys(results.source), ...Object.keys(results.reference)])) {
    const source = results.source[key] || [], reference = results.reference[key] || [];
    const changes = [];
    if (source.length !== reference.length) changes.push({ counts: [source.length, reference.length] });
    source.forEach((item, index) => {
      if (!reference[index]) return;
      const diff = Object.fromEntries(Object.entries(item).filter(([field, value]) => typeof value === 'number' ? Math.abs(value - reference[index][field]) > 0.5 : value !== reference[index][field]));
      if (Object.keys(diff).length) changes.push({ index, source: diff, reference: reference[index] });
    });
    if (changes.length) differences[key] = changes;
  }
  fs.writeFileSync('evidence/preset-comparison.json', JSON.stringify({ results, differences }, null, 2));
  console.log(JSON.stringify({ presets: Object.keys(results.source).length, differences }));
  if (Object.keys(differences).length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
