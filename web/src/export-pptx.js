// Static PPT layout recovered from the supplied reference build.
import PptxGenJS from "pptxgenjs";
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
import {
  scenePreset as r,
  getSceneInk as a,
  referencedMedia as i,
} from "./model";
const slideWidth = 13.333;
const slideHeight = 7.5;
const chartColors = [`5a7db8`, `b87d5a`, `5ab87d`];
const fontFaces = {
  courier: `Courier New`,
  serif: `Georgia`,
  georgia: `Georgia`,
  arial: `Arial`,
  trebuchet: `Trebuchet MS`,
  verdana: `Verdana`,
  alimama: `Alimama ShuHeiTi`,
  montserrat: `Montserrat`,
  poppins: `Poppins`,
  lato: `Lato`,
  raleway: `Raleway`,
  playfair: `Playfair Display`,
  bebas: `Bebas Neue`,
};
const sceneFont = (e) => fontFaces[e.font || `sans`] || `Microsoft YaHei`;
const brightness = (e) =>
  [0.2126, 0.7152, 0.0722].reduce(
    (t, n, r) => t + n * parseInt(e.slice(1 + r * 2, 3 + r * 2), 16),
    0,
  );
const containImage = (e, t, n, r, i, a) => {
  let o = Math.min(i / e, a / t),
    s = e * o,
    c = t * o;
  return { x: n + (i - s) / 2, y: r + (a - c) / 2, w: s, h: c };
};
function fitText(e, t, n, r, i) {
  let a = (n) =>
      (e
        .split(
          `
`,
        )
        .reduce((e, r) => {
          let i = Array.from(r).reduce(
            (e, t) => e + (t.codePointAt(0) > 255 ? 1 : 0.58),
            0,
          );
          return e + Math.max(1, Math.ceil((i * n) / (t * 72)));
        }, 0) *
        n *
        i) /
        72 +
      0.08,
    o = n;
  for (; o > 10 && a(o) > r;) o--;
  return { fontSize: o, h: Math.min(r, a(o)) };
}
async function videoStill(e) {
  if (typeof document > `u`) return;
  let t = URL.createObjectURL(e.blob),
    n = document.createElement(`video`);
  {
    n.muted = !0;
    n.preload = `auto`;
    n.playsInline = !0;
  }
  try {
    return await new Promise((r, i) => {
      let a = setTimeout(
          () =>
            i(
              Error(
                `无法读取视频「${e.name}」的静态画面，请设置封面后再导出 PPT`,
              ),
            ),
          15e3,
        ),
        o = () => {
          {
            clearTimeout(a);
            i(Error(`无法读取视频「${e.name}」，请设置封面后再导出 PPT`));
          }
        },
        s = () => {
          try {
            let e = Math.min(1, 1920 / n.videoWidth),
              t = document.createElement(`canvas`);
            {
              t.width = Math.round(n.videoWidth * e);
              t.height = Math.round(n.videoHeight * e);
            }
            let i = t.getContext(`2d`);
            if (!i || !t.width || !t.height) {
              o();
              return;
            }
            {
              i.drawImage(n, 0, 0, t.width, t.height);
              clearTimeout(a);
              r({
                data: t.toDataURL(`image/jpeg`, 0.9),
                width: t.width,
                height: t.height,
              });
            }
          } catch {
            o();
          }
        };
      {
        n.onerror = o;
        n.onloadeddata = () => {
          n.onloadeddata = null;
          let e = Number.isFinite(n.duration)
            ? Math.min(0.5, n.duration / 2)
            : 0;
          if (e > 0) {
            n.onseeked = s;
            n.currentTime = e;
          } else {
            s();
          }
        };
        n.src = t;
      }
    });
  } finally {
    {
      n.pause();
      n.removeAttribute(`src`);
      n.load();
      URL.revokeObjectURL(t);
    }
  }
}
const dataUrl = async (e) => {
  if (typeof FileReader < `u`)
    return new Promise((t, n) => {
      let r = new FileReader();
      {
        r.onload = () => t(r.result);
        r.onerror = () => n(r.error);
        r.readAsDataURL(e);
      }
    });
  let t = new Uint8Array(await e.arrayBuffer()),
    n = ``;
  for (let e = 0; e < t.length; e += 32768)
    n += String.fromCharCode(...t.subarray(e, e + 32768));
  return `data:${e.type || `application/octet-stream`};base64,${btoa(n)}`;
};
async function imageSize(e, t) {
  if (e.width && e.height) return { width: e.width, height: e.height };
  if (typeof Image < `u`) {
    let e = new Image();
    return (
      (e.src = t),
      await e.decode(),
      { width: e.naturalWidth, height: e.naturalHeight }
    );
  }
  return { width: 4, height: 3 };
}
async function addPhotos(slide, scene, media, variants, area) {
  const photos = scene.photos;
  if (!photos.length) return;
  const gap = 0.18,
    count = photos.length;
  let columns =
    count === 1
      ? 1
      : count === 2
        ? 2
        : count === 3 && scene.presetId === "screenshot-trio"
          ? 3
          : Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  let boxes = photos.map((_, i) => ({
    x: area.x + ((i % columns) * (area.w + gap)) / columns,
    y: area.y + (Math.floor(i / columns) * (area.h + gap)) / rows,
    w: (area.w - gap * (columns - 1)) / columns,
    h: (area.h - gap * (rows - 1)) / rows,
  }));
  if (scene.presetId === "evidence-stack" && count === 3)
    boxes = [
      { ...area, w: area.w * 0.56 },
      {
        x: area.x + area.w * 0.58,
        y: area.y,
        w: area.w * 0.42,
        h: (area.h - gap) / 2,
      },
      {
        x: area.x + area.w * 0.58,
        y: area.y + (area.h + gap) / 2,
        w: area.w * 0.42,
        h: (area.h - gap) / 2,
      },
    ];
  for (const [i, photo] of photos.entries()) {
    const source = media.get(photo.mediaId);
    if (!source?.type.startsWith("image/")) continue;
    let data = await dataUrl(source.blob);
    const size = await imageSize(source, data);
    let box = boxes[i],
      captionHeight = photo.caption?.trim() ? 0.3 : 0;
    const aspect = photo.aspect || scene.photoAspect;
    if (aspect && aspect !== "auto") {
      const [a, b] = aspect.split(":").map(Number),
        ratio = a / b,
        w = Math.min(box.w, box.h * ratio),
        h = Math.min(box.h, box.w / ratio);
      box = { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
    }
    const fit = photo.fit || scene.fit || "contain";
    if (fit === "cover" && typeof document !== "undefined") {
      const image = new Image();
      image.src = data;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(box.w * 180);
      canvas.height = Math.round((box.h - captionHeight) * 180);
      const scale = Math.max(
        canvas.width / size.width,
        canvas.height / size.height,
      );
      canvas
        .getContext("2d")
        .drawImage(
          image,
          (canvas.width - size.width * scale) / 2,
          (canvas.height - size.height * scale) / 2,
          size.width * scale,
          size.height * scale,
        );
      data = canvas.toDataURL("image/png");
    }
    const position =
      fit === "cover"
        ? { x: box.x, y: box.y, w: box.w, h: box.h - captionHeight }
        : containImage(
            size.width,
            size.height,
            box.x,
            box.y,
            box.w,
            box.h - captionHeight,
          );
    slide.addImage({
      data,
      ...position,
      rotate: photo.rotation ?? scene.photoRotation ?? 0,
    });
    if (photo.caption)
      slide.addText(photo.caption, {
        x: box.x,
        y: box.y + box.h - captionHeight,
        w: box.w,
        h: captionHeight,
        fontFace: sceneFont(scene),
        fontSize: 13,
        color: scene.textColor?.replace("#", "") || "30384b",
        margin: 0,
        align: "left",
      });
  }
}
function isEvidenceLayout(scene) {
  return /^(screenshot-|report-pair|evidence-stack)/.test(scene.presetId || "");
}
function addProcessSteps(slide, scene, ink, y) {
  const rows = scene.table.slice(1),
    gap = 0.18,
    w = (11.933 - gap * (rows.length - 1)) / rows.length,
    h = 6.8 - y;
  for (const [r, row] of rows.entries()) {
    const x = 0.7 + r * (w + gap),
      font = rows.length > 4 ? 16 : 19;
    slide.addShape("rect", {
      x,
      y,
      w,
      h,
      fill: { color: "FFFFFF", transparency: 14 },
      line: { color: ink, transparency: 80, pt: 0.5 },
    });
    slide.addText(String(r + 1).padStart(2, "0"), {
      x: x + 0.15,
      y: y + 0.15,
      w: w - 0.3,
      h: 0.3,
      fontSize: 16,
      color: ink,
      transparency: 40,
      margin: 0,
    });
    slide.addText(row[0], {
      x: x + 0.15,
      y: y + 0.7,
      w: w - 0.3,
      h: 0.8,
      fontFace: sceneFont(scene),
      fontSize: 24,
      bold: true,
      color: ink,
      margin: 0,
      fit: "shrink",
    });
    slide.addText(row[1] || "", {
      x: x + 0.15,
      y: y + 1.6,
      w: w - 0.3,
      h: 1.1,
      fontFace: sceneFont(scene),
      fontSize: font,
      color: ink,
      margin: 0,
      fit: "shrink",
    });
    slide.addText(row[2] || "", {
      x: x + 0.15,
      y: y + h - 1,
      w: w - 0.3,
      h: 0.55,
      fontFace: sceneFont(scene),
      fontSize: font,
      bold: true,
      color: ink,
      margin: 0,
      fit: "shrink",
    });
    if (row[3])
      slide.addText(row[3], {
        x: x + 0.15,
        y: y + h - 0.45,
        w: w - 0.3,
        h: 0.35,
        fontFace: sceneFont(scene),
        fontSize: 12,
        color: ink,
        transparency: 30,
        margin: 0,
        fit: "shrink",
      });
  }
}
async function exportProjectPptx(e, t, n = []) {
  let d = new Map(t.map((e) => [e.id, e]));
  if (i(e).some((e) => !d.has(e)))
    throw Error(`项目中存在缺失素材，请补充后再导出 PPT`);
  let f = new Map();
  for (let e of n) f.set(e.mediaId, [...(f.get(e.mediaId) || []), e]);
  let p = new PptxGenJS();
  {
    p.defineLayout({ name: `WIDE`, width: slideWidth, height: slideHeight });
    p.layout = `WIDE`;
    p.title = e.name;
  }
  let m = new Map();
  for (let t of e.scenes) {
    let n = r(t),
      i = a(t).replace(`#`, ``),
      o = t.composition === `outro` || brightness(e.background.colors[0]) < 128,
      s =
        t.composition === `outro`
          ? `0d0f14`
          : e.background.colors[0].replace(`#`, ``),
      c = p.addSlide();
    c.background = { color: s };
    let l = n.photos > 0 && t.photos.length > 0,
      u = t.composition === `chart` || t.composition === `table`,
      h = t.composition === `cinema` && !!(t.videoId || t.posterId),
      g = t.align === `center`,
      _ = isEvidenceLayout(t)
        ? { x: 0.7, y: 0.6, w: 11.933, h: 1.5 }
        : l && !g
          ? { x: 0.7, y: 0.9, w: 5.2, h: 5.7 }
          : { x: 0.7, y: 0.7, w: 11.933, h: g ? 2.6 : 5.7 },
      v = _.y,
      y = t.fontSize || 1,
      b = t.headings.filter(Boolean),
      x = u || h || (l && g) ? 3.1 : 6.7;
    if (b.length) {
      let e = b.join(`
`),
        n = fitText(
          e,
          _.w,
          Math.round((b.length > 1 ? 32 : 40) * y),
          u || h ? 1.15 : 2.2,
          1.12,
        );
      {
        c.addText(e, {
          x: _.x,
          y: v,
          w: _.w,
          ...n,
          fontFace: sceneFont(t),
          bold: !0,
          color: i,
          margin: 0,
          lang: `zh-CN`,
          fit: `shrink`,
          align: g ? `center` : `left`,
          valign: `top`,
          lineSpacingMultiple: 1.12,
        });
        v += n.h + 0.22;
      }
    }
    let S = t.texts.filter(Boolean);
    if (S.length) {
      let e = S.join(`
`),
        n = fitText(e, _.w, Math.round(16 * y), Math.max(0.4, x - v), 1.3);
      {
        c.addText(e, {
          x: _.x,
          y: v,
          w: _.w,
          ...n,
          fontFace: sceneFont(t),
          color: i,
          transparency: 18,
          margin: 0,
          lang: `zh-CN`,
          fit: `shrink`,
          align: g ? `center` : `left`,
          valign: `top`,
          lineSpacingMultiple: 1.3,
        });
        v += n.h + 0.22;
      }
    }
    let C = Math.max(2.6, v + 0.15);
    if (t.composition === `chart` && t.chart) {
      let e = t.chart,
        n = e.series.map((e, t) =>
          (e.color || `#${chartColors[t % chartColors.length]}`).replace(
            `#`,
            ``,
          ),
        ),
        r = {
          x: 0.7,
          y: C,
          w: 11.933,
          h: 6.85 - C,
          lang: `zh-CN`,
          catAxisLabelColor: i,
          valAxisLabelColor: i,
          catAxisLabelFontSize: 11,
          valAxisLabelFontSize: 11,
          showValue: e.type === `bar`,
          showLegend: e.type !== `pie` && e.series.length > 1,
          showCatName: false,
          showTitle: !!t.chartUnit,
          title: t.chartUnit || undefined,
          valAxisMajorUnit: e.series.every((s) =>
            s.values.every(Number.isInteger),
          )
            ? 1
            : undefined,
          legendColor: i,
        };
      if (e.type === `pie`) {
        let t = e.series[0];
        c.addChart(
          p.ChartType.pie,
          [
            {
              name: t?.label || `占比`,
              labels: e.categories,
              values: t?.values || [],
            },
          ],
          { ...r, chartColors: n, showLegend: !0, legendPos: `b` },
        );
      } else if (e.type === `bar`) {
        c.addChart(
          p.ChartType.bar,
          e.series.map((t) => ({
            name: t.label,
            labels: e.categories,
            values: t.values,
          })),
          { ...r, barDir: `col`, chartColors: n },
        );
      } else {
        c.addChart(
          p.ChartType.line,
          e.series.map((t) => ({
            name: t.label,
            labels: e.categories,
            values: t.values,
          })),
          { ...r, lineSize: 2.5, chartColors: n },
        );
      }
    }
    if (t.presetId === `process-steps` && t.table?.length <= 7) {
      addProcessSteps(c, t, i, C);
    } else if (t.composition === `table` && t.table?.length) {
      let e = t.table.map((e, n) =>
        e.map((e) => ({
          text: e,
          options: {
            fontFace: sceneFont(t),
            fontSize:
              n === 0
                ? 18
                : t.tableDensity === `compact` || t.table.length > 8
                  ? 14
                  : 17,
            color: i,
            bold: n === 0,
            fill: {
              color: o ? `ffffff` : `30384b`,
              transparency: n === 0 ? 82 : 93,
            },
          },
        })),
      );
      c.addTable(e, {
        x: 0.7,
        y: C,
        w: 11.933,
        margin: 0.1,
        border: { type: `solid`, color: o ? `ffffff` : `30384b`, pt: 0.5 },
        autoPage: !1,
      });
    }
    if (
      (n.photos > 0 &&
        t.photos.length &&
        (await addPhotos(
          c,
          t,
          d,
          f,
          isEvidenceLayout(t)
            ? {
                x: 0.7,
                y: Math.max(2.2, v + 0.15),
                w: 11.933,
                h: 6.8 - Math.max(2.2, v + 0.15),
              }
            : g
              ? {
                  x: 0.7,
                  y: b.length || S.length ? Math.max(3, v + 0.15) : 0.7,
                  w: 11.933,
                  h: 6.9 - (b.length || S.length ? Math.max(3, v + 0.15) : 0.7),
                }
              : { x: 6.3, y: 0.9, w: 6.333, h: 5.7 },
        )),
      t.composition === `cinema`)
    ) {
      let e = t.posterId ? d.get(t.posterId) : void 0,
        n;
      if (e && e.type.startsWith(`image/`)) {
        let t = await dataUrl(e.blob);
        n = { data: t, ...(await imageSize(e, t)) };
      } else if (t.videoId) {
        if (!m.has(t.videoId)) {
          m.set(t.videoId, await videoStill(d.get(t.videoId)));
        }
        n = m.get(t.videoId);
      }
      if (n) {
        let e =
          b.length || S.length
            ? { x: 0.7, y: C, w: 11.933, h: 6.85 - C }
            : { x: 0, y: 0, w: slideWidth, h: slideHeight };
        c.addImage({
          data: n.data,
          ...containImage(n.width, n.height, e.x, e.y, e.w, e.h),
        });
      }
      c.addNotes(
        `此页原有视频。PPT 为静态演示，使用视频封面或静态画面；导出 HTML 可保留完整视频并离线播放。`,
      );
    }
    if (t.footnote) {
      c.addText(t.footnote, {
        x: 0.7,
        y: 6.95,
        w: 11.933,
        h: 0.4,
        fontSize: Math.round(10 * y),
        color: i,
        transparency: 42,
        fontFace: sceneFont(t),
      });
    }
  }
  const bytes = await p.write({ outputType: "uint8array", compression: true });
  const files = unzipSync(bytes);
  files["[Content_Types].xml"] = strToU8(
    strFromU8(files["[Content_Types].xml"]).replace(
      /<Override\b[^>]*PartName="(\/ppt\/slideMasters\/slideMaster\d+\.xml)"[^>]*\/>/g,
      (entry, path) => (files[path.slice(1)] ? entry : ""),
    ),
  );
  return new Blob([zipSync(files, { level: 6 })], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}
export { exportProjectPptx };
