// Run against isolated profiles so the user's saved projects remain untouched.
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
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      try {
        await context.addInitScript(() => {
          localStorage.setItem('flow-landing-dismissed', '1');
          localStorage.setItem('flow-guide-dismissed-v1', '1');
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(url);
        await page.waitForFunction(() => window.flowAgent?.inspect());
        await page.evaluate(async () => {
          await window.flowAgent.setBackground({ kind: 'solid', colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] });
          await window.flowAgent.apply({ scene: 1, motion: false });
          await window.flowAgent.apply({ scene: 2, motion: false });
        });
        await page.evaluate(() => document.fonts.ready);
        results[name] = { states: {}, errors };
        for (const transition of ['fade', 'creative', 'cards', 'magic']) {
          await page.evaluate(t => window.flowAgent.setTransition(t), transition);
          for (const method of ['page-button', 'keyboard', 'agent']) {
            await page.evaluate(() => window.flowAgent.goTo(1));
            await page.waitForTimeout(900);
            if (method === 'page-button') await page.getByRole('button', { name: '第 2 屏', exact: true }).click();
            if (method === 'keyboard') { await page.locator('body').click({ position: { x: 10, y: 360 } }); await page.keyboard.press('ArrowDown'); }
            if (method === 'agent') await page.evaluate(() => window.flowAgent.goTo(2));
            await page.waitForTimeout(40);
            results[name].states[`${transition}/${method}`] = await page.evaluate(() => {
              const swiper = document.querySelector('.swiper').swiper;
              const content = document.querySelector('.swiper-slide-active .scene-content');
              return {
                activeIndex: swiper.activeIndex,
                effect: swiper.params.effect,
                speed: swiper.params.speed,
                direction: swiper.params.direction,
                mountedPages: document.querySelectorAll('.scene-content').length,
                elements: ['.scene-heading', '.scene-small-text', '.photo-frame'].flatMap(selector =>
                  Array.from(content.querySelectorAll(selector), (node, index) => ({
                    selector, index,
                    animations: node.getAnimations().map(animation => ({
                      duration: animation.effect.getTiming().duration,
                      easing: animation.effect.getTiming().easing,
                      keyframes: animation.effect.getKeyframes().map(frame => ({ transform: frame.transform, opacity: frame.opacity, offset: frame.offset })),
                    })),
                  }))),
              };
            });
          }
        }
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.evaluate(() => window.flowAgent.goTo(1));
        await page.waitForTimeout(100);
        results[name].states.reduced = await page.evaluate(() => ({
          speed: document.querySelector('.swiper').swiper.params.speed,
          running: document.querySelector('.swiper-slide-active .scene-content').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length,
        }));
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
  const differences = Object.keys(results.reference.states).filter(key => JSON.stringify(results.reference.states[key]) !== JSON.stringify(results.source.states[key]));
  fs.writeFileSync('evidence/transition-comparison.json', JSON.stringify({ results, differences }, null, 2));
  console.log(JSON.stringify({ cases: Object.keys(results.source.states).length, differences, errors: { reference: results.reference.errors, source: results.source.errors } }));
  if (differences.length || results.reference.errors.length || results.source.errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
