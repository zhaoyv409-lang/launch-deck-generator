// Media composition recovered from the supplied n-build reference.
import * as React from "react";
function PhotoFrame({ aspect, caption, children }) {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState(null);
  React.useLayoutEffect(() => {
    if (aspect === "auto") {
      setSize(null);
      return;
    }
    const node = ref.current?.parentElement;
    if (!node) return;
    const ratio = aspect
      .split(":")
      .map(Number)
      .reduce((a, b) => a / b);
    const resize = () => {
      const w = node.clientWidth,
        h = node.clientHeight;
      setSize({
        width: Math.min(w, h * ratio),
        height: Math.min(h, w / ratio),
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    return () => observer.disconnect();
  }, [aspect]);
  return (
    <figure
      ref={ref}
      className={
        "photo-frame stage-photo-frame" + (caption ? " has-caption" : "")
      }
      style={size || undefined}
    >
      {children}
    </figure>
  );
}
function ScenePhotos({ scene, urls }) {
  const [opened, setOpened] = React.useState(null);
  const dialog = React.useRef(null);
  const opener = React.useRef(null);
  React.useEffect(() => {
    if (opened && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [opened]);
  const close = () => {
    dialog.current?.close();
    setOpened(null);
    opener.current?.focus();
  };
  return (
    <React.Fragment>
      {
        <div
          className={
            "photo-field material-" + scene.material + " stage-media-field"
          }
          aria-label={"\u56FE\u7247\u7EC4"}
        >
          {scene.photos.map((p, i) => {
            const angle = p.rotation ?? scene.photoRotation ?? 0,
              aspect = p.aspect || scene.photoAspect || "auto";
            return (
              <div
                key={p.id}
                className={"photo-slot photo-" + (i + 1) + " stage-photo-slot"}
                style={{
                  "--photo-angle": angle + "deg",
                  "--photo-aspect":
                    aspect === "auto" ? "auto" : aspect.replace(":", " / "),
                  "--photo-custom-aspect":
                    aspect === "auto" ? undefined : aspect.replace(":", " / "),
                }}
              >
                {
                  <PhotoFrame aspect={aspect} caption={p.caption}>
                    {
                      <button
                        className={"stage-image-open"}
                        type={"button"}
                        aria-label={"放大图片 " + (i + 1)}
                        title={
                          "\u70B9\u51FB\u67E5\u770B\u5B8C\u6574\u5927\u56FE"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          opener.current = e.currentTarget;
                          setOpened({
                            url: urls[p.mediaId],
                            caption: p.caption || "图片 " + (i + 1),
                          });
                        }}
                      >
                        {urls[p.mediaId] ? (
                          <img
                            decoding={"async"}
                            src={urls[p.mediaId]}
                            alt={p.caption || "图片 " + (i + 1)}
                            style={{
                              objectFit: p.fit || scene.fit || "contain",
                            }}
                            draggable={false}
                          />
                        ) : (
                          <span className={"missing-photo"}>
                            {"\u56FE\u7247\u5F85\u6DFB\u52A0"}
                          </span>
                        )}
                      </button>
                    }
                    {p.caption && <figcaption>{p.caption}</figcaption>}
                  </PhotoFrame>
                }
              </div>
            );
          })}
        </div>
      }
      {
        <dialog
          ref={dialog}
          role={"dialog"}
          aria-label={"\u67E5\u770B\u5B8C\u6574\u56FE\u7247"}
          className={"stage-image-viewer"}
          onCancel={close}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onClose={() => setOpened(null)}
        >
          {
            <button
              type={"button"}
              className={"stage-viewer-close"}
              aria-label={"\u5173\u95ED\u5927\u56FE"}
              onClick={close}
            >
              {"\u5173\u95ED \u00D7"}
            </button>
          }
          {opened && (
            <React.Fragment>
              {<img src={opened.url} alt={opened.caption} />}
              {<p>{opened.caption}</p>}
            </React.Fragment>
          )}
        </dialog>
      }
    </React.Fragment>
  );
}
function SceneTable({ scene }) {
  const rows = scene.table || [];
  if (!rows.length) return null;
  if (scene.presetId === "process-steps" && rows.length <= 7)
    return (
      <ol className={"stage-process"}>
        {rows.slice(1).map((r, i) => (
          <li key={i}>
            {
              <span className={"stage-step-no"}>
                {String(i + 1).padStart(2, "0")}
              </span>
            }
            {<h2>{r[0]}</h2>}
            {<p>{r[1]}</p>}
            {r[2] && (
              <div className={"stage-step-output"}>
                {<small>{rows[0][2] || "交付物"}</small>}
                {<strong>{r[2]}</strong>}
              </div>
            )}
            {r[3] && <p>{r[3]}</p>}
          </li>
        ))}
      </ol>
    );
  const status = (cell) =>
    /禁止|冲突|不通过/.test(cell)
      ? "is-negative"
      : /待|缺项|未明确/.test(cell)
        ? "is-pending"
        : /允许|通过|已完成/.test(cell)
          ? "is-positive"
          : "";
  return (
    <div
      className={
        "scene-table stage-data-table style-" +
        (scene.tableStyle || "striped") +
        " density-" +
        (scene.tableDensity || "comfortable")
      }
    >
      {
        <div className={"stage-table-scroll"}>
          {
            <table>
              {
                <thead>
                  {
                    <tr>
                      {rows[0].map((c, i) => (
                        <th key={i}>{c}</th>
                      ))}
                    </tr>
                  }
                </thead>
              }
              {
                <tbody>
                  {rows.slice(1).map((r, i) => (
                    <tr key={i}>
                      {rows[0].map((_, j) => (
                        <td key={j} className={status(r[j] || "")}>
                          {r[j] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              }
            </table>
          }
        </div>
      }
    </div>
  );
}
function SceneChart({ scene, component: Chart, animate }) {
  const chart = scene.chart;
  return (
    <React.Fragment>
      {
        <div className={"stage-chart-key"}>
          {scene.chartUnit && (
            <strong>
              {"\u5355\u4F4D\uFF1A"}
              {scene.chartUnit}
            </strong>
          )}
          {
            <div className={"stage-chart-legend"}>
              {chart.series.map((s, i) => (
                <span key={i}>
                  {
                    <i
                      style={{
                        background:
                          s.color || ["#39c89c", "#f47d78", "#5b83d6"][i],
                      }}
                    />
                  }
                  {s.label}
                </span>
              ))}
            </div>
          }
        </div>
      }
      {
        <React.Suspense
          fallback={
            <div className={"scene-chart"}>
              {"\u56FE\u8868\u8F7D\u5165\u4E2D\u2026"}
            </div>
          }
        >
          {
            <Chart
              chart={chart}
              ink={scene.textColor || "#30384b"}
              animate={animate}
            />
          }
        </React.Suspense>
      }
      {scene.presetId === "chart-insight" && scene.chartShowData !== false && (
        <div className={"stage-chart-values"}>
          {
            <table>
              {
                <thead>
                  {
                    <tr>
                      {<th>{"\u7C7B\u522B"}</th>}
                      {chart.series.map((s, i) => (
                        <th key={i}>{s.label}</th>
                      ))}
                    </tr>
                  }
                </thead>
              }
              {
                <tbody>
                  {chart.categories.map((c, i) => (
                    <tr key={i}>
                      {<th>{c}</th>}
                      {chart.series.map((s, j) => (
                        <td key={j}>{s.values[i] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              }
            </table>
          }
        </div>
      )}
    </React.Fragment>
  );
}

export { ScenePhotos, SceneTable, SceneChart };
