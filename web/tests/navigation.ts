import { expect, type Page } from '@playwright/test'

export async function editorSection(page: Page, section: 'copy' | 'media' | 'data' | 'text' | 'motion' | 'manage' | 'background' | 'transition' | 'overview') {
  const editor = page.locator('.flow-editor')
  if (!await editor.isVisible()) await page.getByRole('button', { name: '编辑当前屏', exact: true }).click()
  const global = section === 'background' || section === 'transition'
  await editor.getByRole('tab', { name: global ? '整场设置' : '当前屏', exact: true }).click()
  const back = editor.locator('.hark-back-row')
  if (await back.isVisible()) await back.click()
  if (section !== 'overview') {
    const labels = { copy: '文字与脚注', media: '图片与视频', data: '图表与表格', text: '文字样式', motion: '入场与动效', manage: '管理这一屏', background: '背景与配色', transition: '切屏转场' }
    await editor.getByRole('button', { name: new RegExp('^' + labels[section]) }).click()
    await expect(editor.locator('.hark-detail-heading h2')).toHaveText(labels[section])
  }
}

export async function openExport(page: Page) {
  await page.getByRole('button', { name: '导出作品', exact: true }).click()
}
