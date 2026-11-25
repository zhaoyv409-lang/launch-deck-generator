import ts from 'typescript'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const source = resolve(root, '.player-build')
const target = resolve(root, 'public/player')
await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(source, target, { recursive: true })
await cp(resolve(target, 'player.html'), resolve(target, 'index.html'))
await rm(resolve(target, 'player.html'))
await cp(resolve(root, 'scripts/portable-server.mjs'), resolve(target, 'start.mjs'))
await cp(resolve(root, 'scripts/portable-agent.mjs'), resolve(target, 'agent.mjs'))
await cp(resolve(root, 'src/presets.json'), resolve(target, 'presets.json'))
const modelSource = (await readFile(resolve(root, 'src/model.ts'), 'utf8')).replace("import presetData from './presets.json'", 'const presetData = ' + await readFile(resolve(root, 'src/presets.json'), 'utf8'))
await writeFile(resolve(target, 'model.mjs'), ts.transpileModule(modelSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText)
const singleRoot = resolve(root, '.single-build')
let single = await readFile(resolve(singleRoot, 'player.html'), 'utf8')
for (const match of [...single.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const js = await readFile(resolve(singleRoot, match[1]), 'utf8')
  single = single.replace(match[0], () => '<script type="module">' + js.replaceAll('</script', '<\\/script') + '</script>')
}
for (const match of [...single.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*>/g)]) { const css = await readFile(resolve(singleRoot, match[1]), 'utf8'); single = single.replace(match[0], () => '<style>' + css + '</style>') }
await writeFile(resolve(target, 'single.html'), single)
const files = []
async function walk(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const path = resolve(dir, item.name); if (item.isDirectory()) await walk(path); else files.push(relative(target, path).replaceAll('\\', '/')) } }
await walk(target)
await writeFile(resolve(target, 'manifest.json'), JSON.stringify({ version: '0.2.0', builtAt: new Date().toISOString(), files }, null, 2))
try { await readFile(resolve(root, 'dist/index.html')); await rm(resolve(root, 'dist/player'), { recursive: true, force: true }); await cp(target, resolve(root, 'dist/player'), { recursive: true }) } catch {}
await rm(resolve(root, 'public/player-runtime.zip'), { force: true })
await rm(resolve(root, 'dist/player-runtime.zip'), { force: true })
console.log(`Portable player: ${files.length} local files → public/player`)
