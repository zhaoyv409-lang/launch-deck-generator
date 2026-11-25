import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { presets, presetCategory, newScene, seedProject, normalizeProject } from '../public/player/model.mjs'

test('模型保留新增设置与旧图片裁切，分类保持参考构建兼容', () => {
  assert.equal(presets.length, 35)
  assert.equal(presets.filter(p => presetCategory(p) === 'screens').length, 0)
  assert.equal(presets.filter(p => presetCategory(p) === 'outro').length, 10)
  const project = seedProject(), scene = { ...newScene('screenshot-six'), fit: 'cover', mediaVersion: undefined, font: 'montserrat', fontSize: 1.3, photoRotation: 90, photoAspect: '4:3', chartUnit: '万元', chartShowData: false }
  project.scenes = [scene]
  const normalized = normalizeProject(project)
  assert.equal(normalized.scenes[0].fit, 'cover')
  assert.equal(normalized.scenes[0].fontSize, 1.3)
  assert.equal(normalized.scenes[0].photoAspect, '4:3')
  assert.equal(normalized.scenes[0].chartShowData, false)
})
test('离线 Agent 使用相同模型，支持新图表/背景并拒绝非法输入', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'flow-agent-'))
  try {
    for (const name of ['agent.mjs', 'model.mjs']) await cp(new URL('../public/player/' + name, import.meta.url), join(folder, name))
    await writeFile(join(folder, 'project.json'), JSON.stringify({ format: 'flow-web', version: 2, project: seedProject(), media: [] }))
    const run = async (patch, command = 'add') => { await writeFile(join(folder, 'patch.json'), JSON.stringify(patch)); return spawnSync(process.execPath, ['agent.mjs', command, 'patch.json'], { cwd: folder, encoding: 'utf8' }) }
    const result = await run({ presetId: 'chart-bar', font: 'poppins', fontSize: 1.15, chart: { type: 'bar', categories: ['甲'], series: [{ label: '值', values: [4] }] }, background: { kind: 'orbit' }, transition: 'magic' })
    assert.equal(result.status, 0, result.stderr)
    const manifest = JSON.parse(await readFile(join(folder, 'project.json'), 'utf8'))
    assert.equal(manifest.project.scenes.at(-1).chart.type, 'bar')
    assert.equal(manifest.project.background.kind, 'orbit')
    assert.equal((await run({ scene: 5, chart: { type: 'pie' }, headings: [''] }, 'apply')).status, 0)
    assert.equal((await run({ scene: 5, fontSize: 1.3 }, 'apply')).status, 0)
    const edited = JSON.parse(await readFile(join(folder, 'project.json'), 'utf8')).project.scenes[4]
    assert.equal(edited.chart.type, 'pie')
    assert.equal(edited.headings[0], '')
    const before = await readFile(join(folder, 'project.json'), 'utf8')
    assert.notEqual((await run({ presetId: 'table', table: ['invalid'] })).status, 0)
    assert.equal(await readFile(join(folder, 'project.json'), 'utf8'), before)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
