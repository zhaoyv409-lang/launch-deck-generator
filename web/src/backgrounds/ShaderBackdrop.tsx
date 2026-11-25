import { memo, useEffect, useRef } from 'react'
import { getShaderColorFromString, getShaderNoiseTexture, GrainGradientShapes, grainGradientFragmentShader, wavesFragmentShader, smokeRingFragmentShader, dotOrbitFragmentShader, meshGradientFragmentShader, ShaderMount, type ShaderMountUniforms } from '@paper-design/shaders'

type Settings = { kind: 'mesh' | 'grain' | 'waves' | 'smoke' | 'orbit'; colors: string[]; speed: number; paused: boolean }
function uniforms({ kind, colors }: Settings, noise?: HTMLImageElement): ShaderMountUniforms {
  const sizing = { u_fit: 1, u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0, u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0 }
  return kind === 'mesh' ? { ...sizing, u_colors: colors.map(getShaderColorFromString), u_colorsCount: colors.length, u_distortion: 0.85, u_swirl: 0.28, u_grainMixer: 0, u_grainOverlay: 0.012 }
    : kind === 'grain' ? { ...sizing, u_colorBack: getShaderColorFromString(colors[0]), u_colors: colors.slice(1).map(getShaderColorFromString), u_colorsCount: colors.length - 1, u_softness: 0.7, u_intensity: 0.18, u_noise: 0.5, u_shape: GrainGradientShapes.wave, u_noiseTexture: noise }
    : kind === 'waves' ? { ...sizing, u_colorBack: getShaderColorFromString(colors[0]), u_colorFront: getShaderColorFromString(colors[1]), u_shape: 1, u_frequency: .45, u_amplitude: .16, u_spacing: 1.35, u_proportion: .32, u_softness: 1 }
    : kind === 'smoke' ? { ...sizing, u_scale: 1.2, u_colorBack: getShaderColorFromString(colors[0]), u_colors: colors.slice(1).map(getShaderColorFromString), u_colorsCount: 3, u_noiseScale: 1.5, u_thickness: .42, u_radius: .62, u_innerShape: 1.2, u_noiseIterations: 3, u_noiseTexture: noise }
    : { ...sizing, u_colorBack: getShaderColorFromString(colors[0]), u_colors: colors.slice(1).map(getShaderColorFromString), u_colorsCount: 3, u_size: .32, u_sizeRange: .7, u_spreading: .35, u_stepsPerColor: 1, u_noiseTexture: noise }
}

/** Paper 原生挂载：保留原参数，装饰背景最多 30fps，编辑及隐藏时不排定下一帧。 */
export default memo(function ShaderBackdrop(settings: Settings) {
  const host = useRef<HTMLDivElement>(null)
  const mount = useRef<ShaderMount | null>(null)
  const noiseRef = useRef<HTMLImageElement | undefined>(undefined)
  const latest = useRef(settings)
  const refresh = useRef<(() => void) | null>(null)
  const { kind, colors, speed, paused } = settings
  useEffect(() => {
    const next = { kind, colors, speed, paused }
    const colorsChanged = latest.current.colors !== colors && latest.current.kind === kind
    latest.current = next
    if (colorsChanged) mount.current?.setUniforms(uniforms(next, noiseRef.current))
    refresh.current?.()
  }, [kind, colors, speed, paused])
  useEffect(() => {
    const element = host.current
    if (!element) return
    let shader: ShaderMount | undefined; let cancelled = false
    let request = 0; let lastTime = 0; let frame = 0
    const tick = (now: number) => {
      const dt = now - lastTime
      if (dt >= 1000 / 30) {
        frame += Math.min(dt, 100) * latest.current.speed * (kind === 'grain' ? 1.4 : 1)
        lastTime = now; shader?.setFrame(frame)
      }
      request = requestAnimationFrame(tick)
    }
    const update = () => {
      cancelAnimationFrame(request); request = 0
      if (shader && !cancelled && !latest.current.paused && latest.current.speed > 0 && !document.hidden) {
        lastTime = performance.now(); request = requestAnimationFrame(tick)
      }
    }
    void (async () => {
      const noise = ['grain', 'smoke', 'orbit'].includes(kind) ? getShaderNoiseTexture() : undefined
      // 原生 ShaderMount 要求纹理已完成解码；React 包装此前代为等待。
      if (noise) await noise.decode()
      if (cancelled) return
      noiseRef.current = noise
      shader = new ShaderMount(element, ({ mesh: meshGradientFragmentShader, grain: grainGradientFragmentShader, waves: wavesFragmentShader, smoke: smokeRingFragmentShader, orbit: dotOrbitFragmentShader })[kind], uniforms(latest.current, noise), undefined, 0, 0, 1, 518400)
      mount.current = shader; refresh.current = update
      document.addEventListener('visibilitychange', update)
      update()
    })().catch(error => {
      if (!cancelled) { element.replaceChildren(); console.warn('背景不可用，保留当前底色', error) }
    })
    return () => { cancelled = true; cancelAnimationFrame(request); document.removeEventListener('visibilitychange', update); refresh.current = null; mount.current = null; noiseRef.current = undefined; shader?.dispose() }
  }, [kind])
  return <div className="shader-backdrop" ref={host} aria-hidden="true" style={{ width: '100%', height: '100%' }} />
})
