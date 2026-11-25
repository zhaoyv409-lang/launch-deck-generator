import { editorSection, openExport } from './navigation'
import { test, expect } from './fixtures'
import { readFile, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, posix } from 'node:path'
import { pathToFileURL } from 'node:url'
import { unzipSync, strFromU8 } from 'fflate'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true }))
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => !!window.flowAgent?.inspect())).toBe(true)
  await page.evaluate(() => window.flowAgent!.setBackground({ preset: 'paper' }))
})

test('35 版式分类、图片设置持久化、键盘大图及稳定 Agent 跳页', async ({ page }) => {
  expect(await page.evaluate(() => (window.flowAgent!.listPresets() as unknown[]).length)).toBe(35)
  await page.getByRole('button', { name: '添加一屏', exact: true }).click()
  await page.getByRole('tab', { name: /^截图与报告/ }).click()
  await expect(page.locator('.preset-choice')).toHaveCount(0)
  await page.getByRole('tab', { name: /^收尾/ }).click()
  await expect(page.locator('.preset-choice')).toHaveCount(10)
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.evaluate(async () => { await window.flowAgent!.apply({ scene: 1, presetId: 'screenshot-trio', fontSize: 1.15, fit: 'cover', photoRotation: 12, photoSettings: [{ index: 1, rotation: -20, aspect: '4:3', caption: '截图图注', fit: 'contain' }] }) })
  await page.reload()
  await expect.poll(() => page.evaluate(() => window.flowAgent?.inspect()?.scenes[0].photos[0].caption)).toBe('截图图注')
  expect(await page.evaluate(() => window.flowAgent!.inspect()!.scenes[0].photos[0].rotation)).toBe(-20)
  await page.getByRole('button', { name: '放大图片 1', exact: true }).click()
  await expect(page.locator('.stage-image-viewer')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.stage-image-viewer')).not.toBeVisible()
  await page.evaluate(() => window.flowAgent!.goTo(2))
  await expect(page.getByRole('button', { name: '第 2 屏', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('备份有上限，恢复前的当前内容可再次找回', async ({ page }) => {
  await page.evaluate(async () => { for (let i = 0; i < 15; i++) await window.flowAgent!.apply({ scene: 1, headings: ['内容 ' + i] }) })
  await page.getByLabel('更多操作', { exact: true }).first().click(); await page.getByRole('menuitem', { name: '恢复备份', exact: true }).click()
  await expect(page.locator('.backup-row')).toHaveCount(12)
  await page.locator('.backup-row').last().getByRole('button', { name: '恢复', exact: true }).click()
  await page.getByRole('alertdialog', { name: '恢复这份备份？', exact:true }).getByRole('button', { name: '恢复', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.flowAgent!.inspect()!.scenes[0].headings[0])).not.toBe('内容 14')
  await page.getByLabel('更多操作', { exact: true }).first().click(); await page.getByRole('menuitem', { name: '恢复备份', exact: true }).click()
  const beforeRestore = page.locator('.backup-row').filter({ hasText: '恢复前' })
  await beforeRestore.getByRole('button', { name: '恢复', exact: true }).click()
  await page.getByRole('alertdialog', { name: '恢复这份备份？', exact:true }).getByRole('button', { name: '恢复', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.flowAgent!.inspect()!.scenes[0].headings[0])).toBe('内容 14')
})

test('新增字段经 ZIP 导出和导回保留，PPT 具有原生图表和表格', async ({ page }) => {
  await page.evaluate(async () => {
    await window.flowAgent!.addScene({ presetId: 'chart-insight', font: 'montserrat', fontSize: 1.3, chart: { type: 'bar', categories: ['甲', '乙'], series: [{ label: '数量', values: [10, 20] }] }, chartUnit: '万元', chartShowData: true })
    await window.flowAgent!.addScene({ presetId: 'table-detail', table: Array.from({ length: 13 }, (_, r) => Array.from({ length: 8 }, (_, c) => `${r}-${c}`)), tableStyle: 'comparison', tableDensity: 'compact' })
  })
  const download = page.waitForEvent('download'); await openExport(page); await page.getByRole("menuitem", { name: "打包带走", exact: true }).click()
  const file = await download, path = (await file.path())!, zip = unzipSync(new Uint8Array(await readFile(path)))
  const manifest = JSON.parse(strFromU8(zip['project.json']))
  expect(manifest.project.scenes.at(-2).chart.type).toBe('bar')
  expect(manifest.project.scenes.at(-1).table).toHaveLength(13)
  expect(zip['model.mjs']).toBeDefined()
  expect(zip['许可证/montserrat-OFL.txt']).toBeDefined()
  expect(Object.keys(zip).some(k => k.includes('GT-Standard'))).toBe(true)
  await page.locator('input[aria-label="导入运行包"]').setInputFiles(path)
  await page.getByRole('button', { name: '打开并继续编辑' }).click()
  await expect.poll(() => page.evaluate(() => window.flowAgent?.inspect()?.scenes.at(-2)?.chartUnit)).toBe('万元')
  const pptDownload = page.waitForEvent('download'); await openExport(page); await page.getByRole('menuitem', { name: '导出 PPT', exact: true }).click()
  const ppt = unzipSync(new Uint8Array(await readFile((await (await pptDownload).path())!)))
  for (const [name, bytes] of Object.entries(ppt)) {
    if (!name.endsWith('.rels')) continue
    const base = name === '_rels/.rels' ? '' : name.replace(/_rels\/[^/]+$/, '')
    for (const match of strFromU8(bytes).matchAll(/<Relationship\b[^>]+>/g)) {
      if (/TargetMode="External"/.test(match[0])) continue
      const target = /Target="([^"]+)"/.exec(match[0])?.[1]
      if (target) expect(ppt[posix.normalize(target.startsWith('/') ? target.slice(1) : base + target)], name + ' -> ' + target).toBeDefined()
    }
  }
  for (const match of strFromU8(ppt['[Content_Types].xml']).matchAll(/PartName="\/([^"]+)"/g)) expect(ppt[match[1]], match[1]).toBeDefined()
  expect(Object.keys(ppt).some(k => /^ppt\/charts\/chart\d+\.xml$/.test(k))).toBe(true)
  expect(Object.entries(ppt).filter(([k]) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).some(([,v]) => strFromU8(v).includes('<a:tbl>'))).toBe(true)
})

test('单文件 HTML 在 file URL 和离线环境播放，无外部资源请求', async ({ page, browser }) => {
  await page.evaluate(() => window.flowAgent!.apply({ scene: 1, presetId: 'screenshot-trio', font: 'montserrat', photoSettings: [{ index: 1, caption: '离线图注' }] }))
  const download = page.waitForEvent('download'); await openExport(page); await page.getByRole('menuitem', { name: '导出 HTML', exact: true }).click()
  const folder = await mkdtemp(join(tmpdir(), 'flow-single-')), file = join(folder, 'index.html')
  await writeFile(file, await readFile((await (await download).path())!))
  const context = await browser.newContext({ offline: true }), player = await context.newPage(), errors: string[] = []
  player.on('pageerror', e => errors.push(e.message))
  try {
    await player.goto(pathToFileURL(file).href)
    await expect(player.locator('.swiper-slide-active .scene-content')).toBeVisible()
    await expect(player.locator('.swiper-slide-active figcaption')).toHaveText(['离线图注'])
    await expect.poll(() => player.locator('.swiper-slide-active .photo-frame img').evaluateAll(images => images.every(img => (img as HTMLImageElement).naturalWidth > 0))).toBe(true)
    expect(await player.evaluate(async () => { await document.fonts.load('16px Montserrat'); return document.fonts.check('16px Montserrat') })).toBe(true)
    await player.getByRole('button', { name: '第 4 屏', exact: true }).click()
    const video = player.locator('video')
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2)
    await video.evaluate((v: HTMLVideoElement) => { v.muted = true; return v.play() })
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(.1)
    expect(errors).toEqual([])
  } finally { await context.close() }
})

test('全部版式可渲染，神奇移动按参考挂载页面并可切回淡入', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  const ids = await page.evaluate(() => (window.flowAgent!.listPresets() as { id: string }[]).map(p => p.id))
  for (const id of ids) {
    await page.evaluate(id => window.flowAgent!.apply({ scene: 1, presetId: id }), id)
    await expect(page.locator('.swiper-slide-active .scene-content')).toHaveClass(new RegExp('preset-' + id + '( |$)'))
  }
  for (const kind of ['waves', 'smoke', 'orbit'] as const) {
    await page.evaluate(kind => window.flowAgent!.setBackground({ kind }), kind)
    await expect(page.locator('.shader-backdrop canvas')).toBeAttached()
  }
  await page.evaluate(async () => {
    await window.flowAgent!.apply({ scene: 1, presetId: 'title', headings: ['同一个标题'] })
    await window.flowAgent!.apply({ scene: 2, presetId: 'caption', headings: ['同一个标题'] })
    await window.flowAgent!.setTransition('magic')
    await window.flowAgent!.goTo(1)
  })
  await expect(page.locator('.scene-content')).toHaveCount(8)
  await page.evaluate(() => window.flowAgent!.goTo(2))
  await expect(page.locator('.scene-content')).toHaveCount(8)
  await page.evaluate(() => window.flowAgent!.setTransition('fade'))
  await expect(page.locator('.scene-content')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('首页、指南、主题与连接状态可操作', async ({ page }) => {
  await page.getByRole('button', { name: '返回首页', exact: true }).click()
  await expect(page.getByTestId('landing')).toBeVisible()
  await expect(page.locator('.lp-wordmark').first()).toHaveText('stage')
  await page.getByRole('button', { name: '开始制作', exact: true }).first().click()
  await page.getByRole('button', { name: '更多操作', exact: true }).click()
  await page.getByRole('menuitem', { name: '切换到深色' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: '新手教程', exact: true }).click()
  await expect(page.getByRole('region', { name: '新手教程' })).toBeVisible()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await expect(page.locator('.hark-detail-heading h2')).toHaveText('文字与脚注')
  await page.getByRole('button', { name: '关闭新手教程' }).click()
  await page.getByRole('button', { name: '连接 Agent', exact: true }).click()
  await page.getByText('查看完整提示词', { exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Agent 提示词' })).toBeVisible()
  await page.getByRole('tab', { name: 'Cursor', exact: true }).click()
  await page.evaluate(() => window.flowAgent!.ping('测试 Agent'))
  await expect(page.locator('.stage-agent-live-title')).toHaveText('测试 Agent 已连接')
})

test('编辑栏调宽、项目名称、多系列数据和文本框粘贴', async ({ page }) => {
  await page.locator('.project-caption').click()
  const name = page.getByRole('textbox', { name: '项目名称' })
  await name.fill('对齐验收项目'); await name.press('Enter')
  await editorSection(page, 'copy')
  const handle = page.getByRole('separator', { name: '调整编辑栏宽度' })
  await handle.focus(); await page.keyboard.press('ArrowLeft')
  await expect.poll(async () => (await page.locator('.flow-editor').boundingBox())?.width).toBe(444)
  await page.evaluate(() => window.flowAgent!.apply({ scene: 1, presetId: 'chart-bar', chart: { type: 'bar', categories: ['甲','乙'], series: [{label:'原始数据',values:[1,2]},{label:'新增数据',values:[3,4]}] } }))
  await editorSection(page, 'data')
  await page.getByLabel('系列 2 名称').fill('补充数据')
  await page.getByLabel('系列 2 值 1', { exact: true }).fill('42')
  await editorSection(page, 'copy')
  await page.getByRole('textbox', { name: '主标题 1', exact: true }).evaluate(el => {
    const clipboard = new DataTransfer(); clipboard.items.add(new File(['image'], 'paste.png', { type: 'image/png' }))
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true }))
  })
  await expect.poll(() => page.evaluate(() => window.flowAgent!.inspect()!.scenes[0].chart!.series[1].values[0])).toBe(42)
  await expect(page.getByRole('status').filter({ hasText: /^已保存$/ })).toBeVisible()
  await page.reload()
  await expect(page.locator('.project-caption')).toHaveText('对齐验收项目')
  await editorSection(page, 'data')
  await expect.poll(async () => (await page.locator('.flow-editor').boundingBox())?.width).toBe(444)
  expect(await page.evaluate(() => window.flowAgent!.inspect()!.scenes[0].chart!.series[1].values[0])).toBe(42)
})

test('二十页神奇移动、减少动态效果与连接进度', async ({ page }) => {
  await page.evaluate(async () => {
    for(let i = 8; i < 20; i++) await window.flowAgent!.addScene({ presetId: 'title', headings: ['共享标题'] })
    await window.flowAgent!.setTransition('magic')
  })
  for(const scene of [5, 20, 10, 19]) {
    await page.evaluate(scene => window.flowAgent!.goTo(scene), scene)
    await expect(page.locator('.scene-content')).toHaveCount(20)
    await expect(page.getByRole('button', { name: '第 ' + scene + ' 屏', exact: true })).toBeInViewport()
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.flowAgent!.goTo(6))
  await expect.poll(() => page.locator('.swiper-slide-active .scene-content').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0)
  await page.getByRole('button', { name: '连接 Agent', exact: true }).click()
  await page.evaluate(() => window.flowAgent!.report('awaiting-auth'))
  await expect(page.locator('.stage-agent-live-title').filter({ hasText: '等待浏览器授权' })).toBeVisible()
  await page.evaluate(() => window.flowAgent!.report('connected'))
  await expect(page.locator('.stage-agent-live-title').filter({ hasText: 'Agent 已连接' })).toBeVisible()
})
