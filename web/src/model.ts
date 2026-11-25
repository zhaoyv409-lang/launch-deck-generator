import presetData from './presets.json'
export type Composition = 'opening' | 'gallery' | 'editorial' | 'cinema' | 'chart' | 'outro' | 'table'
export const compositions: { value: Composition; label: string }[] = [
  { value: 'opening', label: '留白叙事' }, { value: 'gallery', label: '漂浮画廊' },
  { value: 'editorial', label: '图文并置' }, { value: 'cinema', label: '影像时刻' },
  { value: 'chart', label: '趋势图表' }, { value: 'outro', label: '结尾收束' }, { value: 'table', label: '信息对照' },
]
export type PhotoAspect = 'auto' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
export interface Photo { id: string; mediaId: string; rotation?: number; fit?: 'cover' | 'contain'; aspect?: PhotoAspect; caption?: string }
export interface ChartSeries { id?: string; label: string; values: number[]; color?: string }
export interface SceneChart { type?: 'line' | 'bar' | 'pie'; categories: string[]; series: ChartSeries[] }
export type SceneFont = 'sans' | 'serif' | 'alimama' | 'georgia' | 'arial' | 'trebuchet' | 'verdana' | 'courier' | 'montserrat' | 'poppins' | 'lato' | 'raleway' | 'playfair' | 'bebas'
export interface Scene {
  id: string; name: string; presetId?: string; font?: SceneFont; textColor?: string; photoEffect?: 'float' | 'reveal' | 'still' | 'lift'; composition: Composition; headings: string[]; texts: string[]; photos: Photo[]
  fontSize?: number; mediaVersion?: 1; photoRotation?: number; photoAspect?: PhotoAspect
  tableStyle?: 'plain' | 'striped' | 'comparison'; tableDensity?: 'comfortable' | 'compact'; chartUnit?: string; chartShowData?: boolean
  footnote?: string; videoId?: string; posterId?: string; table?: string[][]; chart?: SceneChart; muted: boolean; loop: boolean
  motion: boolean; textEffect: 'fade' | 'blur' | 'focus' | 'drift'; material: 'glass' | 'paper'; fit: 'cover' | 'contain'; align: 'left' | 'center'
}
export function getSceneInk(scene: Pick<Scene, 'composition' | 'textColor'>) {
  const ink = scene.textColor || '#30384b'
  if (scene.composition !== 'outro') return ink
  const brightness = [0.2126, 0.7152, 0.0722].reduce((sum, weight, i) => sum + weight * parseInt(ink.slice(1 + i * 2, 3 + i * 2), 16), 0)
  return brightness < 128 ? '#f4f6fa' : ink
}
export type SlideTransition = 'creative' | 'fade' | 'cards' | 'magic'
export interface Project {
  id: string; schemaVersion: 2; name: string; scenes: Scene[]; selectedId: string; updatedAt: number
  background: { kind: BackgroundKind; colors: string[]; speed: number; paused: boolean; preset: string }
  transition: SlideTransition
}
export interface Media { id: string; name: string; blob: Blob; type: string; width?: number; height?: number; processed?: boolean }
export const limits = { scenes: 100, headings: 2, texts: 2, photos: 6, chartPoints: 12, chartSeries: 3, tableRows: 13, tableColumns: 8, tableCellLength: 120 } as const
export type BackgroundKind = 'mesh' | 'grain' | 'clouds' | 'clouds2' | 'solid' | 'waves' | 'smoke' | 'orbit'
export const backgroundKinds: { id: BackgroundKind; label: string }[] = [
  {
    "id": "mesh",
    "label": "流动渐变"
  },
  {
    "id": "grain",
    "label": "柔雾颗粒"
  },
  {
    "id": "clouds",
    "label": "云朵"
  },
  {
    "id": "clouds2",
    "label": "云朵 · 层次"
  },
  {
    "id": "solid",
    "label": "纯色素底"
  },
  {
    "id": "waves",
    "label": "流线"
  },
  {
    "id": "smoke",
    "label": "烟环"
  },
  {
    "id": "orbit",
    "label": "星点"
  }
]
export interface Palette { id: string; label: string; kind: BackgroundKind; colors: string[]; ink: string; dark?: boolean }
export const palettes: Palette[] = [
  {
    "id": "dawn",
    "label": "晨光",
    "kind": "mesh",
    "colors": [
      "#e7eaf7",
      "#c9dcf1",
      "#f6e5df",
      "#e8dced"
    ],
    "ink": "#30384b"
  },
  {
    "id": "sage",
    "label": "青屿",
    "kind": "mesh",
    "colors": [
      "#e5eee6",
      "#bfd2c8",
      "#eee7d5",
      "#e1e9e5"
    ],
    "ink": "#2e4238"
  },
  {
    "id": "rose",
    "label": "暮粉",
    "kind": "mesh",
    "colors": [
      "#f3dce5",
      "#d9d6ed",
      "#f5e8dc",
      "#e7c9dc"
    ],
    "ink": "#50374b"
  },
  {
    "id": "blue",
    "label": "晴空",
    "kind": "mesh",
    "colors": [
      "#cee5f1",
      "#b4cde9",
      "#e9eff4",
      "#d2d4ed"
    ],
    "ink": "#2c3e5e"
  },
  {
    "id": "ink",
    "label": "墨夜",
    "kind": "mesh",
    "dark": true,
    "colors": [
      "#171a26",
      "#232c44",
      "#2b2038",
      "#1a2233"
    ],
    "ink": "#eef0f8"
  },
  {
    "id": "abyss",
    "label": "深海",
    "kind": "mesh",
    "dark": true,
    "colors": [
      "#101926",
      "#17324a",
      "#0f2a33",
      "#1c2440"
    ],
    "ink": "#e3edf4"
  },
  {
    "id": "ember",
    "label": "余烬",
    "kind": "mesh",
    "dark": true,
    "colors": [
      "#1d1614",
      "#332018",
      "#2b1a26",
      "#241a18"
    ],
    "ink": "#f2e2d2"
  },
  {
    "id": "aurora",
    "label": "极光",
    "kind": "grain",
    "dark": true,
    "colors": [
      "#0f0e18",
      "#3e6172",
      "#88ddae",
      "#5a4a8a"
    ],
    "ink": "#dff2e7"
  },
  {
    "id": "dune",
    "label": "沙丘",
    "kind": "grain",
    "colors": [
      "#f2ebe0",
      "#d9b98a",
      "#c4730b",
      "#8a5a3c"
    ],
    "ink": "#45321e"
  },
  {
    "id": "waves",
    "label": "暖波",
    "kind": "grain",
    "dark": true,
    "colors": [
      "#0a0f10",
      "#c4730b",
      "#bdad5f",
      "#d8ccc7"
    ],
    "ink": "#f0e6d0"
  },
  {
    "id": "cumulus",
    "label": "积云",
    "kind": "clouds",
    "colors": [
      "#c8dcee",
      "#ffffff",
      "#7698c2",
      "#f4e9d2"
    ],
    "ink": "#2f3d55"
  },
  {
    "id": "dusk",
    "label": "夕云",
    "kind": "clouds2",
    "dark": true,
    "colors": [
      "#2c2e4a",
      "#f2b58c",
      "#4a4068",
      "#f7d9a8"
    ],
    "ink": "#f5e9da"
  },
  {
    "id": "paper",
    "label": "白纸",
    "kind": "solid",
    "colors": [
      "#f6f5f1",
      "#f6f5f1",
      "#f6f5f1",
      "#f6f5f1"
    ],
    "ink": "#30384b"
  },
  {
    "id": "carbon",
    "label": "纯黑",
    "kind": "solid",
    "dark": true,
    "colors": [
      "#0d0f14",
      "#0d0f14",
      "#0d0f14",
      "#0d0f14"
    ],
    "ink": "#eceff5"
  },
  {
    "id": "snow",
    "label": "冷白",
    "kind": "solid",
    "colors": [
      "#eef2f6",
      "#eef2f6",
      "#eef2f6",
      "#eef2f6"
    ],
    "ink": "#343d54"
  },
  {
    "id": "linen",
    "label": "素线",
    "kind": "waves",
    "colors": [
      "#f6f4ee",
      "#d9d3c5",
      "#c4bcaa",
      "#e9e4d8"
    ],
    "ink": "#3b382e"
  },
  {
    "id": "nightline",
    "label": "夜线",
    "kind": "waves",
    "dark": true,
    "colors": [
      "#0d1017",
      "#2c3648",
      "#46536b",
      "#1b2231"
    ],
    "ink": "#e8edf5"
  },
  {
    "id": "mist",
    "label": "烟青",
    "kind": "smoke",
    "dark": true,
    "colors": [
      "#0e1116",
      "#5a7d8c",
      "#9fc4c9",
      "#d8e6e3"
    ],
    "ink": "#e3edf2"
  },
  {
    "id": "glowring",
    "label": "烟霞",
    "kind": "smoke",
    "dark": true,
    "colors": [
      "#150f16",
      "#8c5a72",
      "#c99fb0",
      "#e8d3da"
    ],
    "ink": "#f2e2ea"
  },
  {
    "id": "starry",
    "label": "星野",
    "kind": "orbit",
    "dark": true,
    "colors": [
      "#0b0e1a",
      "#8fa3d8",
      "#d8c9a8",
      "#6b7bb0"
    ],
    "ink": "#e8ecf7"
  },
  {
    "id": "polka",
    "label": "糖点",
    "kind": "orbit",
    "colors": [
      "#f7f2ea",
      "#e0a63c",
      "#7ba05b",
      "#c96a5a"
    ],
    "ink": "#41372a"
  }
]
export const fontOptions: { id: SceneFont; label: string }[] = [
  {
    "id": "sans",
    "label": "系统无衬线"
  },
  {
    "id": "serif",
    "label": "宋体"
  },
  {
    "id": "alimama",
    "label": "阿里妈妈数黑体"
  },
  {
    "id": "montserrat",
    "label": "Montserrat 现代标题"
  },
  {
    "id": "poppins",
    "label": "Poppins 几何商务"
  },
  {
    "id": "lato",
    "label": "Lato 亲和正文"
  },
  {
    "id": "raleway",
    "label": "Raleway 轻盈标题"
  },
  {
    "id": "playfair",
    "label": "Playfair 优雅衬线"
  },
  {
    "id": "bebas",
    "label": "Bebas Neue 大写冲击"
  },
  {
    "id": "georgia",
    "label": "Georgia"
  },
  {
    "id": "arial",
    "label": "Arial"
  },
  {
    "id": "trebuchet",
    "label": "Trebuchet MS"
  },
  {
    "id": "verdana",
    "label": "Verdana"
  },
  {
    "id": "courier",
    "label": "Courier New"
  }
]
export const transitions: { id: SlideTransition; label: string }[] = [
  {
    "id": "fade",
    "label": "柔和淡入"
  },
  {
    "id": "creative",
    "label": "纵深漂移"
  },
  {
    "id": "cards",
    "label": "卡片推进"
  },
  {
    "id": "magic",
    "label": "神奇移动"
  }
]
export const presets = presetData as { id: string; name: string; description: string; headings: number; texts: number; photos: number; composition: Composition; align: 'left' | 'center'; legacy?: boolean; category?: string; sampleHeadings?: string[]; sampleTexts?: string[]; sampleTable?: string[][] }[]
export const defaultChart: SceneChart = { type: 'line', categories: ['一月', '二月', '三月', '四月', '五月', '六月'], series: [{ label: '增长', values: [12, 18, 14, 26, 22, 34] }] }
export function scenePreset(scene: Partial<Scene>) {
  const known = presets.find(p => p.id === scene.presetId)
  if (known) return known
  const n = scene.photos?.length || 0
  const id = scene.videoId ? 'cinema' : scene.composition === 'table' ? 'table' : scene.composition === 'chart' ? 'chart-line' : scene.composition === 'outro' ? 'outro' : n >= 5 ? 'gallery' : n === 4 ? 'quartet' : n === 3 ? 'trio' : n === 2 ? ((scene.headings?.length || 0) > 1 ? 'duet' : 'pair') : n === 1 ? !(scene.headings?.length || scene.texts?.length) ? 'image' : (scene.texts?.length || 0) > 1 ? 'caption-story' : 'caption' : (scene.headings?.length || 0) > 1 ? 'statement' : (scene.texts?.length || 0) > 1 ? 'story' : 'title'
  return presets.find(p => p.id === id)!
}
export function applyPreset(scene: Scene, presetId: string): Scene {
  const preset = presets.find(p => p.id === presetId) || presets[0]
  const wasDefaultName = scene.name === scenePreset(scene).name
  return { ...scene, presetId: preset.id, composition: preset.composition, align: preset.align,
    name: wasDefaultName ? preset.name : scene.name,
    headings: Array.from({ length: preset.headings }, (_, i) => scene.headings[i] || preset.sampleHeadings?.[i] || (i ? '自然发生。' : '让想法，被看见。')),
    texts: Array.from({ length: preset.texts }, (_, i) => scene.texts[i] || preset.sampleTexts?.[i] || '留一点空间，让内容自然发生。'),
    photos: scene.photos.slice(0, preset.photos), videoId: preset.composition === 'cinema' ? scene.videoId : undefined, posterId: preset.composition === 'cinema' ? scene.posterId : undefined,
    chart: preset.composition === 'chart' ? { ...structuredClone(scene.chart || defaultChart), type: preset.id === 'chart-bar' ? 'bar' : preset.id === 'chart-pie' ? 'pie' : 'line' } : scene.chart,
    table: preset.composition === 'table' ? (scene.table || structuredClone(preset.sampleTable || [['项目', '内容'], ['说明', '信息']])) : scene.table,
  }
}
export function newScene(presetId = 'title'): Scene {
  const base: Scene = { id: crypto.randomUUID(), name: '新的片刻', composition: 'opening', headings: [], texts: [], photos: [], muted: true, loop: true, motion: true, textEffect: 'fade', photoEffect: 'still', material: 'glass', fit: 'contain', mediaVersion: 1, align: 'left', font: 'sans', textColor: '#30384b' }
  return { ...applyPreset(base, presetId), name: presets.find(p => p.id === presetId)?.name || '新的片刻' }
}
const photos = (...ids: string[]) => ids.map(mediaId => ({ id: crypto.randomUUID(), mediaId }))
const presetsInCategory = (id: string) => presets.filter(p => !p.legacy && presetCategory(p) === id)
export function seedProject(): Project { let e = presets.filter(e => !e.legacy).length, t = { ...newScene(`trio`), name: `认识流光`, headings: [`流光，`, `让表达发生。`], texts: [`为演讲、路演与作品展示，搭一座轻盈的舞台。`, `选择版式、放入内容、预览播放，再把作品带走。`], photos: photos(`alpine`, `ocean`, `botanical`) }, n = { ...newScene(`gallery`), name: `选择版式`, headings: [`先选版式，再放内容。`], texts: [`${e} 种版式，覆盖文字、图文、影像、图表、表格与收尾。`], photos: photos(`ocean`, `woodland`, `alpine`, `botanical`, `dunes`, `hills`) }, r = { ...newScene(`duet`), name: `编辑与氛围`, headings: [`这一屏，讲清内容。`, `整场，统一氛围。`], texts: [`打开编辑栏，修改文字、替换素材或调整动效。`, `在整场设置中选择背景、色板与切屏转场。`], photos: photos(`ocean`, `alpine`) }, i = { ...newScene(`cinema`), name: `视频演示`, headings: [`让影像，也成为表达。`], texts: [`放入本地视频，设置封面、静音与循环播放。`], videoId: `flower` }, a = presetCategories.map(e => e.label), o = presetCategories.map(e => presetsInCategory(e.id).length), s = { ...newScene(`chart-bar`), name: `图表与数据`, headings: [`把数字，讲得更清楚。`], texts: [`折线、柱状与饼图，编辑数字即可更新。`], footnote: `图中为当前 ${e} 种版式的分类数量。`, chart: { type: `bar`, categories: a, series: [{ id: `series-0`, label: `版式数量`, values: o }] } }, c = { ...newScene(`table`), name: `导出与分享`, headings: [`一个作品，三种交付。`], texts: [`点击右上角「导出」，选择适合你的使用方式。`, `PPT 为静态幻灯片；HTML 与运行包保留动态展示。`], table: [[`格式`, `适合场景`, `使用方式`], [`PPT`, `会议与内容交付`, `静态幻灯片，含可编辑图表`], [`HTML`, `单文件播放`, `双击即可打开`], [`ZIP 运行包`, `离线演示、继续编辑`, `解压启动，也可导回工作台`]] }, l = { ...newScene(`story`), name: `本地与协作`, headings: [`用你自己的 Agent，`, `一起完成这场展示。`], texts: [`点击「连接 Agent」：安装 Playwright 扩展，配置 Codex 或 Cursor，再复制提示词，授权连接当前工作台。`, `作品与备份保存在当前浏览器，本站不接收作品内容。换设备前请导出备份；AI 读取的资料由你所用的模型服务处理。`] }, u = { ...newScene(`outro-thanks`), name: `开始制作`, headings: [`下一场展示，从这里开始。`], texts: [`流光 · 演讲、路演与作品展示`], textColor: `#f4f6fa` }, d = palettes.find(e => e.id === `cumulus`)!; return { id: `current`, schemaVersion: 2, name: `流光 · 软件介绍`, scenes: [t, n, r, i, s, c, l, u], selectedId: t.id, updatedAt: Date.now(), background: { kind: d.kind, colors: d.colors, speed: .18, paused: !1, preset: `cumulus` }, transition: `fade` } as Project; }

