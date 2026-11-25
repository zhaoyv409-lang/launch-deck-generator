import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Plus } from "./WorkbenchIcons";
import { toast } from "sonner";
import { fontOptions, getSceneInk, scenePreset } from "./model";
const inkSwatches = [
  "#30384b",
  "#f4f6fa",
  "#e9e2d4",
  "#ffd166",
  "#5a7db8",
  "#b85a6e",
  "#38435c",
  "#70798c",
];
function TextStyleEditor({ scene, onChange, select }) {
  const [custom, setCustom] = React.useState(false);
  const ink = getSceneInk(scene),
    isOutro = scene.composition === "outro";
  return (
    <div className={`editor-font-inline`} data-editor-section={`text`}>
      {select(
        `文字字体`,
        scene.font || `sans`,
        fontOptions.map((e) => ({ value: e.id, label: e.label })),
        (e) => onChange({ font: e }),
      )}
      {select(
        `字号`,
        String(scene.fontSize || 1),
        [
          { value: `0.8`, label: `特小` },
          { value: `0.9`, label: `小` },
          { value: `1`, label: `标准` },
          { value: `1.15`, label: `大` },
          { value: `1.3`, label: `特大` },
        ],
        (e) => onChange({ fontSize: Number(e) === 1 ? void 0 : Number(e) }),
      )}
      {
        <div className={`editor-field`}>
          {<Label>{`文字颜色`}</Label>}
          {
            <div className={`flow-colors ink-swatches`}>
              {inkSwatches.map((e) => (
                <button
                  type={`button`}
                  aria-label={`文字配色 ${e}`}
                  disabled={
                    isOutro &&
                    getSceneInk({ composition: `outro`, textColor: e }) !== e
                  }
                  className={`ink-swatch ${ink === e ? `chosen` : ``}`}
                  style={{ backgroundColor: e }}
                  onClick={() => {
                    {
                      setCustom(!1);
                      onChange({ textColor: e });
                    }
                  }}
                  key={e}
                />
              ))}
              {
                <button
                  type={`button`}
                  className={`ink-swatch ink-custom ${custom ? `chosen` : ``}`}
                  aria-label={`自定义文字颜色`}
                  aria-expanded={custom}
                  title={`自定义颜色`}
                  onClick={() => setCustom((e) => !e)}
                >
                  {<Plus size={11} />}
                </button>
              }
              {custom && (
                <div className={`ink-custom-pop`}>
                  {
                    <Input
                      aria-label={`文字颜色 Hex`}
                      defaultValue={ink}
                      maxLength={7}
                      autoFocus={!0}
                      onBlur={(e) => {
                        let t = e.target.value.toLowerCase();
                        if (/^#[0-9a-f]{6}$/i.test(t)) {
                          if (
                            isOutro &&
                            getSceneInk({
                              composition: `outro`,
                              textColor: t,
                            }) !== t
                          ) {
                            e.target.value = ink;
                            toast.error(`收尾黑场请选择浅色文字`);
                          } else {
                            onChange({ textColor: t });
                          }
                        } else {
                          e.target.value = ink;
                          toast.error(`请输入完整的 Hex 颜色`);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === `Enter`) {
                          e.currentTarget.blur();
                        } else {
                          if (e.key === `Escape`) {
                            setCustom(!1);
                          }
                        }
                      }}
                      key={`inline-${scene.id}-${ink}`}
                    />
                  }
                </div>
              )}
            </div>
          }
        </div>
      }
      {
        <p
          className={`editor-help`}
        >{`字号只缩放本屏文字，表格与图表保持版式。`}</p>
      }
    </div>
  );
}
function MotionEditor({ scene, onChange, select, toggle, experience }) {
  const preset = scenePreset(scene),
    hasMotionContent = preset.headings + preset.texts + preset.photos > 0,
    canReplay =
      scene.motion &&
      (preset.headings + preset.texts > 0 ||
        (preset.photos > 0 && scene.photoEffect !== "still"));
  return (
    <div data-editor-section={`motion`}>
      {
        <div className={`editor-group-title`}>
          {<span>{`动效`}</span>}
          {<span>{scene.motion ? `已开启` : `默认轻淡入`}</span>}
        </div>
      }
      {toggle(
        `这一屏的灵动效果`,
        scene.motion,
        (e) => onChange({ motion: e }),
        !hasMotionContent,
      )}
      {select(
        `文字出场`,
        scene.textEffect,
        [
          { value: `fade`, label: `自然淡入（默认）` },
          { value: `blur`, label: `轻柔聚焦` },
          { value: `focus`, label: `呼吸聚焦` },
          { value: `drift`, label: `轻盈掠入` },
        ],
        (e) => onChange({ textEffect: e }),
        !scene.motion || preset.headings === 0,
      )}
      {preset.photos > 0 &&
        select(
          `图片效果`,
          scene.photoEffect || `still`,
          [
            { value: `still`, label: `静置呈现（默认）` },
            { value: `reveal`, label: `轻盈入场` },
            { value: `float`, label: `轻盈入场 + 持续轻浮` },
            { value: `lift`, label: `轻浮抬升 + 更深阴影` },
          ],
          (e) => onChange({ photoEffect: e }),
          !scene.motion,
        )}
      {
        <Button
          variant={`outline`}
          className={`replay-motion`}
          disabled={!canReplay}
          onClick={() => experience.current?.replay()}
        >
          {<RotateCcw size={14} />}
          {`重新感受这一屏`}
        </Button>
      }
      {
        <p className={`editor-help`}>
          {hasMotionContent
            ? `选好效果后点上方按钮预览；系统开启“减少动态效果”时自动收敛。`
            : `当前版式只播放视频，不使用文字或图片动效。`}
        </p>
      }
    </div>
  );
}
function ChartEditor({ scene, onChange, select, field }) {
  return (
    <ChartExtras
      scene={scene}
      onChange={onChange}
      data-editor-section={"chart"}
    >
      {
        <div className={`chart-editor`} data-editor-section={`chart`}>
          {
            <div className={`editor-group-title`}>
              {<span>{`图表数据`}</span>}
              {
                <span>
                  {scene.chart.type === `pie`
                    ? `饼图取第一组数值`
                    : `最多 12 个点 · ${scene.chart.series.length} 组数据`}
                </span>
              }
            </div>
          }
          {select(
            `图表类型`,
            scene.chart.type || `line`,
            [
              { value: `line`, label: `折线图` },
              { value: `bar`, label: `柱状图` },
              { value: `pie`, label: `饼状图` },
            ],
            (e) =>
              onChange({
                presetId:
                  e === `bar`
                    ? `chart-bar`
                    : e === `pie`
                      ? `chart-pie`
                      : `chart-line`,
                chart: { ...scene.chart, type: e },
              }),
          )}
          {field(
            `分类`,
            <div className={`chart-points`}>
              {scene.chart.categories.map((e, t) => (
                <Input
                  aria-label={`分类 ${t + 1}`}
                  value={e}
                  maxLength={12}
                  onChange={(e) =>
                    onChange({
                      chart: {
                        ...scene.chart,
                        categories: scene.chart.categories.map((n, r) =>
                          r === t ? e.target.value : n,
                        ),
                      },
                    })
                  }
                  key={t}
                />
              ))}
            </div>,
          )}
          {scene.chart.series.map((e, t) => (
            <div className={`chart-series`} key={e.id ?? t}>
              {
                <Input
                  aria-label={`系列 ${t + 1} 名称`}
                  value={e.label}
                  maxLength={20}
                  placeholder={`系列 ${t + 1} 名称`}
                  onChange={(e) =>
                    onChange({
                      chart: {
                        ...scene.chart,
                        series: scene.chart.series.map((n, r) =>
                          r === t ? { ...n, label: e.target.value } : n,
                        ),
                      },
                    })
                  }
                />
              }
              {
                <div className={`chart-points`}>
                  {scene.chart.categories.map((n, r) => (
                    <Input
                      aria-label={`系列 ${t + 1} 值 ${r + 1}`}
                      type={`number`}
                      value={e.values[r] ?? 0}
                      onChange={(e) =>
                        onChange({
                          chart: {
                            ...scene.chart,
                            series: scene.chart.series.map((n, i) =>
                              i === t
                                ? {
                                    ...n,
                                    values: n.values.map((t, n) =>
                                      n === r ? Number(e.target.value) || 0 : t,
                                    ),
                                  }
                                : n,
                            ),
                          },
                        })
                      }
                      key={r}
                    />
                  ))}
                </div>
              }
            </div>
          ))}
          {
            <div className={`chart-actions`}>
              {
                <Button
                  variant={`ghost`}
                  size={`sm`}
                  disabled={scene.chart.categories.length >= 12}
                  onClick={() =>
                    onChange({
                      chart: {
                        ...scene.chart,
                        categories: [
                          ...scene.chart.categories,
                          `第 ${scene.chart.categories.length + 1} 项`,
                        ],
                        series: scene.chart.series.map((e) => ({
                          ...e,
                          values: [...e.values, 0],
                        })),
                      },
                    })
                  }
                >{`加一个数据点`}</Button>
              }
              {
                <Button
                  variant={`ghost`}
                  size={`sm`}
                  disabled={scene.chart.categories.length <= 2}
                  onClick={() =>
                    onChange({
                      chart: {
                        ...scene.chart,
                        categories: scene.chart.categories.slice(0, -1),
                        series: scene.chart.series.map((e) => ({
                          ...e,
                          values: e.values.slice(0, -1),
                        })),
                      },
                    })
                  }
                >{`去掉最后一个点`}</Button>
              }
            </div>
          }
        </div>
      }
    </ChartExtras>
  );
}
function ChartExtras({ scene, onChange, children }) {
  return (
    <div data-editor-section={"chart"}>
      {children}
      {
        <div className={"stage-data-controls"}>
          {
            <label>
              {"\u6570\u503C\u5355\u4F4D"}
              {
                <input
                  aria-label={"\u56FE\u8868\u6570\u503C\u5355\u4F4D"}
                  value={scene.chartUnit || ""}
                  placeholder={
                    "\u4F8B\u5982\uFF1A\u4E2A\u52A8\u4F5C\u3001\u4E07\u5143\u3001%"
                  }
                  maxLength={24}
                  onChange={(e) => onChange({ chartUnit: e.target.value })}
                />
              }
            </label>
          }
          {
            <label>
              {
                <input
                  type={"checkbox"}
                  aria-label={
                    "\u663E\u793A\u56FE\u8868\u6570\u636E\u660E\u7EC6"
                  }
                  checked={scene.chartShowData !== false}
                  onChange={(e) =>
                    onChange({ chartShowData: e.target.checked })
                  }
                />
              }
              {
                "\u56FE\u8868\u4E0E\u660E\u7EC6\u7248\u5F0F\u663E\u793A\u6570\u503C\u8868"
              }
            </label>
          }
        </div>
      }
    </div>
  );
}
export { TextStyleEditor, MotionEditor, ChartEditor };
