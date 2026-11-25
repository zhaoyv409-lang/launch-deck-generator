// UI structure recovered from the supplied n-build reference.
import * as React from "react";
import {
  Type,
  Image,
  ChartNoAxesCombined,
  Palette,
  Sparkles,
  Layers,
  Info,
  ArrowLeft,
  ChevronRight,
  X,
  ArrowRight,
  Pencil,
  Download,
} from "./WorkbenchIcons";
import { Button } from "@/components/ui/button";
function collectSections(e, t = new Map()) {
  return (
    React.Children.forEach(e, (e) => {
      if ((0, React.isValidElement)(e)) {
        if (e.type === React.Fragment) {
          collectSections(e.props.children, t);
        } else {
          if (e.props[`data-editor-section`]) {
            t.set(e.props[`data-editor-section`], e);
          } else {
            if (e.props.id === `background-unavailable`) {
              t.set(`background-unavailable`, e);
            }
          }
        }
      }
    }),
    t
  );
}
function EditorNavigation({
  scope: e,
  selected: t,
  onSelect: n,
  scene: r,
  children: i,
}) {
  let a = collectSections(i),
    o = (
      e === `content`
        ? [
            {
              id: `copy`,
              title: `文字与脚注`,
              note: `${r.headings.length} 个标题 · ${r.texts.length} 段正文`,
              icon: Type,
              ids: [`headings`, `texts`, `footnote`],
            },
            {
              id: `media`,
              title: `图片与视频`,
              note: r.videoId
                ? `本地视频 · 封面与播放`
                : `${r.photos.length} 张图片 · 替换与排序`,
              icon: Image,
              ids: [`photos`, `video`],
            },
            {
              id: `data`,
              title: `图表与表格`,
              note: `编辑数据，画面即时更新`,
              icon: ChartNoAxesCombined,
              ids: [`chart`, `table`],
            },
            {
              id: `text`,
              title: `文字样式`,
              note: `字体、字号与颜色`,
              icon: Palette,
              ids: [`text`],
            },
            {
              id: `motion`,
              title: `入场与动效`,
              note: `文字出场、图片与预览`,
              icon: Sparkles,
              ids: [`motion`],
            },
            {
              id: `manage`,
              title: `管理这一屏`,
              note: `复制、调整顺序或移除`,
              icon: Layers,
              ids: [`manage`],
            },
          ]
        : [
            {
              id: `name`,
              title: `作品名称`,
              note: `修改项目与导出文件的名称`,
              icon: Type,
              ids: [`name`],
            },
            {
              id: `background`,
              title: `背景与配色`,
              note: `背景样式、色板与流动速度`,
              icon: Palette,
              ids: [`background`],
            },
            {
              id: `transition`,
              title: `切屏转场`,
              note: `让每一屏自然衔接`,
              icon: Sparkles,
              ids: [`transition`],
            },
          ]
    ).filter((e) => e.ids.some((e) => a.has(e))),
    s = o.find((e) => e.id === t || e.ids.includes(t));
  return s ? (
    <div className={`hark-editor-detail`} key={s.id}>
      {
        <Button
          variant={`ghost`}
          className={`hark-back-row`}
          onClick={() => n(``)}
        >
          {<ArrowLeft size={14} />}
          {`返回`}
          {e === `content` ? `当前屏` : `整场设置`}
        </Button>
      }
      {
        <header className={`hark-detail-heading`}>
          {<s.icon size={24} />}
          {<h2>{s.title}</h2>}
          {<p>{s.note}</p>}
        </header>
      }
      {
        <div className={`hark-detail-fields`}>
          {s.id === `background` && a.get(`background-unavailable`)}
          {s.ids.map((e) => (
            <React.Fragment key={e}>{a.get(e)}</React.Fragment>
          ))}
        </div>
      }
    </div>
  ) : (
    <div className={`hark-editor-overview`}>
      {
        <div className={`hark-overview-caption`}>
          {<span>{e === `content` ? `这一屏的设置` : `整场的设置`}</span>}
          {<span>{e === `content` ? `只影响当前屏` : `应用于整个作品`}</span>}
        </div>
      }
      {e === `content` && (
        <div className={`hark-preset-card`}>{a.get(`preset`)}</div>
      )}
      {
        <div className={`hark-setting-group`}>
          {o.map((e) => (
            <Button
              variant={`ghost`}
              className={`hark-setting-row`}
              onClick={() => n(e.id)}
              key={e.id}
            >
              {
                <span className={`hark-setting-icon`}>
                  {<e.icon size={20} />}
                </span>
              }
              {
                <span className={`hark-setting-copy`}>
                  {<strong>{e.title}</strong>}
                  {<small>{e.note}</small>}
                </span>
              }
              {<ChevronRight size={14} />}
            </Button>
          ))}
        </div>
      }
      {e === `content` && (
        <p className={`hark-context-note`}>
          {<Info size={14} />}
          {`背景与转场在「整场设置」中调整。`}
        </p>
      )}
    </div>
  );
}
const tourSteps = [
  {
    id: `navigate`,
    title: `先认识你的舞台`,
    body: `这里就是你的演示画面。点击底部页码切换页面，也可以使用方向键。右侧的 ＋ 可以新增一屏。`,
    icon: Layers,
    target: `.scene-dock`,
  },
  {
    id: `copy`,
    title: `把想法写进来`,
    body: `在「文字与脚注」中修改标题和正文，画布会即时更新。内容自动保存在这个浏览器里。`,
    icon: Pencil,
    target: `.flow-editor`,
  },
  {
    id: `media`,
    title: `换成自己的素材`,
    body: `打开「图片与视频」替换照片、调整顺序或上传视频。在设置首页点击「更换版式」，选择适合内容的排版。`,
    icon: Image,
    target: `.flow-editor`,
  },
  {
    id: `background`,
    title: `给整场选一种氛围`,
    body: `在「整场设置」中选择背景与色板。切屏转场也在这里；每屏的文字与入场动效可以单独设置。`,
    icon: Palette,
    target: `.flow-editor`,
  },
  {
    id: `export`,
    title: `准备好，就带走`,
    body: `点击右上角的「导出」。PPT 适合会议交付，HTML 双击就能播放，ZIP 运行包可以离线演示并重新导入编辑。`,
    icon: Download,
    target: `.export-button`,
  },
];
function WorkbenchTour({ onNavigate: e, onClose: t }) {
  let [n, r] = (0, React.useState)(0),
    [i, a] = (0, React.useState)(null),
    o = tourSteps[n];
  return (
    (0, React.useEffect)(() => {
      e(o.id);
    }, [o.id, e]),
    (0, React.useEffect)(() => {
      let e = () =>
        a(document.querySelector(o.target)?.getBoundingClientRect() || null);
      e();
      let n = window.setTimeout(e, 260),
        r = new ResizeObserver(e),
        i = document.querySelector(o.target);
      {
        if (i) {
          r.observe(i);
        }
        window.addEventListener(`resize`, e);
      }
      let s = (e) => {
        if (e.key === `Escape`) {
          e.preventDefault();
          t();
        }
      };
      return (
        window.addEventListener(`keydown`, s),
        () => {
          {
            clearTimeout(n);
            r.disconnect();
            window.removeEventListener(`resize`, e);
            window.removeEventListener(`keydown`, s);
          }
        }
      );
    }, [o.target, n, t]),
    (
      <React.Fragment>
        {i && (
          <div
            className={`hark-tour-highlight`}
            aria-hidden={!0}
            style={{
              top: i.top - 5,
              left: i.left - 5,
              width: i.width + 10,
              height: i.height + 10,
            }}
          />
        )}
        {
          <section
            className={`hark-guide`}
            role={`region`}
            aria-label={`新手教程`}
            data-hark-surface={!0}
          >
            {
              <div className={`hark-guide-top`}>
                {
                  <span>
                    {`快速上手 `}
                    {
                      <span>
                        {String(n + 1).padStart(2, `0`)}
                        {` / 05`}
                      </span>
                    }
                  </span>
                }
                {
                  <Button
                    variant={`ghost`}
                    size={`icon`}
                    aria-label={`关闭新手教程`}
                    onClick={t}
                  >
                    {<X size={14} />}
                  </Button>
                }
              </div>
            }
            {<div className={`hark-guide-symbol`}>{<o.icon size={24} />}</div>}
            {<h2>{o.title}</h2>}
            {<p>{o.body}</p>}
            {
              <div
                className={`hark-guide-progress`}
                aria-label={`第 ${n + 1} 步，共 5 步`}
              >
                {tourSteps.map((e, t) => (
                  <span className={t <= n ? `done` : ``} key={e.id} />
                ))}
              </div>
            }
            {
              <footer>
                {
                  <Button
                    variant={`ghost`}
                    onClick={n ? () => r((e) => e - 1) : t}
                  >
                    {n ? (
                      <React.Fragment>
                        {<ArrowLeft size={14} />}
                        {`上一步`}
                      </React.Fragment>
                    ) : (
                      `稍后再看`
                    )}
                  </Button>
                }
                {
                  <Button
                    onClick={
                      n === tourSteps.length - 1 ? t : () => r((e) => e + 1)
                    }
                  >
                    {n === tourSteps.length - 1 ? (
                      <React.Fragment>
                        {`开始制作`}
                        {<ArrowRight size={14} />}
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        {`下一步`}
                        {<ChevronRight size={14} />}
                      </React.Fragment>
                    )}
                  </Button>
                }
              </footer>
            }
          </section>
        }
      </React.Fragment>
    )
  );
}
export { EditorNavigation, WorkbenchTour };
