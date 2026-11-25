import * as React from "react";
function PresetPreview({ preset: e }) {
  let t = (t, n, r, i = !1) => (
      <g data-preview-part={`text`}>
        {Array.from({ length: e.headings }, (e, a) => {
          let o = r * (a ? 0.78 : 1);
          return (
            <rect
              x={i ? t + (r - o) / 2 : t}
              y={n + a * 8}
              width={o}
              height={4.5}
              rx={2}
              fill={`currentColor`}
              opacity={0.72}
              key={`h-${a}`}
            />
          );
        })}
        {Array.from({ length: e.texts }, (a, o) => {
          let s = r * (o ? 0.7 : 0.9);
          return (
            <rect
              x={i ? t + (r - s) / 2 : t}
              y={n + e.headings * 8 + 6 + o * 5}
              width={s}
              height={2.5}
              rx={1.25}
              fill={`currentColor`}
              opacity={0.38}
              key={`t-${o}`}
            />
          );
        })}
      </g>
    ),
    n = ({ x: e, y: t, w: n, h: r, rotate: i = 0 }, a) => (
      <g
        data-preview-part={`photo`}
        transform={`rotate(${i} ${e + n / 2} ${t + r / 2})`}
        key={a}
      >
        {
          <rect
            x={e}
            y={t}
            width={n}
            height={r}
            rx={3}
            fill={`var(--hark-preview-photo)`}
            stroke={`currentColor`}
            strokeOpacity={0.32}
            strokeWidth={1.3}
          />
        }
        {
          <circle
            cx={e + n * 0.73}
            cy={t + r * 0.27}
            r={Math.min(n, r) * 0.09}
            fill={`currentColor`}
            opacity={0.32}
          />
        }
        {
          <path
            d={`M${e + n * 0.13},${t + r * 0.79} L${e + n * 0.41},${t + r * 0.46} L${e + n * 0.62},${t + r * 0.69} L${e + n * 0.78},${t + r * 0.51} L${e + n * 0.9},${t + r * 0.79}`}
            fill={`none`}
            stroke={`currentColor`}
            strokeOpacity={0.32}
            strokeWidth={1.4}
            strokeLinecap={`round`}
            strokeLinejoin={`round`}
          />
        }
      </g>
    ),
    r;
  if (e.composition === `outro`) r = t(35, e.headings > 1 ? 33 : 38, 90, !0);
  else if (e.composition === `cinema`) {
    let n =
      e.id === `film`
        ? { x: 7, y: 7, w: 146, h: 76 }
        : {
            x: 18,
            y: e.headings > 1 ? 42 : 35,
            w: 124,
            h: e.headings > 1 ? 35 : 42,
          };
    r = (
      <React.Fragment>
        {e.id !== `film` && t(18, 12, 95)}
        {
          <g data-preview-part={`video`}>
            {
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={5}
                fill={`currentColor`}
                opacity={0.15}
              />
            }
            {
              <path
                d={`M75,${n.y + n.h / 2 - 7} l12,7 -12,7 z`}
                fill={`currentColor`}
                opacity={0.65}
              />
            }
          </g>
        }
      </React.Fragment>
    );
  } else if (e.composition === `chart`) {
    let n = e.id === `chart-full` ? 20 : 38;
    r = (
      <React.Fragment>
        {t(18, 11, 100)}
        {
          <g data-preview-part={`chart`}>
            {
              <path
                d={`M24,${n} V77 H139`}
                fill={`none`}
                stroke={`currentColor`}
                strokeOpacity={0.2}
                strokeWidth={1.4}
              />
            }
            {e.id === `chart-pie` ? (
              <React.Fragment>
                {
                  <circle
                    cx={83}
                    cy={58}
                    r={20}
                    fill={`currentColor`}
                    opacity={0.22}
                  />
                }
                {
                  <path
                    d={`M83,58 V38 A20,20 0 0 1 100,68 Z`}
                    fill={`currentColor`}
                    opacity={0.7}
                  />
                }
              </React.Fragment>
            ) : e.id === `chart-bar` ? (
              [18, 28, 23, 36, 32].map((e, t) => (
                <rect
                  x={35 + t * 19}
                  y={76 - e}
                  width={10}
                  height={e}
                  rx={2}
                  fill={`currentColor`}
                  opacity={0.35 + t * 0.09}
                  key={t}
                />
              ))
            ) : (
              <polyline
                points={`29,71 50,64 71,67 92,48 113,53 136,${n + 4}`}
                fill={`none`}
                stroke={`currentColor`}
                strokeWidth={2.5}
                strokeLinecap={`round`}
                strokeLinejoin={`round`}
                opacity={0.65}
              />
            )}
          </g>
        }
      </React.Fragment>
    );
  } else if (e.composition === `table`) {
    let n = e.id === `table-notes`,
      i = n
        ? { x: 79, y: 17, w: 68, h: 58 }
        : e.id === `table-focus`
          ? { x: 36, y: 32, w: 88, h: 43 }
          : {
              x: 18,
              y: e.id === `table-metrics` ? 31 : 39,
              w: 124,
              h: e.id === `table-metrics` ? 46 : 38,
            },
      a = e.sampleTable?.[0]?.length || 3;
    r = (
      <React.Fragment>
        {t(n ? 13 : 18, n ? 29 : 11, n ? 55 : 100, e.align === `center`)}
        {
          <g data-preview-part={`table`}>
            {
              <rect
                x={i.x}
                y={i.y}
                width={i.w}
                height={i.h}
                rx={3}
                fill={`currentColor`}
                fillOpacity={0.05}
                stroke={`currentColor`}
                strokeOpacity={0.3}
              />
            }
            {
              <rect
                x={i.x}
                y={i.y}
                width={i.w}
                height={i.h / 4}
                rx={2}
                fill={`currentColor`}
                opacity={0.15}
              />
            }
            {[1, 2, 3].map((e) => (
              <path
                d={`M${i.x},${i.y + (i.h / 4) * e} h${i.w}`}
                stroke={`currentColor`}
                strokeOpacity={0.25}
                key={`r${e}`}
              />
            ))}
            {Array.from({ length: a - 1 }, (e, t) => (
              <path
                d={`M${i.x + (i.w / a) * (t + 1)},${i.y} v${i.h}`}
                stroke={`currentColor`}
                strokeOpacity={0.22}
                key={`c${t}`}
              />
            ))}
          </g>
        }
      </React.Fragment>
    );
  } else if (!e.photos)
    r = t(
      e.align === `center` ? 34 : 23,
      e.headings > 1 ? 31 : 35,
      e.align === `center` ? 92 : 110,
      e.align === `center`,
    );
  else if (e.id === `image`) r = n({ x: 28, y: 13, w: 104, h: 64 }, 0);
  else if (e.composition === `gallery`) {
    let i =
      e.photos === 4
        ? [
            { x: 25, y: 38, w: 49, h: 18 },
            { x: 82, y: 38, w: 49, h: 18 },
            { x: 25, y: 63, w: 49, h: 18 },
            { x: 82, y: 63, w: 49, h: 18 },
          ]
        : [
            { x: 25, y: 38, w: 33, h: 43 },
            { x: 65, y: 38, w: 31, h: 18 },
            { x: 103, y: 38, w: 31, h: 18 },
            { x: 65, y: 63, w: 31, h: 18 },
            { x: 103, y: 63, w: 31, h: 18 },
            { x: 121, y: 70, w: 25, h: 15, rotate: -7 },
          ];
    r = (
      <React.Fragment>
        {t(25, 11, 100)}
        {i.map(n)}
      </React.Fragment>
    );
  } else {
    let i =
      e.photos === 3
        ? [
            { x: 91, y: 13, w: 36, h: 49, rotate: -7 },
            { x: 116, y: 33, w: 31, h: 43, rotate: 8 },
            { x: 86, y: 60, w: 32, h: 23, rotate: -5 },
          ]
        : e.photos === 2
          ? [
              { x: 91, y: 14, w: 43, h: 53, rotate: -4 },
              { x: 117, y: 57, w: 27, h: 25, rotate: 7 },
            ]
          : [{ x: 93, y: 17, w: 49, h: 59, rotate: -3 }];
    r = (
      <React.Fragment>
        {t(15, e.headings > 1 ? 29 : 33, 60)}
        {i.map(n)}
      </React.Fragment>
    );
  }
  return (
    <div
      className={`preset-preview preview-${e.id}`}
      data-preset-preview={e.id}
      aria-hidden={`true`}
    >
      {
        <svg
          viewBox={`0 0 160 90`}
          preserveAspectRatio={`xMidYMid meet`}
          focusable={`false`}
        >
          {r}
        </svg>
      }
    </div>
  );
}

export default PresetPreview;
