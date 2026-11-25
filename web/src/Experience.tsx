import { createContext, forwardRef, lazy, memo, Suspense, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, EffectCards, EffectCreative, EffectFade, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import { motion } from 'motion/react'
import BlurText from '@/components/vendor/react-bits/BlurText'
import { Card, CardContent } from '@/components/ui/card'
import { ScenePhotos, SceneTable, SceneChart } from './SceneExtras.jsx'
import { getSceneInk, scenePreset, type Project, type Scene } from './model'
import { DecodeCache } from './media/decode-cache'
import 'swiper/css'
import 'swiper/css/effect-creative'
import 'swiper/css/effect-fade'
import 'swiper/css/effect-cards'
import './Experience.css'
import './StageDetails.css'

const SceneChartView = lazy(() => import('./SceneChartView'))
const VantaBackdrop = lazy(() => import('./VantaBackdrop'))
const ShaderBackdrop = lazy(() => import('./backgrounds/ShaderBackdrop'))

export type ExperienceHandle = { next: () => void; previous: () => void; goTo: (index: number) => void; replay: () => void }
export const pauseMedia = () => document.querySelectorAll<HTMLVideoElement>('video').forEach(v => v.pause())

const AmbientBackground = memo(function AmbientBackground({ background, reduced, suspended }: { background: Project['background']; reduced: boolean; suspended: boolean }) {
  const paused = background.paused || reduced || suspended
  if (background.kind === 'solid') return <div className="ambient-background" style={{ backgroundColor: background.colors[0] }} />
  if (background.kind === 'clouds' || background.kind === 'clouds2') return <div className="ambient-background" style={{ backgroundColor: background.colors[0] }}>
    <Suspense fallback={null}><VantaBackdrop kind={background.kind} colors={background.colors} speed={background.speed} paused={paused} /></Suspense>
  </div>
  return <div className="ambient-background" style={{ backgroundColor: background.colors[0] }}>
    <Suspense fallback={null}><ShaderBackdrop kind={background.kind} colors={background.colors} speed={background.speed} paused={paused} /></Suspense>
  </div>
})

export const SceneContent = memo(function SceneContent({ scene, urls, animate, replay, reduced }: { scene: Scene; urls: Record<string, string>; animate: boolean; replay: number; reduced: boolean }) {
  const preset = scenePreset(scene)
  const photoSlots = Array.from({ length: preset.photos }, (_, i) => scene.photos[i] || { id: `empty-${i}`, mediaId: '' })
  const font = { montserrat: '"Montserrat", "PingFang SC", "Microsoft YaHei", sans-serif', poppins: '"Poppins", "PingFang SC", "Microsoft YaHei", sans-serif', lato: '"Lato", "PingFang SC", "Microsoft YaHei", sans-serif', raleway: '"Raleway", "PingFang SC", "Microsoft YaHei", sans-serif', playfair: '"Playfair Display", "Songti SC", Georgia, "Times New Roman", serif', bebas: '"Bebas Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
    sans: '-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif',
    serif: 'Songti SC, STSong, SimSun, serif',
    alimama: '"Alimama ShuHeiTi", PingFang SC, Microsoft YaHei, sans-serif',
    georgia: 'Georgia, "Times New Roman", Songti SC, serif',
    arial: 'Arial, "Helvetica Neue", Helvetica, PingFang SC, sans-serif',
    trebuchet: '"Trebuchet MS", "Gill Sans", PingFang SC, sans-serif',
    verdana: 'Verdana, Geneva, PingFang SC, sans-serif',
    courier: '"Courier New", Courier, monospace',
  }[scene.font || 'sans']
  const hasMotion = animate && scene.motion && !reduced
  const displayInk = getSceneInk(scene)
  const lightInk = [1, 3, 5].reduce((sum, i) => sum + parseInt(displayInk.slice(i, i + 2), 16), 0) > 510
  const titleEffect = scene.textEffect === 'fade' ? null : scene.textEffect
  return <section style={{ fontFamily: font, '--scene-ink': displayInk, '--scene-surface': lightInk ? '#182130ed' : '#ffffffb3', '--scene-cell': lightInk ? '#ffffff12' : '#ffffff70', '--font-scale': scene.fontSize || 1 } as CSSProperties} className={`scene-content preset-${preset.id} composition-${scene.composition} align-${scene.align} photo-count-${preset.photos}`} data-scene-id={scene.id}>
    {scene.composition === 'outro' && <div className="outro-stage" aria-hidden="true" />}
    <div className="scene-copy">
      <div className="headings-group">{scene.headings.map((text, i) => <div key={i} role="heading" aria-level={i + 1} className={`scene-heading heading-${i + 1}`} data-text-kind="heading" style={{ '--text-length': Math.max(1, ...text.split('\n').map(line => Array.from(line).length)) } as CSSProperties}>
        {hasMotion ? titleEffect === null ? <motion.span className="plain-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' }}>{text}</motion.span> : text.split('\n').map((line, lineIndex) => <BlurText key={`${scene.id}-${replay}-${lineIndex}`} text={line || ' '} trigger="load" animateBy="letters" delay={i === 0 ? 36 : 46} effect={titleEffect} direction="bottom" distance={22} blur={10} stepDuration={0.36} className="animated-line" />) : <span className="plain-heading">{text}</span>}
      </div>)}</div>
      <div className="scene-notes">{scene.texts.map((text, i) => <div className="scene-small-text" key={i} data-text-kind="small">
        {hasMotion ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}>{text}</motion.p> : <p>{text}</p>}
      </div>)}</div>
      {scene.footnote && <div className="scene-footnote"><p>{scene.footnote}</p></div>}
    </div>
    {photoSlots.length > 0 && <ScenePhotos scene={scene} urls={urls} />}
    {scene.videoId && <div className="scene-video-slot"><video className="scene-video" src={urls[scene.videoId]} poster={urls[scene.posterId || '']} muted={scene.muted} loop={scene.loop} controls playsInline preload="metadata" /></div>}
    {scene.composition === 'chart' && scene.chart && <Suspense fallback={<Card className="scene-chart scene-chart-loading"><CardContent>图表载入中…</CardContent></Card>}><SceneChart scene={scene} component={SceneChartView} animate={hasMotion} /></Suspense>}
    {scene.composition === 'table' && scene.table && <SceneTable scene={scene} />}
    {scene.composition === 'outro' && hasMotion && <motion.div className="outro-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 2.2, ease: [0.45, 0, 0.55, 1] }} key={`${scene.id}-${replay}-veil`} aria-hidden="true" />}
  </section>
})

const swiperEffects = {
  creative: { modules: [EffectCreative], props: { effect: 'creative' as const, creativeEffect: { limitProgress: 1, prev: { translate: [0, '-18%', -220], opacity: 0, scale: 0.92 }, next: { translate: [0, '24%', 0], opacity: 0, scale: 1.06 } } } },
  fade: { modules: [EffectFade], props: { effect: 'fade' as const, fadeEffect: { crossFade: true } } },
  cards: { modules: [EffectCards], props: { effect: 'cards' as const, cardsEffect: { perSlideOffset: 14, perSlideRotate: 2, slideShadows: true } } },
}

type ContentState = { scenes: Scene[]; urls: Record<string, string>; editing: boolean; previewScene: Scene | null; replay: number; reduced: boolean }
const ContentContext = createContext<ContentState | null>(null)
const SceneSlot = memo(function SceneSlot({ id, active, mountAll }: { id: string; active: boolean; mountAll: boolean }) {
  const content = useContext(ContentContext)!
  const scene = content.scenes.find(s => s.id === id)
  return scene && (active || mountAll) ? <SceneContent key={`${id}-${content.replay}`} scene={scene} urls={content.urls} animate={active && (!content.editing || content.previewScene === scene)} replay={content.replay} reduced={content.reduced} /> : null
})

const magicSelectors = ['.scene-heading', '.scene-small-text', '.scene-footnote', '.photo-frame', '.scene-chart', '.scene-table']
const captureMagicRects = (slide: HTMLElement) => {
  const rects = new Map<string, DOMRect>()
  for (const selector of magicSelectors) slide.querySelectorAll(selector).forEach((node, index) => rects.set(`${selector}:${index}`, node.getBoundingClientRect()))
  return rects
}
const animateMagicRects = (previousRects: Map<string, DOMRect>, slide: HTMLElement) => {
  for (const selector of magicSelectors) slide.querySelectorAll(selector).forEach((node, index) => {
    const rect = node.getBoundingClientRect(), previous = previousRects.get(`${selector}:${index}`)
    if (previous) {
      const x = previous.left - rect.left, y = previous.top - rect.top, sx = rect.width > 0 ? previous.width / rect.width : 1, sy = rect.height > 0 ? previous.height / rect.height : 1
      if (Math.abs(x) < 2 && Math.abs(y) < 2 && Math.abs(sx - 1) < .03 && Math.abs(sy - 1) < .03) return
      node.animate([{ transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})` }, { transform: 'none' }], { duration: 720, easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)' })
    } else node.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 90, easing: 'ease-out', fill: 'backwards' })
  })
}

/** 场景内容通过 context 更新，输入文字不会重新渲染 Swiper 的配置和页面列表。 */
const SceneSwiper = memo(function SceneSwiper({ ids, transition, speed, activeIndex, editing, keyboard, reduced, swiperRef, onIndexChange }: {
  ids: string[]; transition: Project['transition']; speed: number; activeIndex: number; editing: boolean; keyboard: boolean; reduced: boolean; swiperRef: RefObject<SwiperInstance | null>; onIndexChange: (index: number) => void
}) {
  const previousRects = useRef<Map<string, DOMRect> | null>(null)
  const beforeSlideChange = (swiper: SwiperInstance) => {
    pauseMedia()
    if (transition !== 'magic' || reduced) return
    const slide = swiper.slides[swiper.activeIndex]
    previousRects.current = slide ? captureMagicRects(slide) : null
  }
  const startSlideTransition = (swiper: SwiperInstance) => {
    if (transition !== 'magic' || reduced) return
    const slide = swiper.slides[swiper.activeIndex]
    if (slide && previousRects.current) animateMagicRects(previousRects.current, slide)
    previousRects.current = null
  }
  const effect = swiperEffects[transition === 'magic' ? 'fade' : transition] || swiperEffects.fade
  return <Swiper key={transition} modules={[A11y, Mousewheel, ...effect.modules]} direction={transition === 'cards' ? 'horizontal' : 'vertical'} speed={speed} initialSlide={activeIndex} mousewheel={{ enabled: keyboard && !editing, forceToAxis: transition !== 'cards', thresholdDelta: 35, thresholdTime: 750 }} allowTouchMove={!editing} {...effect.props} onSwiper={swiper => { swiperRef.current = swiper }} onBeforeSlideChangeStart={beforeSlideChange} onSlideChangeTransitionStart={startSlideTransition} onSlideChange={swiper => onIndexChange(swiper.activeIndex)} a11y={{ enabled: true, containerMessage: '舞台发布会，使用方向键切换场景', slideLabelMessage: '第 {{index}} 屏，共 {{slidesLength}} 屏' }}>
    {ids.map(id => <SwiperSlide key={id}>{({ isActive }) => <SceneSlot id={id} active={isActive} mountAll={transition === 'magic'} />}</SwiperSlide>)}
  </Swiper>
})

export const Experience = memo(forwardRef<ExperienceHandle, { project: Project; urls: Record<string, string>; editing?: boolean; activeIndex: number; onIndexChange: (index: number) => void; keyboard?: boolean }>(function Experience({ project, urls, editing = false, activeIndex, onIndexChange, keyboard = true }, ref) {
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [replay, setReplay] = useState(0)
  // 预览属于当前内容；编辑内容或切屏后失效，结束黑幕不会被固定计时器突然掀开。
  const [previewScene, setPreviewScene] = useState<Scene | null>(null)
  const activeScene = project.scenes[activeIndex]
  const decodeCache = useRef<DecodeCache>(new DecodeCache())
  const scenesRef = useRef(project.scenes)
  useEffect(() => { scenesRef.current = project.scenes }, [project.scenes])
  const adjacentMedia = JSON.stringify(project.scenes.slice(Math.max(0, activeIndex - 1), activeIndex + 2).map(s => [s.photos.map(p => p.mediaId), s.videoId]))
  useEffect(() => {
    // 等转场和编辑输入结束再做预热，避免争抢当前帧；大视频只预取元数据。
    const timer = setTimeout(() => decodeCache.current.warm(scenesRef.current, activeIndex, urls), 900)
    return () => clearTimeout(timer)
  }, [activeIndex, adjacentMedia, urls])
  useEffect(() => () => decodeCache.current.dispose(), [])
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => { setPreviewScene(null) }, [editing, activeIndex])
  const transitionSpeed = reduced ? 0 : project.transition === 'fade' ? 450 : project.transition === 'magic' ? 720 : 850
  useEffect(() => { if (swiperRef.current && swiperRef.current.activeIndex !== activeIndex) swiperRef.current.slideTo(activeIndex, editing ? 0 : transitionSpeed) }, [activeIndex, editing, transitionSpeed])
  useImperativeHandle(ref, () => ({
    next: () => swiperRef.current?.slideNext(),
    previous: () => swiperRef.current?.slidePrev(),
    goTo: index => swiperRef.current?.slideTo(index),
    replay: () => {
      setReplay(n => n + 1)
      setPreviewScene(activeScene)
    },
  }), [activeScene])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (!keyboard || editing || target.closest('input, textarea, select, [role=dialog], [contenteditable=true]') || event.metaKey || event.ctrlKey || event.altKey) return
      if ([' ', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); if ((event.key === 'ArrowLeft' || event.key === 'ArrowUp')) swiperRef.current?.slidePrev(); else swiperRef.current?.slideNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyboard, editing])
  const idsKey = JSON.stringify(project.scenes.map(s => s.id))
  const ids = useMemo(() => JSON.parse(idsKey) as string[], [idsKey])
  const content = useMemo(() => ({ scenes: project.scenes, urls, editing, previewScene, replay, reduced }), [project.scenes, urls, editing, previewScene, replay, reduced])
  return <div className={`experience transition-${project.transition}`} data-testid="experience">
    <AmbientBackground background={project.background} reduced={reduced} suspended={editing || activeScene?.composition === 'outro'} />
    <div className="experience-pages"><ContentContext value={content}><SceneSwiper ids={ids} transition={project.transition} speed={transitionSpeed} activeIndex={activeIndex} editing={editing} keyboard={keyboard} reduced={reduced} swiperRef={swiperRef} onIndexChange={onIndexChange} /></ContentContext></div>
  </div>
}))
