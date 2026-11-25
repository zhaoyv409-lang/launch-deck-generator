import { readFile, writeFile, copyFile, mkdir, access } from 'node:fs/promises'
import { randomUUID, webcrypto } from 'node:crypto'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
globalThis.crypto ??= webcrypto
const root = dirname(fileURLToPath(import.meta.url))
let modelPath = resolve(root, 'model.mjs')
try { await access(modelPath) } catch { modelPath = resolve(root, '../public/player/model.mjs') }
const { presets, normalizeProject, normalizeScene, newScene, applyPreset, applyPhotoSettings, validateScenePatch, scenePatchFields, transitions, backgroundKinds, palettes, limits } = await import(pathToFileURL(modelPath).href)
const [command = 'inspect', patchPath] = process.argv.slice(2)
if (command === 'presets') { console.log(JSON.stringify(presets, null, 2)); process.exit(0) }
const projectPath = resolve(root, 'project.json')
const manifest = JSON.parse(await readFile(projectPath, 'utf8'))
if (command === 'inspect') { console.log(JSON.stringify(manifest.project, null, 2)); process.exit(0) }
if (!['apply', 'add'].includes(command) || !patchPath) throw new Error('用法：node agent.mjs inspect | presets | apply patch.json | add patch.json')
const patch = JSON.parse(await readFile(resolve(patchPath), 'utf8'))
validateScenePatch(patch)
const project = normalizeProject(manifest.project)
if (patch.transition !== undefined) { if (!transitions.some(t => t.id === patch.transition)) throw new Error('transition 不在支持范围内'); project.transition = patch.transition }
if (patch.background) {
  if (patch.background.kind !== undefined && !backgroundKinds.some(b => b.id === patch.background.kind)) throw new Error('background.kind 不在支持范围内')
  if (patch.background.colors !== undefined && (!Array.isArray(patch.background.colors) || patch.background.colors.length !== 4 || !patch.background.colors.every(c => /^#[0-9a-f]{6}$/i.test(c)))) throw new Error('background.colors 需要 4 个 Hex 颜色')
  const palette = palettes.find(p => p.id === patch.background.preset)
  project.background = { ...project.background, ...patch.background, kind: patch.background.kind || palette?.kind || project.background.kind, colors: patch.background.colors || palette?.colors || project.background.colors }
  if (palette) project.scenes = project.scenes.map(s => ({ ...s, textColor: palette.ink }))
}
const hasSceneChanges = [...scenePatchFields, 'presetId', 'images', 'video', 'photoSettings'].some(k => patch[k] !== undefined)
if (command === 'apply' && hasSceneChanges && (!Number.isInteger(patch.scene) || patch.scene < 1)) throw new Error('apply 需要从 1 开始的 scene 编号')
if (command === 'add' || patch.scene !== undefined) {
  const creating = command === 'add'
  if (creating && project.scenes.length >= limits.scenes) throw new Error('最多 100 屏')
  const existing = creating ? newScene(patch.presetId || 'title') : project.scenes[patch.scene - 1]
  if (!existing) throw new Error('页面编号超出范围')
  if (patch.presetId && !presets.some(p => p.id === patch.presetId)) throw new Error('presetId 无效')
  const presetId = patch.presetId || (patch.video ? 'cinema' : existing.presetId)
  let scene = patch.presetId || (patch.video && !creating) ? applyPreset(existing, presetId) : existing
  if (patch.video && scene.composition !== 'cinema') throw new Error('视频需要影像类版式')
  const fields = Object.fromEntries(Object.entries(patch).filter(([key]) => scenePatchFields.includes(key)))
  scene = normalizeScene({ ...scene, ...fields, chart: patch.chart ? { ...scene.chart, ...patch.chart } : scene.chart })
  const formats = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' }
  const bring = async (source, kind) => {
    if (typeof source !== 'string') throw new Error('素材需为本地文件路径')
    const file = resolve(dirname(resolve(patchPath)), source), ext = extname(file).toLowerCase(), type = formats[ext]
    if (!type?.startsWith(kind + '/')) throw new Error('素材类型不受支持')
    const id = randomUUID(), path = `media/${id}${ext}`
    await mkdir(resolve(root, 'media'), { recursive: true }); await copyFile(file, resolve(root, path))
    manifest.media.push({ id, name: basename(file), type, path }); return id
  }
  const slots = presets.find(p => p.id === scene.presetId).photos - scene.photos.length
  if (patch.images !== undefined && !Array.isArray(patch.images)) throw new Error('images 需要数组')
  for (const source of (patch.images || []).slice(0, slots)) scene.photos.push({ id: randomUUID(), mediaId: await bring(source, 'image') })
  if (patch.video) scene.videoId = await bring(patch.video, 'video')
  scene.photos = applyPhotoSettings(scene.photos, patch.photoSettings)
  if (creating) project.scenes.push(scene); else project.scenes[patch.scene - 1] = scene
  project.selectedId = scene.id
}
manifest.project = normalizeProject(project)
await copyFile(projectPath, resolve(root, 'project.before-agent.json'))
await writeFile(projectPath, JSON.stringify(manifest, null, 2) + '\n')
console.log('已应用配置，旧内容保存在 project.before-agent.json。')
