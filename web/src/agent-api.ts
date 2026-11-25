import type { Project, Scene, BackgroundKind, SlideTransition, Photo } from './model'
export interface AgentImage { name?: string; dataUrl: string }
export interface ScenePatch {
  scene: number; presetId?: string; name?: string; headings?: string[]; texts?: string[]; footnote?: string
  font?: Scene['font']; textColor?: string; textEffect?: Scene['textEffect']; photoEffect?: Scene['photoEffect']; motion?: boolean
  images?: (string | AgentImage)[]; video?: string | AgentImage
  fontSize?: number; table?: string[][]; fit?: Scene['fit']; mediaVersion?: 1; photoRotation?: number; photoAspect?: Scene['photoAspect']; photoSettings?: (Partial<Photo> & { index: number })[]; tableStyle?: Scene['tableStyle']; tableDensity?: Scene['tableDensity']; chartUnit?: string; chartShowData?: boolean
  chart?: { type?: 'line' | 'bar' | 'pie'; categories?: string[]; series?: { label?: string; values: number[]; color?: string }[] }
}
export interface AgentResult { project: Project; scene: number; addedImages: number; ignoredImages: number }
export interface AgentConnection { client: string; at: number; phase: 'checking' | 'awaiting' | 'connected' }
export interface FlowAgent {
  help: () => unknown
  goTo: (scene: number) => Promise<{ scene: number }>
  ping: (client?: string) => Promise<{ ok: boolean; client: string; at: number }>
  report: (step: string) => Promise<{ ok: boolean; step: string; phase: AgentConnection['phase'] }>
  getConnection: () => AgentConnection | null
  inspect: () => Project | null
  listPresets: () => unknown
  apply: (patch: ScenePatch) => Promise<AgentResult>
  addScene: (patch: Omit<ScenePatch, 'scene'>) => Promise<AgentResult>
  setBackground: (patch: { kind?: BackgroundKind; colors?: string[]; preset?: string; speed?: number; paused?: boolean }) => Promise<Project>
  setTransition: (transition: SlideTransition) => Promise<Project>
}
declare global { interface Window { flowAgent?: FlowAgent } }
