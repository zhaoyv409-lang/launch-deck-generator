// Application UI recovered from the supplied n-build evidence-v3 reference.
// Uses the maintained local model, renderer and media assets.
import * as React from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useTransform,
  useScroll,
} from "motion/react";
import {
  Play,
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Type,
  Layers,
  Palette,
  FileCode,
  FolderArchive,
  Presentation,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import {
  newScene,
  presets,
  presetCategory,
  presetCategories,
  palettes,
  backgroundKinds,
  transitions,
} from "./model";
import { SceneContent, Experience } from "./Experience";
const BP = [0.22, 0.8, 0.24, 1];
const VP = ["alpine", "ocean", "botanical", "woodland", "dunes", "hills"];
const HP = Object.fromEntries([
  ...VP.map((id) => [id, import.meta.env.BASE_URL + "media/" + id + ".jpg"]),
  ["flower", import.meta.env.BASE_URL + "media/flower.mp4"],
]);
const UP = (id) => palettes.find((p) => p.id === id) || palettes[0];
let WP = 0;
function makeLandingScene(e, t = {}, n = 0, r) {
  let i = newScene(e),
    a = presets.find((t) => t.id === e)?.photos ?? 0,
    o = Array.from({ length: a }, (t, r) => ({
      id: `${e}-${r}`,
      mediaId: VP[(r + n) % VP.length],
    }));
  return {
    ...i,
    id: `landing-${e}-${++WP}`,
    photos: o,
    videoId: i.composition === `cinema` ? `flower` : void 0,
    textColor: r?.ink ?? i.textColor,
    motion: !0,
    ...t,
  };
}
function makeLandingProject(e, t, n = `magic`, r = !1) {
  let i = UP(t);
  return {
    id: `landing`,
    schemaVersion: 2,
    name: `stage`,
    scenes: e,
    selectedId: e[0].id,
    updatedAt: 0,
    transition: n,
    background: {
      kind: i.kind,
      colors: i.colors,
      speed: 0.22,
      paused: r,
      preset: i.id,
    },
  };
}
var paletteGradient = (e) =>
  `radial-gradient(120% 90% at 12% 8%, ${e.colors[1]} 0%, transparent 55%), radial-gradient(90% 80% at 92% 88%, ${e.colors[2]} 0%, transparent 60%), linear-gradient(135deg, ${e.colors[0]}, ${e.colors[3] ?? e.colors[0]})`;
function useQuietMotion() {
  return !!useReducedMotion();
}
function useVisible(e, t = `0px`) {
  let [n, r] = (0, React.useState)(!1);
  return (
    (0, React.useEffect)(() => {
      let n = e.current;
      if (!n) return;
      let i = new IntersectionObserver(([e]) => r(!!e?.isIntersecting), {
        rootMargin: t,
      });
      return (i.observe(n), () => i.disconnect());
    }, [e, t]),
    n
  );
}
function useElementSize(e) {
  let [t, n] = (0, React.useState)({ width: 0, height: 0 });
  return (
    (0, React.useEffect)(() => {
      let t = e.current;
      if (!t) return;
      let r = new ResizeObserver(([e]) => {
        let t = e.contentRect;
        n({ width: t.width, height: t.height });
      });
      return (r.observe(t), () => r.disconnect());
    }, [e]),
    t
  );
}
function useCycle(e, t, n) {
  let [r, i] = (0, React.useState)(0);
  return (
    (0, React.useEffect)(() => {
      if (!n || e < 2) return;
      let r = setInterval(() => i((t) => (t + 1) % e), t);
      return () => clearInterval(r);
    }, [e, t, n]),
    [r, i]
  );
}
function ScaledStage({ designWidth: e, aspect: t, className: n, children: r }) {
  let i = (0, React.useRef)(null),
    { width: a, height: o } = useElementSize(i),
    s = t ?? (a && o ? o / a : 9 / 16),
    c = a ? a / e : 0;
  return (
    <div ref={i} className={`lp-scaled ${n ?? ``}`}>
      {c > 0 && (
        <div
          className={`lp-scaled-inner`}
          style={{ width: e, height: e * s, transform: `scale(${c})` }}
        >
          {r}
        </div>
      )}
    </div>
  );
}
var StaticStage = (0, React.memo)(function ({
  scene: e,
  palette: t,
  className: n,
}) {
  return (
    <ScaledStage designWidth={1280} aspect={9 / 16} className={n}>
      {
        <div
          className={`experience lp-static-stage`}
          style={{ background: paletteGradient(t) }}
        >
          {
            <div className={`experience-pages`}>
              {
                <SceneContent
                  scene={e}
                  urls={HP}
                  animate={!1}
                  replay={0}
                  reduced={!0}
                />
              }
            </div>
          }
        </div>
      }
    </ScaledStage>
  );
});
function LiveStage({
  project: e,
  index: t,
  aspect: n,
  className: r,
  onIndexChange: i,
}) {
  let a = (0, React.useRef)(null),
    o = useVisible(a, `120px`),
    s = (0, React.useMemo)(
      () => ({
        ...e,
        background: { ...e.background, paused: e.background.paused || !o },
      }),
      [e, o],
    );
  return (
    <div ref={a} className={`lp-live ${r ?? ``}`}>
      {
        <ScaledStage designWidth={1280} aspect={n}>
          {
            <Experience
              project={s}
              urls={HP}
              activeIndex={t}
              onIndexChange={i ?? noop}
              keyboard={!1}
            />
          }
        </ScaledStage>
      }
    </div>
  );
}
var noop = () => {};
function Reveal({
  children: e,
  className: t,
  delay: n = 0,
  y: r = 24,
  as: i = `div`,
  style: a,
}) {
  let o = useQuietMotion(),
    MotionElement = motion[i];
  return (
    <MotionElement
      className={t}
      style={a}
      initial={!o && { opacity: 0, y: r }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !0, margin: `0px 0px -10% 0px` }}
      transition={{ duration: 0.8, ease: BP, delay: n }}
    >
      {e}
    </MotionElement>
  );
}
function Wordmark({ className: e }) {
  return <span className={`lp-wordmark ${e ?? ``}`}>{`stage`}</span>;
}
function InkCharacter({ char: e, progress: t, from: n, to: r }) {
  let i = useTransform(t, [n, r], [0.16, 1]);
  return <motion.span style={{ opacity: i }}>{e}</motion.span>;
}
function InkHeadline({ text: e, className: t }) {
  let n = (0, React.useRef)(null),
    r = useQuietMotion(),
    { scrollYProgress: i } = useScroll({
      target: n,
      offset: [`start 0.85`, `end 0.45`],
    }),
    a = Array.from(e.replace(/\n/g, ``)),
    o = 0;
  return (
    <h2 ref={n} className={t} aria-label={e.replace(/\n/g, ``)}>
      {e
        .split(
          `
`,
        )
        .map((e, t) => (
          <span className={`lp-ink-line`} aria-hidden={!0} key={t}>
            {Array.from(e).map((e, t) => {
              let n = o++;
              return r ? (
                <span key={t}>{e}</span>
              ) : (
                <InkCharacter
                  char={e}
                  progress={i}
                  from={(n / a.length) * 0.85}
                  to={((n + 1.5) / a.length) * 0.85}
                  key={t}
                />
              );
            })}
          </span>
        ))}
    </h2>
  );
}
var oF = `ink`;
function useHeroProject() {
  return (0, React.useMemo)(() => {
    let e = { textColor: UP(oF).ink, textEffect: `blur`, photoEffect: `float` },
      t = [
        makeLandingScene(`statement`, {
          ...e,
          headings: [`下一场发布，`, `自己会发生。`],
          texts: [`Stage · 发布会工作台`],
        }),
        makeLandingScene(`trio`, {
          ...e,
          headings: [`山海之间，`, `自有答案。`],
          texts: [
            `三张照片，版式自己排好。`,
            `标题、小字和图片，各在各的位置。`,
          ],
        }),
        makeLandingScene(`chart-bar`, {
          ...e,
          headings: [`每一根柱子，都是一个月的硬仗。`],
          texts: [`折线、柱状、饼图，导出 PPT 仍可编辑。`],
          chart: {
            type: `bar`,
            categories: [`五月`, `六月`, `七月`, `八月`, `九月`, `十月`],
            series: [
              {
                id: `series-0`,
                label: `新增用户`,
                values: [12, 18, 15, 26, 31, 42],
              },
            ],
          },
        }),
        makeLandingScene(
          `caption`,
          {
            ...e,
            headings: [`一张图，胜过一千句。`],
            texts: [`换张照片，换种心情。`],
          },
          1,
        ),
        makeLandingScene(`outro-thanks`, {
          headings: [`谢谢每一次在场。`],
          texts: [`STAGE`],
          textEffect: `blur`,
        }),
      ];
    return {
      project: makeLandingProject(t, oF, `creative`),
      names: t.map((e) => presets.find((t) => t.id === e.presetId)?.name ?? ``),
    };
  }, []);
}
function Hero({ onEnter: e }) {
  let { project: t, names: n } = useHeroProject(),
    r = (0, React.useRef)(null),
    i = useVisible(r),
    a = useQuietMotion(),
    [o] = useCycle(t.scenes.length, 4600, i && !a),
    s = (e) => ({
      initial: !a && { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.9, ease: BP, delay: e },
    });
  return (
    <section className={`lp-hero`} id={`top`}>
      {
        <div className={`lp-hero-panel`} ref={r}>
          {<LiveStage project={t} index={o} className={`lp-hero-stage`} />}
          {
            <span className={`lp-glass-chip lp-hero-chip`}>
              {<Play size={11} fill={`currentColor`} />}
              {` 第 `}
              {o + 1}
              {` / `}
              {t.scenes.length}
              {` 屏 · `}
              {n[o]}
            </span>
          }
          {
            <a className={`lp-glass-chip lp-hero-more`} href={`#layouts`}>
              {`了解更多`}
              {<ArrowDown size={13} />}
            </a>
          }
          {
            <div className={`lp-hero-dots`} aria-hidden={!0}>
              {t.scenes.map((e, t) => (
                <i data-on={t === o || void 0} key={e.id} />
              ))}
            </div>
          }
        </div>
      }
      {
        <div className={`lp-hero-side`}>
          {
            <motion.h1 className={`lp-hero-title`} {...s(0.05)}>
              {<Wordmark className={`lp-hero-wordmark`} />}
              {
                <span className={`lp-hero-tagline`}>
                  {`一种新的发布会做法。`}
                  {<br />}
                  {`选好版式、填上内容，剩下的交给 Stage。`}
                </span>
              }
            </motion.h1>
          }
          {
            <motion.div className={`lp-hero-actions`} {...s(0.18)}>
              {
                <button
                  type={`button`}
                  className={`lp-btn lp-btn-dark`}
                  onClick={e}
                >
                  {`开始制作`}
                  {<ArrowRight size={16} />}
                </button>
              }
              {
                <div className={`lp-or`}>
                  {<span>{`无需账号 · 打开即用`}</span>}
                </div>
              }
              {
                <dl className={`lp-hero-stats`}>
                  {
                    <div>
                      {<dt>{`35`}</dt>}
                      {<dd>{`种版式`}</dd>}
                    </div>
                  }
                  {
                    <div>
                      {<dt>{`21`}</dt>}
                      {<dd>{`套配色`}</dd>}
                    </div>
                  }
                  {
                    <div>
                      {<dt>{`4`}</dt>}
                      {<dd>{`种转场`}</dd>}
                    </div>
                  }
                  {
                    <div>
                      {<dt>{`3`}</dt>}
                      {<dd>{`种导出`}</dd>}
                    </div>
                  }
                </dl>
              }
            </motion.div>
          }
          {
            <p
              className={`lp-hero-legal`}
            >{`内容和素材只存在你的浏览器里，导出后可离线播放。`}</p>
          }
        </div>
      }
    </section>
  );
}
var lF = {
    screens: [`snow`, `blue`, `dawn`],
    text: [`dawn`, `rose`, `sage`],
    photo: [`blue`, `linen`, `snow`, `dawn`, `sage`],
    video: [`ink`, `abyss`],
    chart: [`snow`, `blue`, `dawn`, `sage`],
    table: [`paper`, `snow`, `linen`, `rose`],
    outro: [`carbon`],
  },
  uF = 0.86,
  dF = 3.6;