const strings = (value: unknown, count: number, length: number): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, count).map(v => v.slice(0, length)) : []
const numbers = (value: unknown, count: number): number[] => Array.isArray(value) ? value.map(v => Number(v)).filter(v => Number.isFinite(v)).slice(0, count) : []
export function normalizeChart(input: unknown): SceneChart | undefined {
  if (input == null) return undefined
  const chart = input as Partial<SceneChart>
  const categories = strings(chart.categories, limits.chartPoints, 12)
  const series = (Array.isArray(chart.series) ? chart.series : []).slice(0, limits.chartSeries).map((s, i) => ({
    // 内部 dataKey 使用稳定 id + index，同名系列或叫 name 的系列不会互相覆盖。
    id: `series-${i}`,
    label: typeof s?.label === 'string' ? s.label.slice(0, 20) : `系列 ${i + 1}`,
    values: numbers(s?.values, limits.chartPoints),
    color: typeof s?.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : undefined,
  })).filter(s => s.values.length)
  if (!categories.length && !series.length) return undefined
  const width = Math.min(categories.length || series[0]?.values.length || 0, limits.chartPoints)
  return { type: ['line', 'bar', 'pie'].includes(chart.type || '') ? chart.type : 'line', categories: categories.slice(0, width), series: series.map(s => ({ ...s, values: s.values.slice(0, width) })) }
}
export function normalizeScene(input: Partial<Scene>): Scene {
  const base = newScene()
  const preset = scenePreset(input)
  return { ...base, ...normalizeSettings(input), presetId: preset.id, font: fontOptions.some(f => f.id === input.font) ? input.font : 'sans', textColor: /^#[0-9a-f]{6}$/i.test(input.textColor || '') ? input.textColor : '#30384b', photoEffect: ['float', 'reveal', 'still', 'lift'].includes(input.photoEffect || '') ? input.photoEffect! : 'still', id: typeof input.id === 'string' ? input.id : base.id, name: typeof input.name === 'string' ? input.name.slice(0, 60) : base.name,
    composition: preset.composition,
    headings: Array.from({ length: preset.headings }, (_, i) => strings(input.headings, 2, 72)[i] || ''), texts: Array.from({ length: preset.texts }, (_, i) => strings(input.texts, 2, 180)[i] || ''),
    footnote: typeof input.footnote === 'string' && input.footnote.trim() ? input.footnote.slice(0, 120) : undefined,
    photos: Array.isArray(input.photos) ? input.photos.filter(p => p && typeof p.id === 'string' && typeof p.mediaId === 'string').slice(0, preset.photos).map(normalizePhoto) : [],
    videoId: typeof input.videoId === 'string' ? input.videoId : undefined, posterId: typeof input.posterId === 'string' ? input.posterId : undefined,
    table: Array.isArray(input.table) ? input.table.slice(0, limits.tableRows).map(row => strings(row, limits.tableColumns, limits.tableCellLength)) : undefined,
    chart: normalizeChart(input.chart) ?? (preset.composition === 'chart' ? structuredClone(defaultChart) : undefined),
    muted: input.muted !== false, loop: input.loop !== false, motion: input.motion !== false,
    textEffect: ['fade', 'blur', 'focus', 'drift'].includes(input.textEffect || '') ? input.textEffect! : 'fade',
    material: input.material === 'paper' ? 'paper' : 'glass', fit: input.fit === 'cover' ? 'cover' : 'contain', align: preset.align,
  }
}
export function normalizeProject(input: unknown): Project {
  const value = input as Project
  if (!value || value.schemaVersion !== 2 || !Array.isArray(value.scenes) || !value.scenes.length || value.scenes.length > limits.scenes) throw new Error('这不是有效的流光运行包')
  const scenes = value.scenes.map(normalizeScene)
  if (new Set(scenes.map(s => s.id)).size !== scenes.length) throw new Error('运行包中的页面标识重复')
  const kind: BackgroundKind = backgroundKinds.some(k => k.id === value.background?.kind) ? value.background!.kind : 'mesh'
  const transition: SlideTransition = transitions.some(t => t.id === value.transition) ? value.transition : 'fade'
  return { id: 'current', schemaVersion: 2, name: typeof value.name === 'string' ? value.name.slice(0, 60) : '我的流动网页', scenes,
    selectedId: scenes.some(s => s.id === value.selectedId) ? value.selectedId : scenes[0].id, updatedAt: Date.now(),
    background: { kind, colors: value.background?.colors?.length === 4 && value.background.colors.every(c => /^#[0-9a-f]{6}$/i.test(c)) ? value.background.colors : palettes[0].colors,
      speed: Math.max(0, Math.min(1, Number(value.background?.speed) || 0)), paused: Boolean(value.background?.paused), preset: typeof value.background?.preset === 'string' ? value.background.preset : 'custom' },
    transition,
  }
}
export function referencedMedia(project: Project) {
  return [...new Set(project.scenes.flatMap(s => [...s.photos.map(p => p.mediaId), s.videoId, s.posterId]).filter((id): id is string => Boolean(id)))]
}

export const presetCategories = [{ id: 'text', label: '文字' }, { id: 'screens', label: '截图与报告' }, { id: 'photo', label: '图文' }, { id: 'video', label: '影像' }, { id: 'chart', label: '图表' }, { id: 'table', label: '表格' }, { id: 'outro', label: '收尾' }]
export function presetCategory(preset: typeof presets[number]) {
  // Match the supplied build's category routing, including its screenshot-to-outro grouping.
  // Correcting this observable behavior belongs to a separate change after baseline acceptance.
  return preset.category || preset.composition === 'outro' ? 'outro' : preset.composition === 'chart' ? 'chart' : preset.composition === 'table' ? 'table' : preset.composition === 'cinema' ? 'video' : preset.photos > 0 ? 'photo' : 'text'
}
export const photoAspects: PhotoAspect[] = ['auto', '16:9', '4:3', '1:1', '3:4', '9:16']
export const scenePatchFields = ['name', 'headings', 'texts', 'footnote', 'font', 'fontSize', 'textColor', 'textEffect', 'photoEffect', 'motion', 'chart', 'table', 'fit', 'mediaVersion', 'photoRotation', 'photoAspect', 'tableStyle', 'tableDensity', 'chartUnit', 'chartShowData']
export const angle = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(-180, Math.min(180, value)) : 0
export function normalizePhoto(p: Photo): Photo {
  return { id: p.id, mediaId: p.mediaId, rotation: typeof p.rotation === 'number' ? angle(p.rotation) : undefined, fit: p.fit === 'cover' || p.fit === 'contain' ? p.fit : undefined, aspect: photoAspects.includes(p.aspect!) ? p.aspect : undefined, caption: typeof p.caption === 'string' ? p.caption.slice(0, 100) : undefined }
}
function normalizeSettings(input: Partial<Scene>): Partial<Scene> {
  return { mediaVersion: 1, fontSize: typeof input.fontSize === 'number' && Number.isFinite(input.fontSize) ? Math.max(.6, Math.min(1.6, input.fontSize)) : 1, photoRotation: angle(input.photoRotation), photoAspect: photoAspects.includes(input.photoAspect!) ? input.photoAspect : 'auto', tableStyle: ['plain', 'striped', 'comparison'].includes(input.tableStyle || '') ? input.tableStyle : 'striped', tableDensity: input.tableDensity === 'compact' ? 'compact' : 'comfortable', chartUnit: typeof input.chartUnit === 'string' ? input.chartUnit.slice(0, 24) : '', chartShowData: input.chartShowData !== false }
}
export function applyPhotoSettings(photos: Photo[], settings?: (Partial<Photo> & { index: number })[]) {
  return photos.map((p, i) => { const setting = Array.isArray(settings) ? settings.find(s => s && s.index === i + 1) : undefined; return normalizePhoto({ ...p, ...setting, id: p.id, mediaId: p.mediaId }) })
}
export function validateScenePatch(patch: Partial<Scene>) {
  for (const [key, choices] of [['font', fontOptions.map(f => f.id)], ['textEffect', ['fade', 'blur', 'focus', 'drift']], ['photoEffect', ['float', 'reveal', 'still', 'lift']], ['fit', ['contain', 'cover']], ['photoAspect', photoAspects], ['tableStyle', ['plain', 'striped', 'comparison']], ['tableDensity', ['comfortable', 'compact']]] as const) {
    if (patch[key] !== undefined && !(choices as readonly string[]).includes(String(patch[key]))) throw new Error(key + ' 不在支持范围内')
  }
  if (patch.textColor !== undefined && !/^#[0-9a-f]{6}$/i.test(patch.textColor)) throw new Error('文字颜色需为六位 Hex')
  if (patch.table !== undefined && (!Array.isArray(patch.table) || patch.table.some(row => !Array.isArray(row)))) throw new Error('table 需要二维数组')
  if (patch.chart?.type !== undefined && !['line', 'bar', 'pie'].includes(patch.chart.type)) throw new Error('chart.type 需为 line / bar / pie')
}
