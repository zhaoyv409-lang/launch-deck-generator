import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Check } from "./WorkbenchIcons";
import { toast } from "sonner";
import { palettes, backgroundKinds } from "./model";
function BackgroundEditor({
  project,
  update,
  backgroundUnavailable,
  paletteAllScenes,
  setPaletteAllScenes,
  choosePalette,
  toggle,
}) {
  return (
    <fieldset
      className={`background-settings`}
      data-editor-section={`background`}
      aria-label={`背景设置`}
      disabled={backgroundUnavailable}
      aria-describedby={
        backgroundUnavailable ? `background-unavailable` : void 0
      }
    >
      {
        <div className={`editor-group-title`}>
          {<span>{`背景样式`}</span>}
          {
            <span>
              {backgroundUnavailable ? `此版式不使用全局背景` : `全网页共用`}
            </span>
          }
        </div>
      }
      {
        <div className={`flow-bgkinds`}>
          {backgroundKinds.map((t) => (
            <Button
              variant={`outline`}
              className={project.background.kind === t.id ? `chosen` : ``}
              onClick={() =>
                update((project) => ({
                  ...project,
                  background: {
                    ...project.background,
                    kind: t.id,
                    preset: `custom`,
                  },
                }))
              }
              key={t.id}
            >
              {<span>{t.label}</span>}
              {project.background.kind === t.id && <Check size={12} />}
            </Button>
          ))}
        </div>
      }
      {
        <div className={`editor-group-title`}>
          {<span>{`底色色板`}</span>}
          {
            <span>
              {`背景全站应用，文字色`}
              {paletteAllScenes ? `全站匹配` : `仅本屏匹配`}
            </span>
          }
        </div>
      }
      {toggle(`文字色应用到全部屏`, paletteAllScenes, setPaletteAllScenes)}
      {
        <div className={`flow-palettes`}>
          {palettes.map((t) => (
            <Button
              variant={`outline`}
              className={
                project.background.preset === t.id &&
                project.background.kind === t.kind
                  ? `chosen`
                  : ``
              }
              onClick={() => choosePalette(t)}
              key={t.id}
            >
              {
                <span
                  style={{
                    background: `linear-gradient(125deg,${t.colors.join(`,`)})`,
                  }}
                />
              }
              {<span>{t.label}</span>}
              {project.background.preset === t.id &&
                project.background.kind === t.kind && <Check size={12} />}
            </Button>
          ))}
        </div>
      }
      {
        <div className={`editor-field`}>
          {<Label>{`自定义配色`}</Label>}
          {
            <div className={`flow-colors`}>
              {project.background.colors.map((t, n) => (
                <div
                  className={`flow-color`}
                  key={`${n}-${project.background.preset}`}
                >
                  {<span style={{ backgroundColor: t }} />}
                  {
                    <Input
                      aria-label={`背景颜色 ${n + 1}`}
                      disabled={
                        (project.background.kind === `solid` && n > 0) ||
                        (project.background.kind === `clouds2` && n === 2)
                      }
                      defaultValue={t}
                      maxLength={7}
                      onBlur={(t) => {
                        let r = t.target.value;
                        if (/^#[0-9a-f]{6}$/i.test(r)) {
                          update((project) => ({
                            ...project,
                            background: {
                              ...project.background,
                              preset: `custom`,
                              colors: project.background.colors.map(
                                (project, t) => (t === n ? r : project),
                              ),
                            },
                          }));
                        } else {
                          t.target.value = project.background.colors[n];
                          toast.error(`请填写完整的 Hex 颜色，例如 #e7eaf7`);
                        }
                      }}
                      onKeyDown={(project) => {
                        if (project.key === `Enter`) {
                          project.currentTarget.blur();
                        }
                      }}
                    />
                  }
                </div>
              ))}
            </div>
          }
        </div>
      }
      {!backgroundUnavailable &&
        (project.background.kind === `solid` ||
          project.background.kind === `clouds2`) && (
          <p
            className={`editor-help`}
          >{`灰色的色位不参与当前背景，切换背景样式后可继续使用。`}</p>
        )}
      {project.background.kind !== `solid` && (
        <React.Fragment>
          {
            <div className={`editor-field`}>
              {
                <div className={`editor-group-title`}>
                  {<Label>{`背景流动速度`}</Label>}
                  {
                    <span>
                      {project.background.paused
                        ? `取消暂停后可调节`
                        : `${project.background.speed.toFixed(2)}×`}
                    </span>
                  }
                </div>
              }
              {
                <Slider
                  aria-label={`背景流动速度`}
                  value={[project.background.speed]}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={backgroundUnavailable || project.background.paused}
                  onValueChange={(project) =>
                    update((t) => ({
                      ...t,
                      background: { ...t.background, speed: project[0] },
                    }))
                  }
                />
              }
            </div>
          }
          {toggle(
            `暂停背景`,
            project.background.paused,
            (project) =>
              update((t) => ({
                ...t,
                background: { ...t.background, paused: project },
              })),
            backgroundUnavailable,
          )}
        </React.Fragment>
      )}
    </fieldset>
  );
}
export default BackgroundEditor;