function LayoutCarousel() {
  let e = (0, React.useMemo)(() => {
      let e = {};
      return presets
        .filter((e) => !e.legacy)
        .map((t, n) => {
          let r = presetCategory(t),
            i = lF[r],
            a = UP(i[(e[r] = (e[r] ?? -1) + 1) % i.length]);
          return {
            preset: t,
            palette: a,
            category: presetCategories.find((e) => e.id === r).label,
            scene: makeLandingScene(t.id, {}, n, a),
          };
        });
    }, []),
    t = e.length,
    n = (0, React.useRef)(null),
    r = useVisible(n, `80px`),
    i = useQuietMotion(),
    [a, o] = (0, React.useState)(8),
    s = (0, React.useRef)(null),
    c = (0, React.useRef)(null),
    l = (0, React.useRef)(!1),
    u = (0, React.useRef)(a);
  {
    (0, React.useEffect)(() => {
      u.current = a;
    }, [a]);
    (0, React.useEffect)(() => {
      if (!r) return;
      let e = 0,
        t = performance.now(),
        n = (r) => {
          let a = Math.min(64, r - t) / 1e3;
          if (((t = r), !c.current)) {
            if (s.current !== null) {
              let e = s.current - u.current;
              if (Math.abs(e) < 0.002) {
                o(s.current);
                s.current = null;
              } else {
                o((t) => t + e * Math.min(1, a * 7));
              }
            } else if (!l.current && !i) {
              o((e) => e + a * 0.11);
            }
          }
          e = requestAnimationFrame(n);
        };
      return ((e = requestAnimationFrame(n)), () => cancelAnimationFrame(e));
    }, [r, i]);
  }
  let d = useElementSize(n).width || 1200,
    f = Math.min(520, Math.max(260, d * 0.36)),
    m = (e) => {
      s.current = Math.round(s.current ?? u.current) + e;
    },
    h = (e) => {
      {
        c.current = { x: e.clientX, start: u.current, moved: !1 };
        s.current = null;
        e.target.setPointerCapture?.(e.pointerId);
      }
    },
    g = (e) => {
      if (!c.current) return;
      let t = e.clientX - c.current.x;
      {
        if (Math.abs(t) > 4) {
          c.current.moved = !0;
        }
        o(c.current.start - t / (f * uF));
      }
    },
    _ = () => {
      if (c.current) {
        c.current = null;
        s.current = Math.round(u.current);
      }
    },
    v = e[((Math.round(a) % t) + t) % t];
  return (
    <div className={`lp-ring-wrap`}>
      {
        <div
          ref={n}
          className={`lp-ring`}
          style={{ "--card-w": `${f}px` }}
          onPointerDown={h}
          onPointerMove={g}
          onPointerUp={_}
          onPointerCancel={_}
          onPointerEnter={() => {
            l.current = !0;
          }}
          onPointerLeave={() => {
            {
              l.current = !1;
              _();
            }
          }}
          tabIndex={0}
          role={`group`}
          aria-roledescription={`轮播`}
          aria-label={`35 种版式`}
          onKeyDown={(e) => {
            {
              if (e.key === `ArrowLeft`) {
                e.preventDefault();
                m(-1);
              }
              if (e.key === `ArrowRight`) {
                e.preventDefault();
                m(1);
              }
            }
          }}
        >
          {e.map((e, n) => {
            let r = n - a;
            if (((r -= Math.round(r / t) * t), Math.abs(r) > dF)) return null;
            let i = Math.abs(r),
              o = {
                transform: `translateX(calc(-50% + ${r * f * uF}px)) translateZ(${i * i * 22}px) rotateY(${-r * 17}deg) scale(${1 - Math.min(i, 2) * 0.03})`,
                opacity: i > 3 ? Math.max(0, (dF - i) / 0.6) : 1,
                zIndex: 100 - Math.round(i * 10),
              };
            return (
              <div
                className={`lp-ring-card`}
                style={o}
                data-center={i < 0.5 || void 0}
                aria-hidden={i >= 0.5}
                key={e.preset.id}
              >
                {<StaticStage scene={e.scene} palette={e.palette} />}
              </div>
            );
          })}
        </div>
      }
      {
        <div className={`lp-ring-caption`}>
          {
            <button
              type={`button`}
              className={`lp-round`}
              aria-label={`上一个版式`}
              onClick={() => m(-1)}
            >
              {<ChevronLeft size={18} />}
            </button>
          }
          {
            <AnimatePresence mode={`wait`}>
              {
                <motion.div
                  className={`lp-bubble`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  aria-live={`polite`}
                  key={v.preset.id}
                >
                  {<span className={`lp-bubble-tag`}>{v.category}</span>}
                  {<b>{v.preset.name}</b>}
                  {<small>{v.preset.description}</small>}
                </motion.div>
              }
            </AnimatePresence>
          }
          {
            <button
              type={`button`}
              className={`lp-round`}
              aria-label={`下一个版式`}
              onClick={() => m(1)}
            >
              {<ChevronRight size={18} />}
            </button>
          }
        </div>
      }
    </div>
  );
}
var pF = `山海之间，自有答案。`,
  mF = [`caption`, `pair`, `trio`],
  hF = [`dawn`, `blue`, `rose`, `sage`],
  gF = [
    { icon: Type, text: `填上标题，画面立刻更新。`, ms: 4200 },
    { icon: Layers, text: `换个版式，文字和图片自动搬过去。`, ms: 4400 },
    { icon: Palette, text: `挑一套配色，背景和字色一起换。`, ms: 3800 },
    { icon: Play, text: `按下播放，全屏开讲。`, ms: 2600 },
  ];
function WorkbenchDemo() {
  let e = (0, React.useRef)(null),
    t = useVisible(e),
    n = useQuietMotion(),
    [r, i] = (0, React.useState)(0),
    [a, o] = (0, React.useState)(n ? 10 : 0),
    [s, c] = (0, React.useState)(0),
    [l, u] = (0, React.useState)(0),
    [d, f] = (0, React.useState)(0);
  (0, React.useEffect)(() => {
    if (!t || n) return;
    let e = [],
      r = (t, n) => e.push(setTimeout(n, t)),
      a = 0;
    return (
      r(a, () => {
        {
          i(0);
          o(0);
          c(0);
          u(0);
        }
      }),
      Array.from(pF).forEach((e, t) => r(a + 500 + t * 190, () => o(t + 1))),
      (a += gF[0].ms),
      r(a, () => i(1)),
      r(a + 900, () => c(1)),
      r(a + 2500, () => c(2)),
      (a += gF[1].ms),
      r(a, () => i(2)),
      r(a + 700, () => u(1)),
      r(a + 1700, () => u(2)),
      r(a + 2700, () => u(3)),
      (a += gF[2].ms),
      r(a, () => i(3)),
      (a += gF[3].ms),
      r(a, () => f((e) => e + 1)),
      () => e.forEach(clearTimeout)
    );
  }, [t, n, d]);
  let m = UP(hF[l]),
    h = mF[s],
    g = pF.slice(0, a),
    _ = (0, React.useMemo)(
      () =>
        makeLandingScene(
          h,
          {
            id: `workbench-current`,
            headings: h === `trio` ? [g.slice(0, 5), g.slice(5)] : [g || ` `],
            textColor: m.ink,
          },
          0,
          m,
        ),
      [h, g, m],
    ),
    v = (0, React.useMemo)(
      () => [
        makeLandingScene(`statement`, {
          headings: [`下一场发布，`, `自己会发生。`],
        }),
        _,
        makeLandingScene(`chart-line`, {}),
        makeLandingScene(`outro-thanks`, {}),
      ],
      [_],
    ),
    y = n ? gF.length - 1 : r,
    StepIcon = gF[y].icon;
  return (
    <div ref={e} className={`lp-wb`}>
      {
        <div className={`lp-wb-window`} data-playing={r === 3 || void 0}>
          {
            <div className={`lp-wb-bar`}>
              {
                <span className={`lp-wb-dots`}>
                  {<i />}
                  {<i />}
                  {<i />}
                </span>
              }
              {<span className={`lp-wb-title`}>{`一场自然发生的发布`}</span>}
              {
                <span className={`lp-wb-play${r === 3 ? ` is-on` : ``}`}>
                  {<Play size={12} fill={`currentColor`} />}
                  {`播放`}
                </span>
              }
            </div>
          }
          {
            <div className={`lp-wb-body`}>
              {
                <div className={`lp-wb-rail`}>
                  {v.map((e, t) => (
                    <div
                      className={`lp-wb-thumb`}
                      data-on={t === 1 || void 0}
                      key={t}
                    >
                      {<span>{t + 1}</span>}
                      {
                        <StaticStage
                          scene={e}
                          palette={t === 1 ? m : UP(`snow`)}
                        />
                      }
                    </div>
                  ))}
                </div>
              }
              {
                <div className={`lp-wb-stage`}>
                  {<StaticStage scene={_} palette={m} />}
                </div>
              }
              {
                <div className={`lp-wb-panel`}>
                  {
                    <div className={`lp-wb-tabs`}>
                      {<b>{`这一屏`}</b>}
                      {<span>{`整场`}</span>}
                    </div>
                  }
                  {<label>{`版式`}</label>}
                  {
                    <div className={`lp-wb-chips`}>
                      {mF.map((e, t) => (
                        <span data-on={t === s || void 0} key={e}>
                          {presets.find((t) => t.id === e).name}
                        </span>
                      ))}
                    </div>
                  }
                  {<label>{`主标题`}</label>}
                  {
                    <div
                      className={`lp-wb-field`}
                      data-focus={r === 0 || void 0}
                    >
                      {g}
                      {<i className={`lp-caret`} />}
                    </div>
                  }
                  {<label>{`配色`}</label>}
                  {
                    <div className={`lp-wb-swatches`}>
                      {hF.map((e, t) => (
                        <span
                          style={{ background: paletteGradient(UP(e)) }}
                          data-on={t === l || void 0}
                          title={UP(e).label}
                          key={e}
                        />
                      ))}
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
      {
        <div className={`lp-wb-caption`} aria-live={`polite`}>
          {
            <AnimatePresence mode={`wait`}>
              {
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  key={y}
                >
                  {<StepIcon size={15} />}
                  {gF[y].text}
                </motion.span>
              }
            </AnimatePresence>
          }
        </div>
      }
      {
        <ol className={`lp-wb-steps`}>
          {gF.map((e, t) => (
            <li
              data-state={t < y ? `done` : t === y ? `current` : void 0}
              key={`${d}-${t}`}
            >
              {<span style={{ animationDuration: `${e.ms}ms` }} />}
            </li>
          ))}
        </ol>
      }
    </div>
  );
}
var LazyChart = React.lazy(() => import("./SceneChartView")),
  yF = [`dawn`, `aurora`, `cumulus`, `dusk`, `linen`, `mist`, `starry`, `ink`];
function AmbienceDemo() {
  let e = (0, React.useRef)(null),
    t = useVisible(e),
    n = useQuietMotion(),
    [r, i] = (0, React.useState)(null),
    [a] = useCycle(yF.length, 5200, t && !n && r === null),
    o = r ?? a,
    s = UP(yF[o]),
    c = (0, React.useMemo)(
      () =>
        makeLandingProject(
          [
            makeLandingScene(`statement`, {
              headings: [`换一种氛围，`, `内容依然清楚。`],
              texts: [
                `${s.label} · ${backgroundKinds.find((e) => e.id === s.kind).label}`,
              ],
              textColor: s.ink,
            }),
          ],
          s.id,
        ),
      [s],
    );
  return (
    <div ref={e} className={`lp-demo lp-demo-ambience`}>
      {<LiveStage project={c} index={0} className={`lp-demo-stage`} />}
      {
        <div
          className={`lp-swatch-bar`}
          role={`radiogroup`}
          aria-label={`动态背景`}
        >
          {yF.map((e, t) => {
            let n = UP(e);
            return (
              <button
                type={`button`}
                role={`radio`}
                aria-checked={t === o}
                className={`lp-swatch`}
                style={{ background: paletteGradient(n) }}
                title={`${n.label} · ${backgroundKinds.find((e) => e.id === n.kind).label}`}
                onClick={() => i(t)}
                key={e}
              />
            );
          })}
        </div>
      }
    </div>
  );
}
var xF = {
  fade: `整屏柔和地交叉淡入`,
  creative: `内容从深处浮上来`,
  cards: `整屏像牌面一样推进`,
  magic: `同一个标题飞到下一屏的位置`,
};
function TransitionDemo() {
  let e = (0, React.useRef)(null),
    t = useVisible(e),
    n = useQuietMotion(),
    [r, i] = (0, React.useState)(`magic`),
    a = (0, React.useMemo)(() => {
      let e = UP(`blue`).ink;
      return makeLandingProject(
        [
          makeLandingScene(`statement`, {
            headings: [`同一版式，`, `看它怎么动。`],
            texts: [`标题会从上一屏的位置飞过来。`],
            textColor: e,
          }),
          makeLandingScene(`statement`, {
            headings: [`还是这一版，`, `内容已更新。`],
            texts: [`字号也跟着变了。`],
            textColor: e,
            fontSize: 1.15,
          }),
          makeLandingScene(
            `pair`,
            {
              headings: [`图文混排，换个维度。`],
              texts: [`两张照片，一起进场。`],
              textColor: e,
            },
            1,
          ),
        ],
        `blue`,
        r,
      );
    }, [r]),
    [o] = useCycle(a.scenes.length, 2600, t && !n);
  return (
    <div ref={e} className={`lp-demo lp-demo-transition`}>
      {
        <LiveStage
          project={a}
          index={o}
          className={`lp-demo-stage lp-demo-stage-sm`}
        />
      }
      {
        <ul className={`lp-actions`} aria-label={`转场`}>
          {transitions.map((e) => (
            <li key={e.id}>
              {
                <button
                  type={`button`}
                  className={`lp-action`}
                  aria-pressed={e.id === r}
                  onClick={() => i(e.id)}
                >
                  {<span className={`lp-action-tag`}>{e.label}</span>}
                  {xF[e.id]}
                </button>
              }
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
var CF = {
    type: `line`,
    categories: [`五月`, `六月`, `七月`, `八月`, `九月`, `十月`],
    series: [
      { id: `series-0`, label: `关注`, values: [12, 15, 14, 21, 26, 34] },
      { id: `series-1`, label: `转化`, values: [4, 5, 7, 8, 11, 15] },
    ],
  },
  wF = {
    type: `bar`,
    categories: [`一季度`, `二季度`, `三季度`, `四季度`],
    series: [{ id: `series-0`, label: `营收`, values: [42, 58, 64, 81] }],
  },
  TF = {
    type: `pie`,
    categories: [`产品`, `市场`, `研发`, `运营`],
    series: [{ id: `series-0`, label: `投入`, values: [34, 22, 28, 16] }],
  };
function ChartsDemo() {
  let e = (0, React.useRef)(null),
    t = useVisible(e, `-15% 0px`),
    n = (e) =>
      t ? (
        <React.Suspense fallback={null}>
          {<LazyChart chart={e} ink={`#2c3e5e`} animate={!0} />}
        </React.Suspense>
      ) : null;
  return (
    <div ref={e} className={`lp-demo lp-demo-charts`}>
      {
        <div className={`lp-chart-card lp-chart-wide`}>
          {
            <span className={`lp-chart-kicker`}>
              {<i style={{ background: `#5a7db8` }} />}
              {`关注人数 · 近六个月`}
            </span>
          }
          {
            <strong className={`lp-chart-number`}>
              {`3.4 万`}
              {<small>{`较上月 +31%`}</small>}
            </strong>
          }
          {<div className={`lp-chart-plot`}>{n(CF)}</div>}
        </div>
      }
      {
        <div className={`lp-chart-card`}>
          {
            <span className={`lp-chart-kicker`}>
              {<i style={{ background: `#b87d5a` }} />}
              {`季度营收`}
            </span>
          }
          {<div className={`lp-chart-plot`}>{n(wF)}</div>}
        </div>
      }
      {
        <div className={`lp-chart-card`}>
          {
            <span className={`lp-chart-kicker`}>
              {<i style={{ background: `#5ab87d` }} />}
              {`投入配比`}
            </span>
          }
          {<div className={`lp-chart-plot`}>{n(TF)}</div>}
        </div>
      }
    </div>
  );
}
var DF = [
  { tag: `导出`, icon: FileCode, text: `单个 HTML 文件`, note: `双击就能播` },
  {
    tag: `打包`,
    icon: FolderArchive,
    text: `ZIP 运行包`,
    note: `换台电脑，离线开讲`,
  },
  { tag: `交给`, icon: Presentation, text: `PPT 幻灯片`, note: `图表仍可编辑` },
  { tag: `接入`, icon: Bot, text: `Agent 帮你搭`, note: `MCP 服务，12 个工具` },
];
function ExportsDemo() {
  return (
    <div className={`lp-demo lp-demo-exports`}>
      {
        <ul className={`lp-actions`}>
          {DF.map((e) => (
            <li key={e.tag}>
              {
                <div className={`lp-action lp-action-static`}>
                  {<span className={`lp-action-tag`}>{e.tag}</span>}
                  {<e.icon size={17} className={`lp-action-icon`} />}
                  {<b>{e.text}</b>}
                  {<span className={`lp-action-note`}>{e.note}</span>}
                  {<ArrowUpRight size={15} className={`lp-action-arrow`} />}
                </div>
              }
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
function LandingPage({ onEnter: e }) {
  let t = (0, React.useRef)(null);
  return (
    <div className={`landing lp`} data-testid={`landing`} ref={t}>
      {<StickyHeader root={t} onEnter={e} />}
      {
        <main>
          {<Hero onEnter={e} />}
          {
            <section className={`lp-section lp-layouts`} id={`layouts`}>
              {
                <SectionHeading
                  eyebrow={`35 LAYOUTS`}
                  title={
                    <React.Fragment>
                      {`说清内容，`}
                      {<br />}
                      {`版式自己排。`}
                    </React.Fragment>
                  }
                >{`文字、图文、影像、图表、表格、收尾，七类 35 种版式。每个内容位都是固定的，换掉文字和照片，画面依然成立。拖动看看。`}</SectionHeading>
              }
              {<Reveal y={36}>{<LayoutCarousel />}</Reveal>}
              {
                <p
                  className={`lp-footnote`}
                >{`轮播里的每一屏，都由 Stage 的播放器实时渲染。`}</p>
              }
            </section>
          }
          {
            <section className={`lp-section lp-workbench`} id={`workbench`}>
              {
                <SectionHeading
                  eyebrow={`THE WORKBENCH`}
                  title={
                    <React.Fragment>
                      {`填内容，`}
                      {<br />}
                      {`其余交给它。`}
                    </React.Fragment>
                  }
                >{`左边是页面，中间是画面，右边只放这一屏需要的设置。改一个字，画面马上更新；内容和素材自动保存，刷新也不丢。`}</SectionHeading>
              }
              {<Reveal y={40}>{<WorkbenchDemo />}</Reveal>}
            </section>
          }
          {
            <div className={`lp-features`}>
              {
                <FeatureSection
                  id={`ambience`}
                  eyebrow={`AMBIENCE`}
                  title={`会动的背景`}
                  panel={`lp-panel-dusk`}
                  demo={<AmbienceDemo />}
                >
                  {
                    <p>{`流动渐变、柔雾颗粒、云朵、流线、烟环、星点……背景负责氛围，文字始终清楚。`}</p>
                  }
                  {
                    <p>{`整场一套背景，翻页时不中断、不闪白。点下面的色块试试。`}</p>
                  }
                </FeatureSection>
              }
              {
                <FeatureSection
                  id={`motion`}
                  eyebrow={`TRANSITIONS`}
                  title={`转场，接得住话`}
                  panel={`lp-panel-sky`}
                  demo={<TransitionDemo />}
                  reverse={!0}
                >
                  {
                    <p>{`柔和淡入、纵深漂移、卡片推进，还有神奇移动：同一个标题，从上一屏的位置飞到下一屏。`}</p>
                  }
                  {
                    <p>{`方向键、空格或翻页笔都能控制节奏。左边点一种，看同样三屏怎么换场。`}</p>
                  }
                </FeatureSection>
              }
              {
                <FeatureSection
                  id={`data`}
                  eyebrow={`CHARTS`}
                  title={`数字，自己会说话`}
                  panel={`lp-panel-cloud`}
                  demo={<ChartsDemo />}
                >
                  {
                    <p>{`折线、柱状、饼图三种图表，最多三组数据、十二个分类。改一个数字，画面随即更新。`}</p>
                  }
                  {<p>{`导出 PPT 时，图表仍是可以继续编辑的原生图表。`}</p>}
                </FeatureSection>
              }
              {
                <FeatureSection
                  id={`export`}
                  eyebrow={`TAKE IT ANYWHERE`}
                  title={`做完，带着走`}
                  panel={`lp-panel-peach`}
                  demo={<ExportsDemo />}
                  reverse={!0}
                >
                  {
                    <p>{`单个 HTML 双击就能播；ZIP 运行包自带本地服务，换台电脑、断了网也能讲；PPT 交给会议室。`}</p>
                  }
                  {
                    <p>{`也可以交给 Agent：通过 MCP 建屏、改文字、换背景，再一键导出。`}</p>
                  }
                </FeatureSection>
              }
            </div>
          }
          {
            <section className={`lp-statement`}>
              {
                <InkHeadline
                  className={`lp-display`}
                  text={`少一点排版，
多一点表达。`}
                />
              }
              {
                <Reveal
                  as={`p`}
                  className={`lp-statement-en`}
                  delay={0.08}
                >{`Less layout. More stage.`}</Reveal>
              }
              {
                <Reveal delay={0.14}>
                  {
                    <a
                      className={`lp-btn lp-btn-soft`}
                      href={`#layouts`}
                    >{`看看全部版式`}</a>
                  }
                </Reveal>
              }
            </section>
          }
          {
            <section className={`lp-closing`}>
              {
                <Reveal as={`h2`} className={`lp-display lp-closing-title`}>
                  {`下一场发布，`}
                  {<br />}
                  {`从这里开始。`}
                </Reveal>
              }
              {
                <Reveal
                  as={`p`}
                  className={`lp-lede`}
                  delay={0.08}
                >{`不用注册，打开就能做。内容只存在你的浏览器里。`}</Reveal>
              }
              {
                <Reveal className={`lp-closing-actions`} delay={0.14}>
                  {
                    <button
                      type={`button`}
                      className={`lp-btn lp-btn-dark`}
                      onClick={e}
                    >
                      {`开始制作`}
                      {<ArrowRight size={16} />}
                    </button>
                  }
                </Reveal>
              }
            </section>
          }
        </main>
      }
      {
        <footer className={`lp-footer`}>
          {<Wordmark />}
          {
            <nav aria-label={`页脚导航`}>
              {AF.map((e) => (
                <a href={e.href} key={e.href}>
                  {e.label}
                </a>
              ))}
            </nav>
          }
          {<span>{`Stage · 发布会工作台`}</span>}
        </footer>
      }
    </div>
  );
}
var AF = [
  { href: `#layouts`, label: `版式` },
  { href: `#workbench`, label: `编辑` },
  { href: `#ambience`, label: `背景` },
  { href: `#motion`, label: `转场` },
  { href: `#export`, label: `导出` },
];
function StickyHeader({ root: e, onEnter: t }) {
  let [n, r] = (0, React.useState)(!1);
  return (
    (0, React.useEffect)(() => {
      let t = e.current;
      if (!t) return;
      let n = () => r(t.scrollTop > t.clientHeight * 0.7);
      return (
        n(),
        t.addEventListener(`scroll`, n, { passive: !0 }),
        () => t.removeEventListener(`scroll`, n)
      );
    }, [e]),
    (
      <AnimatePresence>
        {n && (
          <motion.header
            className={`lp-header`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: BP }}
          >
            {
              <a href={`#top`} aria-label={`回到顶部`}>
                {<Wordmark />}
              </a>
            }
            {
              <nav aria-label={`页面导航`}>
                {AF.map((e) => (
                  <a href={e.href} key={e.href}>
                    {e.label}
                  </a>
                ))}
              </nav>
            }
            {
              <button
                type={`button`}
                className={`lp-btn lp-btn-pill`}
                onClick={t}
              >{`开始制作`}</button>
            }
          </motion.header>
        )}
      </AnimatePresence>
    )
  );
}
function SectionHeading({ eyebrow: e, title: t, children: n }) {
  return (
    <div className={`lp-section-head`}>
      {<Reveal className={`lp-eyebrow`}>{e}</Reveal>}
      {
        <Reveal as={`h2`} className={`lp-h2`} delay={0.05}>
          {t}
        </Reveal>
      }
      {n && (
        <Reveal as={`p`} className={`lp-lede`} delay={0.1}>
          {n}
        </Reveal>
      )}
    </div>
  );
}
function FeatureSection({
  id: e,
  eyebrow: t,
  title: n,
  children: r,
  demo: i,
  panel: a,
  reverse: o = !1,
}) {
  return (
    <section className={`lp-feature${o ? ` is-reverse` : ``}`} id={e}>
      {
        <div className={`lp-feature-text`}>
          {<Reveal className={`lp-eyebrow`}>{t}</Reveal>}
          {
            <Reveal as={`h2`} className={`lp-h3`} delay={0.05}>
              {n}
            </Reveal>
          }
          {
            <Reveal className={`lp-feature-body`} delay={0.1}>
              {r}
            </Reveal>
          }
        </div>
      }
      {
        <Reveal className={`lp-panel ${a}`} y={40}>
          {i}
        </Reveal>
      }
    </section>
  );
}
export default LandingPage;
