import { useEffect } from 'react'

type Point = [number, number]
const scale = ([x, y]: Point, amount: number): Point => [x * amount, y * amount]
const swap = ([x, y]: Point): Point => [y, x]
const round = (value: number) => String(Math.round(value * 1000) / 1000)

// Continuous corner geometry used by the supplied reference's surface overlays.
function surfacePath(width: number, height: number, radius: number) {
  if (width <= 0 || height <= 0 || radius <= 0) return ''
  const format = ([x, y]: Point) => `${round(x)} ${round(y)}`
  const r = Math.min(radius, width / 2, height / 2)
  const horizontal = Math.min(1.528665 * r, width / 2)
  const vertical = Math.min(1.528665 * r, height / 2)
  const first = scale([.631494, .074911], r)
  const second = scale([.372824, .16906], r)
  const extent = ([x]: Point) => x === 0 ? vertical : horizontal
  const controls = (length: number): Point => {
    const factor = Math.min(Math.max((length / r - 1) / .5286649999999999, 0), 1)
    return [r * (.96 + (1.08849 - .96) * factor), r * (.82 + (.868407 - .82) * factor)]
  }
  const corner = (origin: Point, incoming: Point, outgoing: Point) => {
    const [a, b] = controls(extent(incoming)), [c, d] = controls(extent(outgoing))
    const project = ([x, y]: Point): Point => [origin[0] + incoming[0] * x + outgoing[0] * y, origin[1] + incoming[1] * x + outgoing[1] * y]
    return [
      `C${format(project([a, 0]))} ${format(project([b, 0]))} ${format(project(first))}`,
      `C${format(project(second))} ${format(project(swap(second)))} ${format(project(swap(first)))}`,
      `C${format(project([0, d]))} ${format(project([0, c]))} ${format(project([0, extent(outgoing)]))}`,
    ].join(' ')
  }
  return [
    `M${format([horizontal, 0])}`, `L${format([width - horizontal, 0])}`,
    corner([width, 0], [-1, 0], [0, 1]), `L${format([width, height - vertical])}`,
    corner([width, height], [0, -1], [-1, 0]), `L${format([horizontal, height])}`,
    corner([0, height], [1, 0], [0, -1]), `L${format([0, vertical])}`,
    corner([0, 0], [0, 1], [1, 0]), 'Z',
  ].join(' ')
}

export function useReferenceSurfaces() {
  useEffect(() => {
    const observed = new Set<HTMLElement>()
    const resize = new ResizeObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement
        const { width, height } = element.getBoundingClientRect()
        element.style.setProperty('--hark-corner-path', `path('${surfacePath(width, height, Number(element.dataset.harkRadius) || 24)}')`)
      }
    })
    const update = () => {
      for (const element of observed) if (!element.isConnected) { resize.unobserve(element); observed.delete(element) }
      document.querySelectorAll<HTMLElement>('[data-hark-surface]').forEach(element => {
        if (!observed.has(element)) { observed.add(element); resize.observe(element) }
      })
    }
    const mutation = new MutationObserver(update)
    mutation.observe(document.body, { childList: true, subtree: true })
    update()
    return () => { mutation.disconnect(); resize.disconnect() }
  }, [])
}
