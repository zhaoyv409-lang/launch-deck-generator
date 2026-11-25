import type { SVGProps } from "react";
import paths from "./workbench-icons.json";
// Static SVG paths recovered from the supplied reference; no user HTML is accepted.
function icon(name: keyof typeof paths, mirrored = false) {
  return function WorkbenchIcon({
    size = 16,
    style,
    ...props
  }: SVGProps<SVGSVGElement> & { size?: number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
        {...props}
        style={mirrored ? { ...style, transform: "scaleX(-1)" } : style}
        dangerouslySetInnerHTML={{ __html: paths[name] }}
      />
    );
  };
}
export const ArrowLeft = icon("back");
export const ArrowRight = icon("chevron");
export const ArrowDown = icon("down");
export const ArrowUp = icon("up");
export const Check = icon("check");
export const Copy = icon("copy");
export const Download = icon("download");
export const Film = icon("play");
export const FolderOpen = icon("folder");
export const ImagePlus = icon("photo");
export const Maximize = icon("expand");
export const Minimize = icon("minimize");
export const Pencil = icon("edit");
export const Plus = icon("add");
export const Redo2 = icon("reply", true);
export const RotateCcw = icon("refresh");
export const Trash2 = icon("trash");
export const Undo2 = icon("reply");
export const X = icon("close");
export const Bot = icon("robot");
export const CircleHelp = icon("info");
export const AlertTriangle = icon("alert");
export const MoreHorizontal = icon("more");
export const BookOpen = icon("file");
export const ShieldCheck = icon("check");
export const Type = icon("text-select");
export const Image = icon("photos");
export const ChartNoAxesCombined = icon("computer");
export const Palette = icon("gear");
export const Sparkles = icon("play");
export const Layers = icon("apps");
export const Info = icon("gear");
export const Monitor = icon("computer");
export const NewProject = icon("new");
export const Eye = icon("eye");
export const ChevronRight = icon("chevron");
