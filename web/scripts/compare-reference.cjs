// Compare only isolated browser profiles; never modify the open user session.
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  fs.mkdirSync("evidence", { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  });
  const report = {};
  for (const [name, url] of [
    ["reference", process.env.REFERENCE_URL || "http://127.0.0.1:5174/stage/"],
    ["source", process.env.SOURCE_URL || "http://127.0.0.1:5373/"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    report[name] = { errors: [], states: {} };
    page.on("pageerror", (e) => report[name].errors.push(e.message));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const snap = async (
      key,
      selectors = [
        ".flow-identity",
        ".flow-actions",
        ".flow-editor",
        ".preset-summary",
        ".scene-dock",
        ".swiper-slide-active .scene-heading",
        ".swiper-slide-active .scene-small-text",
        ".swiper-slide-active .photo-frame",
      ],
    ) => {
      await page.evaluate(() => document.fonts.ready);
      // A processed DB record can still be followed by a pending React image URL update.
      // Compare displayed bytes with that record, not merely the processed flag.
      await page.waitForFunction(async () => {
        const root = document.querySelector('.swiper-slide-active .scene-content');
        const scene = window.flowAgent?.inspect()?.scenes.find(s => s.id === root?.dataset.sceneId);
        if (!scene) return true;
        const images = [...root.querySelectorAll('.photo-frame img')];
        if (!images.length) return true;
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('stage-workbench');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          const rows = await new Promise((resolve, reject) => {
            const request = db.transaction('media').objectStore('media').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          const digest = async blob => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).join(',');
          return (await Promise.all(images.map(async (img, index) => {
            const record = rows.find(row => row.id === scene.photos[index]?.mediaId);
            if (!record) return false;
            const displayed = await (await fetch(img.currentSrc || img.src)).blob();
            return await digest(displayed) === await digest(record.blob);
          }))).every(Boolean);
        } finally { db.close(); }
      }, null, { timeout: 30000 });
      await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `evidence/audit-${name}-${key}.png`,
        animations: "disabled",
      });
      report[name].states[key] = await page.evaluate(
        (selectors) =>
          selectors.flatMap((s) =>
            Array.from(document.querySelectorAll(s), (el) => {
              const r = el.getBoundingClientRect(),
                c = getComputedStyle(el);
              return {
                s,
                text: el.innerText?.slice(0, 120),
                x: r.x,
                y: r.y,
                w: r.width,
                h: r.height,
                font: c.fontFamily,
                fontSize: c.fontSize,
                color: c.color,
                background: c.backgroundColor,
              };
            }),
          ),
        selectors,
      );
    };
    await snap("home", [
      ".lp-wordmark",
      ".lp-hero-title",
      ".lp-hero-copy",
      ".lp-hero-stage",
      ".lp-nav",
    ]);
    for (const part of [
      "layouts",
      "workbench",
      "ambience",
      "motion",
      "data",
      "export",
    ]) {
      await page.locator("#" + part).scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await snap("home-" + part, ["#" + part]);
    }
    await page
      .getByRole("button", { name: "开始制作", exact: true })
      .first()
      .click();
    const hint = page.getByRole("button", {
      name: "暂时隐藏教程提示",
      exact: true,
    });
    if (await hint.isVisible()) await hint.click();
    // Await the reference's idle image conversion before comparing decoded pixels.
    await page.waitForFunction(
      async () => {
        const db = await new Promise((resolve, reject) => {
          const r = indexedDB.open("stage-workbench");
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        try {
          const media = await new Promise((resolve, reject) => {
            const r = db.transaction("media").objectStore("media").getAll();
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
          });
          return media.length >= 7 && media
            .filter((m) => m.type.startsWith("image/"))
            .every((m) => m.processed);
        } finally {
          db.close();
        }
      },
      null,
      { timeout: 30000 },
    );
    // The database write precedes the React URL replacement and image decoding.
    await page.waitForTimeout(5000);
    await snap("stage");
    await page.getByRole("button", { name: "编辑当前屏", exact: true }).click();
    await snap("overview");
    for (const [part, label] of [
      ["copy", "文字与脚注"],
      ["media", "图片与视频"],
      ["text", "文字样式"],
      ["motion", "入场与动效"],
      ["manage", "管理这一屏"],
    ]) {
      await page.getByRole("button", { name: new RegExp("^" + label) }).click();
      await snap(part);
      await page
        .getByRole("button", { name: "返回当前屏", exact: true })
        .click();
    }
    await page.getByRole("button", { name: "更换版式", exact: true }).click();
    await snap("presets", [".preset-dialog", ".preset-rail", ".preset-choice"]);
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await page.getByRole("tab", { name: "整场设置", exact: true }).click();
    await page.getByRole("button", { name: /^背景与配色/ }).click();
    await snap("background");
    await page
      .locator(".flow-topbar")
      .getByRole("button", { name: "收起编辑", exact: true })
      .click();
    for (let i = 2; i <= 8; i++) {
      await page
        .getByRole("button", { name: `第 ${i} 屏`, exact: true })
        .click();
      await page.waitForTimeout(400);
      await snap("scene-" + i);
    }
    await page.getByRole("button", { name: "第 1 屏", exact: true }).click();
    for (const [key, label] of [
      ["export", "导出作品"],
      ["more", "更多操作"],
      ["agent", "连接 Agent"],
    ]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await snap(key, [
        "[role=menu]",
        "[role=menuitem]",
        "[role=dialog]",
        ".stage-agent-live",
      ]);
      report[name].states[key + "-html"] = await page
        .locator("[role=menu],[role=dialog]")
        .evaluateAll((es) => es.map((e) => e.outerHTML));
      await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("menuitem", { name: "恢复备份", exact: true }).click();
    await snap("backups", ["[role=alertdialog]", "[role=dialog]"]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("menuitem", { name: "切换到深色" }).click();
    await page.getByRole("button", { name: "编辑当前屏", exact: true }).click();
    await snap("dark-editor");
    await page
      .locator(".flow-topbar")
      .getByRole("button", { name: "收起编辑", exact: true })
      .click();
    await page.getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("menuitem", { name: "切换到浅色" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await snap("mobile");
    await page.locator(".edit-button").click();
    await snap("mobile-editor");
    await context.close();
    fs.writeFileSync(
      "evidence/exact-audit.json",
      JSON.stringify(report, null, 2),
    );
  }
  await browser.close();
  const deltas = {};
  for (const [k, arr] of Object.entries(report.source.states)) {
    if (k.endsWith("-html")) continue;
    deltas[k] = arr
      .map((a, i) => {
        const b = report.reference.states[k][i];
        if (!b) return { i, missing: true };
        const d = Object.fromEntries(
          Object.entries(a).filter(([p, v]) =>
            p === "text"
              ? v !== b[p]
              : typeof v === "number"
                ? Math.abs(v - b[p]) > 0.5
                : v !== b[p],
          ),
        );
        return Object.keys(d).length ? { i, s: a.s, d, reference: b } : null;
      })
      .filter(Boolean);
    if (arr.length !== report.reference.states[k].length) deltas[k].unshift({ count: { source: arr.length, reference: report.reference.states[k].length } });
  }
  fs.writeFileSync(
    "evidence/exact-deltas.json",
    JSON.stringify(deltas, null, 2),
  );
  console.log(
    JSON.stringify(
      Object.fromEntries(Object.entries(deltas).map(([k, v]) => [k, v.length])),
    ),
  );
  console.log("Errors", report.reference.errors, report.source.errors);
  // Actual storage usage is origin-specific; never replace it with a fixture.
  const mismatches = Object.entries(deltas).flatMap(([state, entries]) => entries.filter(entry => {
    if (state !== "backups" || !entry.d || Object.keys(entry.d).length !== 1 || !("text" in entry.d)) return true;
    const normalizeUsage = text => text.replace(/本地已用 [\d.]+ MB \/ [\d.]+ GB/, "本地已用 <usage> / <quota>");
    return normalizeUsage(entry.d.text) !== normalizeUsage(entry.reference.text);
  }));
  if (mismatches.length || report.reference.errors.length || report.source.errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
