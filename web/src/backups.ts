import { db } from './storage'
import type { Project } from './model'
const labels: Record<string, string> = { 'before-agent': '智能写入前', 'before-preset': '切换版式前', 'before-import': '导入运行包前', 'before-demo': '载入示例前', 'before-restore': '恢复前' }
export function backupLabel(id: string) { return Object.entries(labels).find(([kind]) => id.includes(kind))?.[1] || '旧版备份' }
export async function createBackup(project: Project, kind: keyof typeof labels) {
  const prefix = `backup:${kind}:`
  await db.transaction('rw', db.projects, async () => {
    await db.projects.put({ ...structuredClone(project), id: prefix + Date.now() + ':' + crypto.randomUUID(), updatedAt: Date.now() })
    const backups = (await db.projects.toArray()).filter(p => p.id.startsWith(prefix)).sort((a, b) => b.updatedAt - a.updatedAt)
    await db.projects.bulkDelete(backups.slice(12).map(p => p.id))
  })
}
export async function listBackups() {
  return (await db.projects.toArray()).filter(p => p.schemaVersion === 2 && (p.id.startsWith('backup:') || p.id.endsWith('-backup'))).sort((a, b) => b.updatedAt - a.updatedAt)
}
