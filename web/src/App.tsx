import BackgroundEditor from "./BackgroundEditor.jsx";
import PresetPreview from "./PresetPreview.jsx";
import LandingPage from "./LandingPage.jsx";
import { EditorNavigation, WorkbenchTour } from "./EditorNavigation.jsx";
import { useTheme } from "next-themes";
import {
  Bot,
  CircleHelp,
  MoreHorizontal,
  BookOpen,
  ShieldCheck,
  Monitor,
  NewProject,
  Eye,
} from "./WorkbenchIcons";

import PageStrip from "./PageStrip";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Download,
  Film,
  FolderOpen,
  ImagePlus,
  Maximize,
  Minimize,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from "./WorkbenchIcons";
import { LoaderCircle } from "lucide-react";

import { useStore } from "zustand";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { Experience, pauseMedia, type ExperienceHandle } from "./Experience";
import {
  db,
  loadProject,
  migrateImages,
  pruneUnusedMedia,
  putMedia,
  prepareMedia,
} from "./storage";
import { mediaUrls, photoUrl } from "./media/urls";
import {
  historyMediaIds,
  replaceProject,
  restoreHistory,
  useProjectStore,
} from "./store";
import {
  applyPreset,
  limits,
  presets,
  referencedMedia,
  scenePreset,
  newScene,
  normalizeScene,
  type Project,
  type Scene,
  type Media,
} from "./model";
import type {
  AgentImage,
  AgentConnection,
  FlowAgent,
  ScenePatch,
} from "./agent-api";
import { AgentDialog, ActionMenu } from "./WorkbenchGuide";
import { TextStyleEditor, MotionEditor, ChartEditor } from "./EditorFields.jsx";
import { PhotoSettings, TableSettings } from "./MediaSettings.jsx";
import { createBackup, listBackups, backupLabel } from "./backups";
import { useReferenceSurfaces } from "./useReferenceSurfaces";
import {
  normalizeProject,
  normalizeChart,
  scenePatchFields,
  applyPhotoSettings,
  validateScenePatch,
  transitions,
  palettes,
  backgroundKinds,
  presetCategories,
  presetCategory,
} from "./model";
import "./App.css";
import "./ReferenceTheme.css";
import "./WorkbenchSupport.css";

type UploadTarget = {
  sceneId: string;
  kind: "photo" | "video" | "poster";
  replaceId?: string;
};
export default function App() {
  useReferenceSurfaces();
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const canUndo = useStore(
    useProjectStore.temporal,
    (s) => s.pastStates.length > 0,
  );
  const canRedo = useStore(
    useProjectStore.temporal,
    (s) => s.futureStates.length > 0,
  );
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState("content");
  const [section, setSection] = useState("");
  const [landing, setLanding] = useState(
    () => !localStorage.getItem("flow-landing-dismissed"),
  );
  const [guide, setGuide] = useState(false);
  const [guideHint, setGuideHint] = useState(
    () => !localStorage.getItem("flow-guide-dismissed-v1"),
  );
  const [agentOpen, setAgentOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const priorGuide = useRef({ editing: false, tab: "content", section: "" });
  const { theme, setTheme } = useTheme();
  const startGuide = () => {
    priorGuide.current = { editing, tab, section };
    setGuide(true);
    setGuideHint(false);
    localStorage.setItem("flow-guide-dismissed-v1", "1");
  };
  const closeGuide = useCallback(() => {
    setGuide(false);
    setEditing(priorGuide.current.editing);
    setTab(priorGuide.current.tab);
    setSection(priorGuide.current.section);
  }, []);
  const navigateGuide = useCallback((id: string) => {
    setEditing(id !== "navigate" && id !== "export");
    setTab(id === "background" ? "atmosphere" : "content");
    setSection(id);
  }, []);
  useEffect(() => {
    document
      .querySelector('.flow-editor-scroll [data-slot="scroll-area-viewport"]')
      ?.scrollTo(0, 0);
  }, [section, tab, activeIndex]);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">(
    "saved",
  );
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [retry, setRetry] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [presetFilter, setPresetFilter] = useState("text");
  const [editorWidth, setEditorWidth] = useState(() =>
    Math.max(
      300,
      Math.min(640, Number(localStorage.getItem("flow-editor-w")) || 424),
    ),
  );
  const resizeDrag = useRef<{ x: number; width: number } | null>(null);
  const [paletteAllScenes, setPaletteAllScenes] = useState(
    () => localStorage.getItem("flow-palette-all") === "1",
  );
  const [presetLossOpen, setPresetLossOpen] = useState(false);
  const [backups, setBackups] = useState<Project[] | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Project | null>(null);
  const [connection, setConnection] = useState<AgentConnection | null>(null);
  const connectionRef = useRef(connection);
  const [chosenPreset, setChosenPreset] = useState("title");
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const [storageInfo, setStorageInfo] = useState<{
    usage: number;
    quota: number;
    persistent: boolean;
  } | null>(null);
  const experience = useRef<ExperienceHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<UploadTarget | null>(null);
  const urlsRef = useRef(urls);
  const saveQueue = useRef(Promise.resolve());
  const saveVersion = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pendingSave = useRef<Project | null>(null);
  const structureRef = useRef("");
  const mediaRef = useRef("");
  const statusRef = useRef({ saveState, loading });
  const inFlightMedia = useRef(new Set<string>());
  useEffect(() => {
    statusRef.current = { saveState, loading };
  }, [saveState, loading]);
  useEffect(() => {
    for (const [id, url] of Object.entries(urlsRef.current))
      if (urls[id] !== url) URL.revokeObjectURL(url);
    urlsRef.current = urls;
  }, [urls]);
  useEffect(() => {
    if (!navigator.storage) return;
    let active = true;
    void (async () => {
      const persistent = await navigator.storage.persisted().catch(() => false);
      const granted =
        persistent || (await navigator.storage.persist?.().catch(() => false));
      const estimate = await navigator.storage.estimate();
      if (!active) return;
      setStorageInfo({
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        persistent: Boolean(granted),
      });
      if (estimate.quota && (estimate.usage || 0) / estimate.quota > 0.8)
        toast.info("本地空间即将用满，请先“打包带走”备份");
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [loading]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const loaded = await loadProject();
        const media = await db.media.toArray();
        const variants = await db.variants.toArray();
        if (!active) return;
        setUrls(mediaUrls(media, variants));
        replaceProject(loaded);
        setActiveIndex(
          Math.max(
            0,
            loaded.scenes.findIndex((s) => s.id === loaded.selectedId),
          ),
        );
        setLoadError("");
        void migrateImages(
          (result) => {
            const created = mediaUrls(result.media, result.variants);
            if (active) setUrls((current) => ({ ...current, ...created }));
            else Object.values(created).forEach(URL.revokeObjectURL);
          },
          () => !active,
        ).catch(() => {});
      } catch (error) {
        if (active) setLoadError(String(error));
      }
    })();
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(
    () => () => {
      Object.values(urlsRef.current).forEach(URL.revokeObjectURL);
    },
    [],
  );
  const flushSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    const snapshot = pendingSave.current;
    if (!snapshot) return saveQueue.current;
    pendingSave.current = null;
    const version = saveVersion.current;
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(async () => {
        if (version !== saveVersion.current) return;
        try {
          await db.projects.put(snapshot);
          referencedMedia(snapshot).forEach((id) =>
            inFlightMedia.current.delete(id),
          );
          if (version === saveVersion.current) {
            setSaveState("saved");
            setSaveError("");
          }
        } catch (error) {
          if (version === saveVersion.current) {
            setSaveState("error");
            setSaveError(String(error));
          }
        }
      });
    return saveQueue.current;
  }, []);
  useEffect(() => {
    if (!project) return;
    ++saveVersion.current;
    pendingSave.current = project;
    // 文字和连续调色合并保存；结构、媒体变更立即入队。
    // oxlint-disable-next-line react/set-state-in-effect
    setSaveState("saving");
    const structure = JSON.stringify(
      project.scenes.map((s) => [
        s.id,
        s.presetId,
        s.photos,
        s.videoId,
        s.posterId,
      ]),
    );
    const immediate = structureRef.current !== structure;
    structureRef.current = structure;
    if (immediate) void flushSave();
    else saveTimer.current = setTimeout(() => void flushSave(), 500);
    return () => clearTimeout(saveTimer.current);
  }, [project, flushSave]);
  useEffect(() => {
    if (!project || loading || saveState !== "saved") return;
    const collect = saveQueue.current
      .catch(() => {})
      .then(async () => {
        const current = useProjectStore.getState().project;
        if (!current || pendingSave.current) return;
        const referenced = [
          ...new Set([...referencedMedia(current), ...historyMediaIds()]),
        ];
        const signature = referenced.sort().join(",");
        if (signature === mediaRef.current) return;
        // 与写入共用队列；正在上传、当前项目和备份引用都不能提前回收。
        await db.transaction("rw", db.projects, db.media, db.variants, () =>
          pruneUnusedMedia([...referenced, ...inFlightMedia.current]),
        );
        mediaRef.current = signature;
        const checkedUrls = urlsRef.current;
        const retained = new Set([
          ...(await db.media.toCollection().primaryKeys()),
          ...(await db.variants.toCollection().primaryKeys()),
        ]);
        setUrls((current) => {
          // 查询期间可能新上传了素材，只处理查询前已存在的同一 URL。
          const live = useProjectStore.getState().project;
          const protectedIds = new Set([
            ...referencedMedia(live || project),
            ...historyMediaIds(),
            ...inFlightMedia.current,
          ]);
          const entries = Object.entries(current).filter(
            ([id, url]) =>
              retained.has(id) ||
              checkedUrls[id] !== url ||
              protectedIds.has(id.replace(/:(medium|thumb)$/, "")),
          );
          return entries.length === Object.keys(current).length
            ? current
            : Object.fromEntries(entries);
        });
      });
    saveQueue.current = collect.catch(() => {});
  }, [project, loading, saveState]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      void flushSave();
      if (
        statusRef.current.saveState !== "saved" ||
        statusRef.current.loading
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const hide = () => {
      if (document.hidden) void flushSave();
    };
    const leave = () => {
      void flushSave();
    };
    const exitKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement) {
        event.preventDefault();
        void document.exitFullscreen();
      }
    };
    document.addEventListener("keydown", exitKey, true);
    const fullChanged = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) pauseMedia();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("fullscreenchange", fullChanged);
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("fullscreenchange", fullChanged);
      document.removeEventListener("keydown", exitKey, true);
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [flushSave]);
  const update = useCallback(
    (change: (project: Project) => Project) => {
      setSaveState("saving");
      setProject((p) => (p ? { ...change(p), updatedAt: Date.now() } : p));
    },
    [setProject],
  );
  const patch = useCallback(
    (id: string, changes: Partial<Scene>) =>
      update((p) => ({
        ...p,
        scenes: p.scenes.map((s) =>
          s.id === id ? normalizeScene({ ...s, ...changes }) : s,
        ),
      })),
    [update],
  );
  const scene = project?.scenes[activeIndex];
  const currentPreset = scene ? scenePreset(scene) : presets[0];
  const hasText = currentPreset.headings + currentPreset.texts > 0;
  const isOutro = currentPreset.composition === "outro";
  const backgroundUnavailable =
    isOutro || (currentPreset.id === "film" && Boolean(scene?.videoId));
  const edit = (changes: Partial<Scene>) => {
    if (scene) patch(scene.id, changes);
  };
  const changeIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setProject((p) =>
        p?.scenes[index] && p.selectedId !== p.scenes[index].id
          ? { ...p, selectedId: p.scenes[index].id }
          : p,
      );
    },
    [setProject],
  );
  const historyAction = useCallback((direction: "undo" | "redo") => {
    const before = useProjectStore.getState().project;
    const restored = restoreHistory(direction);
    if (restored && restored !== before) {
      setSaveState("saving");
      setActiveIndex(
        Math.max(
          0,
          restored.scenes.findIndex((s) => s.id === restored.selectedId),
        ),
      );
    }
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.key.toLowerCase() !== "z" ||
        event.isComposing
      )
        return;
      // 文本框使用浏览器原生撤销；其他位置恢复整个项目的操作。
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, [contenteditable=true]")
      )
        return;
      event.preventDefault();
      historyAction(event.shiftKey ? "redo" : "undo");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyAction]);
  const importMedia = useCallback(
    async (files: File[], target: UploadTarget) => {
      const current = useProjectStore
        .getState()
        .project?.scenes.find((s) => s.id === target.sceneId);
      if (!current) return;
      const accepted = files.filter((file) =>
        target.kind === "video"
          ? file.type.startsWith("video/")
          : file.type.startsWith("image/"),
      );
      const capacity =
        target.kind === "photo" && !target.replaceId
          ? scenePreset(current).photos - current.photos.length
          : 1;
      if (capacity <= 0) {
        toast.info(
          `当前版式有 ${scenePreset(current).photos} 个图片位；换个版式可以放更多`,
        );
        return;
      }
      const chosen = accepted.slice(0, capacity);
      if (!chosen.length) {
        toast.error("请选择支持的图片或视频文件");
        return;
      }
      if (accepted.length > chosen.length)
        toast.info("已按当前版式的图片位数量添加");
      const raw = chosen.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name || "粘贴图片",
        type: file.type,
        blob: file,
      }));
      setLoading(true);
      try {
        raw.forEach((m) => inFlightMedia.current.add(m.id));
        const { media, variants } = await putMedia(raw);
        setUrls((urls) => ({ ...urls, ...mediaUrls(media, variants) }));
        update((p) => ({
          ...p,
          scenes: p.scenes.map((s) => {
            if (s.id !== target.sceneId) return s;
            if (target.kind !== "photo")
              return {
                ...s,
                [target.kind === "video" ? "videoId" : "posterId"]: media[0].id,
                composition: target.kind === "video" ? "cinema" : s.composition,
              };
            const photos = target.replaceId
              ? s.photos.map((photo) =>
                  photo.id === target.replaceId
                    ? { ...photo, mediaId: media[0].id }
                    : photo,
                )
              : [
                  ...s.photos,
                  ...media.map((m) => ({
                    id: crypto.randomUUID(),
                    mediaId: m.id,
                  })),
                ].slice(0, scenePreset(s).photos);
            return { ...s, photos };
          }),
        }));
        toast.success(
          target.kind === "video"
            ? "视频已加入"
            : target.kind === "poster"
              ? "封面已更新"
              : `已加入 ${media.length} 张图片`,
        );
      } catch (error) {
        toast.error(`素材保存失败，当前内容仍保留：${String(error)}`);
      } finally {
        raw.forEach((m) => inFlightMedia.current.delete(m.id));
        mediaRef.current = "";
        setLoading(false);
      }
    },
    [update],
  );
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, [contenteditable=true]")
      )
        return;
      if (document.querySelector("[role=alertdialog]")) return;
      const files = Array.from(event.clipboardData?.files || []).filter(
        (file) => file.type.startsWith("image/"),
      );
      const project = useProjectStore.getState().project;
      const scene = project?.scenes.find((s) => s.id === project.selectedId);
      if (files.length && scene) {
        event.preventDefault();
        void importMedia(files, { sceneId: scene.id, kind: "photo" });
      }
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, [importMedia]);
  useEffect(() => {
    // 所有 agent 写入都进同一条 saveQueue，避免与编辑器保存互相覆盖。
    const commit = (change: (project: Project) => Project) => {
      void flushSave();
      const run = saveQueue.current
        .catch(() => {})
        .then(async () => {
          const current = useProjectStore.getState().project;
          if (!current) throw new Error("项目还未打开");
          await createBackup(current, "before-agent");
          // 备份写入期间用户仍可输入，变更应用于最新状态。
          const next = {
            ...change(useProjectStore.getState().project || current),
            updatedAt: Date.now(),
          };
          setProject(next);
          await db.projects.put(next);
          referencedMedia(next).forEach((id) =>
            inFlightMedia.current.delete(id),
          );
          if (useProjectStore.getState().project === next) {
            setSaveState("saved");
            setSaveError("");
          }
          return structuredClone(next);
        });
      saveQueue.current = run.then(
        () => {},
        () => {},
      );
      return run;
    };
    const fromDataUrl = (
      input: string | AgentImage,
      kind: "image" | "video",
    ): Media => {
      const raw = typeof input === "string" ? input : input.dataUrl;
      const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(raw);
      if (!match) throw new Error("素材需为 base64 形式的 data URL");
      const type = match[1].toLowerCase();
      if (!type.startsWith(`${kind}/`))
        throw new Error(
          kind === "image"
            ? "images 里需要图片类型的 data URL"
            : "video 需要视频类型的 data URL",
        );
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      if (!bytes.length) throw new Error("素材内容为空");
      return {
        id: crypto.randomUUID(),
        name:
          (typeof input === "string" ? undefined : input.name) ||
          (kind === "image" ? "交给网页的图片" : "交给网页的视频"),
        type,
        blob: new Blob([bytes], { type }),
      };
    };
    const applyTo = async (
      payload: ScenePatch | Omit<ScenePatch, "scene">,
      sceneNumber?: number,
    ) => {
      validateScenePatch(payload as Partial<Scene>);
      if (
        payload.presetId &&
        !presets.some((p) => p.id === payload.presetId && !p.legacy)
      )
        throw new Error("预设不存在");
      if (payload.textColor && !/^#[0-9a-f]{6}$/i.test(payload.textColor))
        throw new Error("文字颜色需为六位 Hex");
      const photos = (payload.images || []).map((input) =>
        fromDataUrl(input, "image"),
      );
      const clip = payload.video ? fromDataUrl(payload.video, "video") : null;
      if (
        clip &&
        payload.presetId &&
        presets.find((p) => p.id === payload.presetId)?.composition !== "cinema"
      )
        throw new Error("视频需要影像类预设（影像时刻 / 影像主张 / 纯影像）");
      const presetId = clip && !payload.presetId ? "cinema" : payload.presetId;
      const staged = clip ? [...photos, clip] : photos;
      try {
        if (photos.length || clip) {
          staged.forEach((m) => inFlightMedia.current.add(m.id));
          const processed = await putMedia(staged);
          setUrls((current) => ({
            ...current,
            ...mediaUrls(processed.media, processed.variants),
          }));
        }
        const counters = { addedImages: 0, ignoredImages: 0 };
        const project = await commit((current) => {
          const creating = sceneNumber === undefined;
          if (creating && current.scenes.length >= limits.scenes)
            throw new Error(`最多 ${limits.scenes} 屏；先合并或删除一些场景`);
          const index = creating
            ? current.scenes.length
            : (sceneNumber as number) - 1;
          const scene = creating
            ? newScene(presetId || "title")
            : current.scenes[index];
          if (!scene)
            throw new Error(
              "scene 使用从 1 开始的场景编号；新建一屏请使用 addScene",
            );
          const base =
            !creating && payload.presetId
              ? applyPreset(scene, payload.presetId)
              : scene;
          const preset = scenePreset(base);
          const merged = [
            ...base.photos,
            ...photos.map((m) => ({ id: crypto.randomUUID(), mediaId: m.id })),
          ].slice(0, preset.photos);
          counters.addedImages = merged.length - base.photos.length;
          counters.ignoredImages = photos.length - counters.addedImages;
          const allowed = Object.fromEntries(
            Object.entries(payload).filter(([key]) =>
              scenePatchFields.includes(key),
            ),
          );
          const updated = normalizeScene({
            ...base,
            ...allowed,
            chart: payload.chart
              ? normalizeChart({ ...base.chart, ...payload.chart })
              : base.chart,
            photos: applyPhotoSettings(merged, payload.photoSettings),
            videoId: clip ? clip.id : base.videoId,
            composition: clip ? "cinema" : base.composition,
          });
          const scenes = creating
            ? [...current.scenes, updated]
            : current.scenes.map((s, i) => (i === index ? updated : s));
          return { ...current, selectedId: updated.id, scenes };
        });
        setActiveIndex(
          project.scenes.findIndex((s) => s.id === project.selectedId),
        );
        return {
          project,
          scene:
            project.scenes.findIndex((s) => s.id === project.selectedId) + 1,
          ...counters,
        };
      } finally {
        staged.forEach((m) => inFlightMedia.current.delete(m.id));
        const live = useProjectStore.getState().project;
        const keep = new Set([
          ...(live ? referencedMedia(live) : []),
          ...historyMediaIds(),
        ]);
        const orphan = staged.map((m) => m.id).filter((id) => !keep.has(id));
        if (orphan.length) {
          const removed = await db
            .transaction("rw", db.media, db.variants, async () => {
              await db.media.bulkDelete(orphan);
              await db.variants.where("mediaId").anyOf(orphan).delete();
              return true;
            })
            .catch(() => false);
          if (removed)
            setUrls((current) =>
              Object.fromEntries(
                Object.entries(current).filter(
                  ([id]) =>
                    !orphan.includes(id.replace(/:(medium|thumb)$/, "")),
                ),
              ),
            );
        }
      }
    };
    const api: FlowAgent = {
      help: () => ({
        version: 2,
        limits,
        methods: [
          "inspect",
          "listPresets",
          "apply",
          "addScene",
          "setBackground",
          "setTransition",
          "goTo",
          "ping",
          "report",
          "getConnection",
        ],
        scenePatch: {
          fields: [...scenePatchFields, "images", "video", "photoSettings"],
          photoSettings:
            "按 index（从 1 开始）设置 rotation、fit、aspect、caption",
        },
      }),
      goTo: async (number) => {
        const p = useProjectStore.getState().project;
        if (
          !p ||
          !Number.isInteger(number) ||
          number < 1 ||
          number > p.scenes.length
        )
          throw new Error("页面编号超出范围");
        changeIndex(number - 1);
        return { scene: number };
      },
      ping: async (client = "Agent") => {
        const state: AgentConnection = {
          client: String(client).slice(0, 80),
          at: Date.now(),
          phase: "connected",
        };
        connectionRef.current = state;
        setConnection(state);
        return { ok: true, ...state };
      },
      report: async (step) => {
        const phases: Record<string, AgentConnection["phase"]> = {
          "awaiting-auth": "awaiting",
          authorizing: "awaiting",
          "configuring-mcp": "checking",
          "installing-extension": "checking",
          checking: "checking",
          connected: "connected",
        };
        if (!phases[step]) throw new Error("未知连接步骤");
        const state: AgentConnection = {
          client: connectionRef.current?.client || "Agent",
          at: Date.now(),
          phase: phases[step],
        };
        connectionRef.current = state;
        setConnection(state);
        return { ok: true, step, phase: state.phase };
      },
      getConnection: () =>
        connectionRef.current ? { ...connectionRef.current } : null,
      inspect: () => structuredClone(useProjectStore.getState().project),
      listPresets: () => structuredClone(presets.filter((p) => !p.legacy)),
      apply: (payload) => applyTo(payload, payload.scene),
      addScene: (payload) => applyTo(payload),
      setBackground: async (payload) =>
        commit((current) => {
          const palette = palettes.find((p) => p.id === payload.preset);
          const kind = payload.kind || palette?.kind || current.background.kind;
          if (
            payload.kind &&
            !backgroundKinds.some((k) => k.id === payload.kind)
          )
            throw new Error(
              "背景样式需为 " + backgroundKinds.map((k) => k.id).join(" / "),
            );
          const colors =
            payload.colors || palette?.colors || current.background.colors;
          if (
            colors.length !== 4 ||
            colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c))
          )
            throw new Error("背景需要四个有效 Hex 颜色");
          return {
            ...current,
            background: {
              ...current.background,
              ...payload,
              kind,
              preset:
                palette && !payload.colors
                  ? (payload.preset as string)
                  : payload.preset || current.background.preset,
              colors,
              speed: Math.max(
                0,
                Math.min(1, payload.speed ?? current.background.speed),
              ),
            },
            scenes: palette
              ? current.scenes.map((s) => ({ ...s, textColor: palette.ink }))
              : current.scenes,
          };
        }),
      setTransition: async (transition) => {
        if (!transitions.some((t) => t.id === transition))
          throw new Error("转场需为 creative / fade / cards / magic");
        return commit((current) => ({ ...current, transition }));
      },
    };
    window.flowAgent = api;
    return () => {
      if (window.flowAgent === api) delete window.flowAgent;
    };
  }, [flushSave, setProject, changeIndex]);
  const chooseMedia = (kind: UploadTarget["kind"], replaceId?: string) => {
    if (!scene || !uploadRef.current) return;
    targetRef.current = { sceneId: scene.id, kind, replaceId };
    uploadRef.current.accept = kind === "video" ? "video/*" : "image/*";
    uploadRef.current.multiple = kind === "photo" && !replaceId;
    uploadRef.current.click();
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else {
      setEditing(false);
      void rootRef.current
        ?.requestFullscreen()
        .catch(() => toast.info("浏览器未允许全屏，仍可窗口播放"));
    }
  };
  const openPresets = (create: boolean) => {
    setCreating(create);
    setChosenPreset(create ? "title" : currentPreset.id);
    setPresetFilter(create ? "text" : presetCategory(currentPreset));
    setPresetOpen(true);
  };
  const addScene = () => openPresets(true);
  const targetPreset = presets.find((preset) => preset.id === chosenPreset);
  const presetLoss =
    scene && targetPreset && !creating
      ? [
          Math.max(0, scene.photos.length - targetPreset.photos) > 0
            ? `${scene.photos.length - targetPreset.photos} 张图`
            : "",
          Math.max(0, scene.headings.length - targetPreset.headings) +
            Math.max(0, scene.texts.length - targetPreset.texts) >
          0
            ? `${Math.max(0, scene.headings.length - targetPreset.headings) + Math.max(0, scene.texts.length - targetPreset.texts)} 段文字`
            : "",
          scene.composition === "cinema" &&
          targetPreset.composition !== "cinema" &&
          scene.videoId
            ? "1 段视频"
            : "",
        ].filter(Boolean)
      : [];
  const applyChosenPreset = async (confirmed = false) => {
    if (!project || !scene) return;
    if (!creating && presetLoss.length && !confirmed) {
      setPresetLossOpen(true);
      return;
    }
    if (creating) {
      if (project.scenes.length >= limits.scenes) {
        toast.info(`已到 ${limits.scenes} 屏上限`);
        return;
      }
      const created = newScene(chosenPreset);
      const index = activeIndex + 1;
      update((p) => {
        const scenes = [...p.scenes];
        scenes.splice(index, 0, created);
        return { ...p, scenes, selectedId: created.id };
      });
      setActiveIndex(index);
    } else {
      try {
        await createBackup(project, "before-preset");
        edit(applyPreset(scene, chosenPreset));
      } catch (error) {
        toast.error(`备份未成功，当前内容未改动：${String(error)}`);
        return;
      }
    }
    setPresetLossOpen(false);
    setPresetOpen(false);
    setEditing(true);
    setTab("content");
  };
  const duplicate = () => {
    if (!scene || !project) return;
    if (project.scenes.length >= limits.scenes) {
      toast.info(`已到 ${limits.scenes} 屏上限`);
      return;
    }
    const created = {
      ...structuredClone(scene),
      id: crypto.randomUUID(),
      name: `${scene.name} · 副本`,
      photos: scene.photos.map((p) => ({ ...p, id: crypto.randomUUID() })),
    };
    update((p) => {
      const scenes = [...p.scenes];
      scenes.splice(activeIndex + 1, 0, created);
      return { ...p, scenes, selectedId: created.id };
    });
    setActiveIndex((i) => i + 1);
  };
  const move = (direction: number) => {
    if (
      !project ||
      activeIndex + direction < 0 ||
      activeIndex + direction >= project.scenes.length
    )
      return;
    update((p) => {
      const scenes = [...p.scenes];
      [scenes[activeIndex], scenes[activeIndex + direction]] = [
        scenes[activeIndex + direction],
        scenes[activeIndex],
      ];
      return { ...p, scenes };
    });
    setActiveIndex((i) => i + direction);
  };
  const remove = () => {
    if (!project || project.scenes.length <= 1) return;
    const index = Math.max(0, activeIndex - 1);
    update((p) => {
      const scenes = p.scenes.filter((s) => s.id !== scene?.id);
      return { ...p, scenes, selectedId: scenes[index].id };
    });
    setActiveIndex(index);
    setDeleteOpen(false);
  };
  const exportZip = async () => {
    if (!project) return;
    setExporting(true);
    let writable: FileSystemWritableFileStream | undefined;
    try {
      const filename = `${project.name.replace(/[\\/:*?"<>|]/g, "-") || "流光"}.zip`;
      const picker = (
        window as Window & {
          showSaveFilePicker?: (options: {
            suggestedName: string;
            types: { description: string; accept: Record<string, string[]> }[];
          }) => Promise<{
            createWritable: () => Promise<FileSystemWritableFileStream>;
          }>;
        }
      ).showSaveFilePicker;
      // 选择位置必须在用户点击的调用栈中发起，不能等 import/fetch 完成再请求。
      const handle = picker
        ? await picker.call(window, {
            suggestedName: filename,
            types: [
              {
                description: "网页运行包",
                accept: { "application/zip": [".zip"] },
              },
            ],
          })
        : undefined;
      const { exportProjectStream } = await import("./archive");
      await flushSave();
      const media = await db.media.bulkGet(referencedMedia(project));
      const variants = await db.variants
        .where("mediaId")
        .anyOf(referencedMedia(project))
        .toArray();
      const response = await exportProjectStream(
        project,
        media.filter((m): m is Media => Boolean(m)),
        variants,
      );
      if (handle) {
        writable = await handle.createWritable();
        if (!response.body) throw new Error("无法创建运行包数据流");
        await response.body.pipeTo(writable);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      toast.success("运行包已下载，图片和视频一起带走");
    } catch (error) {
      await writable?.abort().catch(() => {});
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast.error(`打包未完成：${String(error)}`);
    } finally {
      setExporting(false);
    }
  };
  const exportDocument = async (kind: "html" | "pptx") => {
    if (!project) return;
    setExporting(true);
    try {
      await flushSave();
      const media = (await db.media.bulkGet(referencedMedia(project))).filter(
        (m): m is Media => !!m,
      );
      const blob =
        kind === "html"
          ? await (
              await import("./archive")
            ).exportSingleHtml(project, media, await db.variants.toArray())
          : await (
              await import("./export-pptx")
            ).exportProjectPptx(project, media);
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = project.name.replace(/[\\/:*?"<>|]/g, "-") + "." + kind;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success(
        kind === "html"
          ? "HTML 已导出，可离线打开"
          : "PPT 已导出，动态效果使用静态呈现",
      );
    } catch (e) {
      toast.error("导出未完成：" + String(e));
    } finally {
      setExporting(false);
    }
  };
  const acceptImport = async () => {
    if (!pendingImport) return;
    const file = pendingImport;
    setPendingImport(null);
    setLoading(true);
    try {
      const { importProjectZip } = await import("./archive");
      const imported = await importProjectZip(file);
      await flushSave();
      const processed = await prepareMedia(imported.media);
      await db.transaction(
        "rw",
        db.projects,
        db.media,
        db.variants,
        async () => {
          const current = useProjectStore.getState().project;
          if (current) await createBackup(current, "before-import");
          await db.media.bulkPut(processed.media);
          await db.variants.bulkPut(processed.variants);
          await db.projects.put(imported.project);
        },
      );
      pauseMedia();
      setUrls(mediaUrls(processed.media, processed.variants));
      replaceProject(imported.project);
      setActiveIndex(
        Math.max(
          0,
          imported.project.scenes.findIndex(
            (s) => s.id === imported.project.selectedId,
          ),
        ),
      );
      setEditing(false);
      toast.success("运行包已打开，可以继续编辑");
    } catch (error) {
      toast.error(`导入失败，当前项目保留：${String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  const loadDemo = async () => {
    setLoading(true);
    try {
      await flushSave();
      const { seedProject } = await import("./model");
      const demo = seedProject();
      const sources = [
        { id: "alpine", name: "alpine.jpg", type: "image/jpeg" },
        { id: "ocean", name: "ocean.jpg", type: "image/jpeg" },
        { id: "botanical", name: "botanical.jpg", type: "image/jpeg" },
        { id: "woodland", name: "woodland.jpg", type: "image/jpeg" },
        { id: "dunes", name: "dunes.jpg", type: "image/jpeg" },
        { id: "hills", name: "hills.jpg", type: "image/jpeg" },
        { id: "flower", name: "flower.mp4", type: "video/mp4" },
      ];
      const remap = new Map(sources.map((m) => [m.id, crypto.randomUUID()]));
      const media: Media[] = [];
      for (const m of sources) {
        const r = await fetch(import.meta.env.BASE_URL + "media/" + m.name, {
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) throw new Error("示例素材读取失败");
        media.push({ ...m, id: remap.get(m.id)!, blob: await r.blob() });
      }
      demo.scenes = demo.scenes.map((s) => ({
        ...s,
        photos: s.photos.map((p) => ({
          ...p,
          mediaId: remap.get(p.mediaId)!,
        })),
        videoId: s.videoId ? remap.get(s.videoId) : undefined,
      }));
      await db.transaction("rw", db.projects, db.media, async () => {
        const current = useProjectStore.getState().project;
        if (current) await createBackup(current, "before-demo");
        await db.media.bulkPut(media);
        await db.projects.put(demo);
      });
      replaceProject(demo);
      setActiveIndex(0);
      setUrls(mediaUrls(await db.media.toArray(), await db.variants.toArray()));
      toast.success("软件介绍示例已载入，原作品已备份");
    } catch (e) {
      toast.error("载入失败：" + String(e));
    } finally {
      setLoading(false);
    }
  };
  const showBackups = async () => {
    try {
      await flushSave();
      setBackups((await listBackups()).slice(0, 12));
    } catch (e) {
      toast.error(String(e));
    }
  };
  const restoreBackup = async () => {
    const target = restoreTarget;
    setRestoreTarget(null);
    if (!target) return;
    setLoading(true);
    try {
      await flushSave();
      await (saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          const current = useProjectStore.getState().project;
          await db.transaction("rw", db.projects, async () => {
            if (current) await createBackup(current, "before-restore");
            const restored = {
              ...target,
              id: "current",
              updatedAt: Date.now(),
            };
            await db.projects.put(restored);
          });
          const restored = normalizeProject(target);
          replaceProject(restored);
          setActiveIndex(
            Math.max(
              0,
              restored.scenes.findIndex((s) => s.id === restored.selectedId),
            ),
          );
          setUrls(
            mediaUrls(await db.media.toArray(), await db.variants.toArray()),
          );
          mediaRef.current = "";
          setBackups(null);
          toast.success("已恢复备份，恢复前的内容也已保留");
        }));
    } catch (e) {
      toast.error("恢复失败：" + String(e));
    } finally {
      setLoading(false);
    }
  };
  const field = (label: string, children: ReactNode) => (
    <div
      className="editor-field"
      data-editor-section={
        label === "脚注（可选）"
          ? "footnote"
          : label === "网页名称"
            ? "name"
            : undefined
      }
    >
      <Label>{label}</Label>
      {children}
    </div>
  );
  const select = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
    disabled = false,
  ) =>
    field(
      label,
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>,
    );
  const toggle = (
    label: string,
    checked: boolean,
    onCheckedChange: (value: boolean) => void,
    disabled = false,
  ) => (
    <div className="editor-toggle">
      <Label>{label}</Label>
      <Switch
        aria-label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
  if (!project || !scene)
    return (
      <div className="flow-loading">
        <Card>
          <CardContent>
            <h1>让灵感，自然发生。</h1>
            {loadError ? (
              <>
                <p>{loadError}</p>
                <Button onClick={() => setRetry((n) => n + 1)}>重新读取</Button>
              </>
            ) : (
              <p>正在打开你的流动网页…</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div
      className={`flow-app ${editing ? "is-editing" : ""} ${fullscreen ? "is-fullscreen" : ""}`}
      ref={rootRef}
    >
      <div
        className="flow-workbench"
        inert={landing}
        aria-hidden={landing || undefined}
      >
        <Experience
          project={
            landing
              ? {
                  ...project,
                  background: { ...project.background, paused: true },
                }
              : project
          }
          urls={urls}
          activeIndex={activeIndex}
          onIndexChange={changeIndex}
          editing={editing}
          ref={experience}
          keyboard={
            !landing &&
            !guide &&
            !agentOpen &&
            !deleteOpen &&
            !pendingImport &&
            !presetOpen &&
            !demoOpen &&
            !backups
          }
        />
        <header className="flow-topbar">
          <div className="flow-identity" data-hark-surface>
            <button
              type="button"
              className="flow-home-button"
              aria-label="返回首页"
              title="返回 Stage 产品介绍页"
              onClick={() => {
                pauseMedia();
                setEditing(false);
                setGuide(false);
                setLanding(true);
                localStorage.removeItem("flow-landing-dismissed");
                if (document.fullscreenElement) void document.exitFullscreen();
              }}
            >
              <ArrowLeft size={19} />
              <span>流光</span>
            </button>
            <span className="identity-separator" />
            {renaming ? (
              <Input
                className="project-name-input"
                aria-label="项目名称"
                autoFocus
                value={nameDraft}
                maxLength={60}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  update((p) => ({ ...p, name: nameDraft.trim() || p.name }));
                  setRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setRenaming(false);
                }}
              />
            ) : (
              <button
                type="button"
                className="project-caption"
                title="点击修改项目名称"
                onClick={() => {
                  setNameDraft(project.name);
                  setRenaming(true);
                }}
              >
                {project.name}
              </button>
            )}
            <span role="status" className={`flow-save save-${saveState}`}>
              <span className={`flow-save-dot save-${saveState}`} />
              <span className="flow-save-text">
                {saveState === "saved"
                  ? "已保存"
                  : saveState === "saving"
                    ? "保存中"
                    : "未保存"}
              </span>
            </span>
          </div>
          <div className="flow-actions" data-hark-surface>
            {!fullscreen && (
              <>
                <Button
                  variant="ghost"
                  className="edit-button"
                  aria-label={editing ? "收起编辑" : "编辑当前屏"}
                  aria-pressed={editing}
                  onClick={() => setEditing((e) => !e)}
                >
                  <Pencil size={16} />
                  <span>{editing ? "收起编辑" : "编辑当前屏"}</span>
                </Button>
                <ActionMenu
                  label="导出作品"
                  className="export-button"
                  trigger={
                    <>
                      {exporting ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <Download size={16} />
                      )}
                      <span>{exporting ? "导出中" : "导出"}</span>
                    </>
                  }
                  disabled={exporting || loading}
                >
                  <Button
                    variant="ghost"
                    onClick={() => void exportDocument("pptx")}
                  >
                    <Monitor size={16} />
                    导出 PPT
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void exportDocument("html")}
                  >
                    <BookOpen size={16} />
                    导出 HTML
                  </Button>
                  <Button variant="ghost" onClick={() => void exportZip()}>
                    <Download size={16} />
                    打包带走
                  </Button>
                </ActionMenu>
                <Button
                  variant="ghost"
                  className="agent-button"
                  aria-label="连接 Agent"
                  onClick={() => setAgentOpen(true)}
                >
                  <Bot size={18} />
                  <span>连接 Agent</span>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="help-button"
              aria-label="新手教程"
              onClick={startGuide}
            >
              <CircleHelp size={18} />
            </Button>
            <ActionMenu
              label="更多操作"
              className="more-button"
              trigger={<MoreHorizontal size={18} />}
              disabled={loading}
            >
              <Button
                variant="ghost"
                onClick={() => importRef.current?.click()}
              >
                <FolderOpen size={16} />
                打开运行包
              </Button>
              <Button variant="ghost" onClick={() => setDemoOpen(true)}>
                <NewProject size={16} />
                载入软件介绍示例
              </Button>
              <Button variant="ghost" onClick={() => void showBackups()}>
                <RotateCcw size={16} />
                恢复备份
              </Button>
              <Button variant="ghost" onClick={startGuide}>
                <BookOpen size={16} />
                新手教程
              </Button>
              <Button variant="ghost" onClick={() => setAgentOpen(true)}>
                <Bot size={16} />
                连接你的 Agent
              </Button>
              <Button
                variant="ghost"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                <Eye size={16} />
                切换到{theme === "light" ? "深色" : "浅色"}
              </Button>
            </ActionMenu>
            <Button
              className="play-button"
              aria-label={fullscreen ? "退出全屏" : "全屏播放"}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              <span>{fullscreen ? "退出全屏" : "全屏播放"}</span>
            </Button>
          </div>
        </header>
        {saveState === "error" && (
          <Alert className="flow-save-alert" variant="destructive">
            <AlertTitle>保存失败，当前内容仍保留</AlertTitle>
            <AlertDescription>
              {saveError}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setProject((p) => (p ? { ...p, updatedAt: Date.now() } : p))
                }
              >
                重试保存
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <footer className="flow-bottom">
          <span />
          <nav data-hark-surface className="scene-dock" aria-label="场景导航">
            <Button
              size="icon"
              variant="ghost"
              aria-label="上一屏"
              onClick={() => experience.current?.previous()}
              disabled={activeIndex === 0}
            >
              <ArrowLeft size={16} />
            </Button>
            <PageStrip>
              {project.scenes.map((s, index) => (
                <Button
                  variant="ghost"
                  className={`scene-chip ${index === activeIndex ? "active" : ""}`}
                  key={s.id}
                  title={s.name}
                  aria-label={`第 ${index + 1} 屏`}
                  aria-current={index === activeIndex ? "page" : undefined}
                  onClick={() => changeIndex(index)}
                >
                  <span className="chip-no">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="chip-name">{s.name}</span>
                </Button>
              ))}
            </PageStrip>
            <Button
              size="icon"
              variant="ghost"
              aria-label="下一屏"
              onClick={() => experience.current?.next()}
              disabled={activeIndex === project.scenes.length - 1}
            >
              <ArrowRight size={16} />
            </Button>
            {!fullscreen && (
              <>
                <span className="dock-separator" />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="添加一屏"
                  title="添加一屏"
                  onClick={addScene}
                >
                  <Plus size={17} />
                </Button>
              </>
            )}
          </nav>
          <span className="flow-key-hint">滚轮 / 方向键，去下一屏</span>
        </footer>
        <Sheet modal={false} open={editing} onOpenChange={setEditing}>
          <SheetContent
            style={{ "--editor-w": editorWidth + "px" } as CSSProperties}
            className="flow-editor"
            showCloseButton={false}
            aria-describedby="editor-description"
            data-hark-surface
            onInteractOutside={(event) => event.preventDefault()}
          >
            <div
              className="editor-resize-handle"
              role="separator"
              aria-label="调整编辑栏宽度"
              aria-orientation="vertical"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  const width = Math.max(
                    300,
                    Math.min(
                      640,
                      editorWidth + (e.key === "ArrowLeft" ? 20 : -20),
                    ),
                  );
                  setEditorWidth(width);
                  localStorage.setItem("flow-editor-w", String(width));
                }
              }}
              onPointerDown={(e) => {
                resizeDrag.current = { x: e.clientX, width: editorWidth };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const drag = resizeDrag.current;
                if (drag)
                  setEditorWidth(
                    Math.max(
                      300,
                      Math.min(640, drag.width + drag.x - e.clientX),
                    ),
                  );
              }}
              onPointerUp={() => {
                resizeDrag.current = null;
                localStorage.setItem("flow-editor-w", String(editorWidth));
              }}
            />
            <SheetHeader>
              <div className="editor-title-row">
                <div>
                  <p className="hark-editor-eyebrow">
                    编辑工作台{" "}
                    <span>
                      {String(activeIndex + 1).padStart(2, "0")} /{" "}
                      {String(project.scenes.length).padStart(2, "0")}
                    </span>
                  </p>
                  <SheetTitle>{scene.name || "当前页面"}</SheetTitle>
                  <SheetDescription className="sr-only" id="editor-description">
                    按内容分组编辑这一屏，或者调整整场的背景和转场。更改自动保存。
                  </SheetDescription>
                </div>
                <div className="editor-history">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="撤销"
                    disabled={!canUndo}
                    onClick={() => historyAction("undo")}
                  >
                    <Undo2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="重做"
                    disabled={!canRedo}
                    onClick={() => historyAction("redo")}
                  >
                    <Redo2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="收起编辑"
                    onClick={() => setEditing(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </SheetHeader>
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value);
                setSection("");
              }}
            >
              <TabsList className="flow-editor-tabs">
                <TabsTrigger value="content">当前屏</TabsTrigger>
                <TabsTrigger value="atmosphere">整场设置</TabsTrigger>
              </TabsList>
              <ScrollArea className="flow-editor-scroll">
                <div className="flow-editor-content">
                  <TabsContent value="content">
                    <EditorNavigation
                      scope="content"
                      selected={section}
                      onSelect={setSection}
                      scene={scene}
                    >
                      <div
                        className="preset-summary"
                        data-editor-section="preset"
                      >
                        <PresetPreview preset={currentPreset} />
                        <div className="preset-summary-text">
                          <span>当前版式</span>
                          <strong>{currentPreset.name}</strong>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPresets(false)}
                        >
                          更换版式
                        </Button>
                      </div>
                      {currentPreset.headings > 0 && (
                        <div data-editor-section="headings">
                          <div className="editor-group-title">
                            <span>主标题</span>
                            <span>{currentPreset.headings} 个固定位置</span>
                          </div>
                          {scene.headings.map((text, index) => (
                            <div className="text-slot" key={index}>
                              <Label className="heading-slot-label">
                                {currentPreset.headings > 1
                                  ? `主标题 · ${index === 0 ? "第一行" : "第二行"}`
                                  : "主标题"}
                              </Label>
                              <Textarea
                                aria-label={`主标题 ${index + 1}`}
                                value={text}
                                maxLength={72}
                                rows={2}
                                placeholder="写一句重要的话"
                                onChange={(e) =>
                                  edit({
                                    headings: scene.headings.map((t, i) =>
                                      index === i ? e.target.value : t,
                                    ),
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {currentPreset.texts > 0 && (
                        <div data-editor-section="texts">
                          <div className="editor-group-title">
                            <span>小文本</span>
                            <span>{currentPreset.texts} 个固定位置</span>
                          </div>
                          {scene.texts.map((text, index) => (
                            <div className="text-slot" key={index}>
                              <Textarea
                                aria-label={`小文本 ${index + 1}`}
                                value={text}
                                maxLength={180}
                                rows={2}
                                onChange={(e) =>
                                  edit({
                                    texts: scene.texts.map((t, i) =>
                                      i === index ? e.target.value : t,
                                    ),
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {field(
                        "脚注（可选）",
                        <Input
                          aria-label="脚注"
                          value={scene.footnote || ""}
                          maxLength={120}
                          disabled={!hasText}
                          placeholder={
                            hasText
                              ? "比如：数据截至 2026 年 · 内部资料"
                              : "当前版式不显示脚注"
                          }
                          onChange={(e) => edit({ footnote: e.target.value })}
                        />,
                      )}
                      {currentPreset.composition === "chart" && scene.chart && (
                        <ChartEditor
                          data-editor-section="chart"
                          scene={scene}
                          onChange={edit}
                          select={select}
                          field={field}
                        />
                      )}
                      {currentPreset.photos > 0 && (
                        <div data-editor-section="photos">
                          <div className="editor-group-title">
                            <span>图片</span>
                            <span>
                              {scene.photos.length} / {currentPreset.photos}
                            </span>
                          </div>
                          <div className="photo-upload-grid">
                            {scene.photos.map((photo, index) => (
                              <div className="photo-edit-tile" key={photo.id}>
                                <Button
                                  variant="ghost"
                                  className="replace-photo"
                                  aria-label={`替换图片 ${index + 1}`}
                                  disabled={loading}
                                  onClick={() => chooseMedia("photo", photo.id)}
                                >
                                  <img
                                    decoding="async"
                                    src={photoUrl(
                                      urls,
                                      photo.mediaId,
                                      scene.photos.length,
                                      true,
                                    )}
                                    alt={`已选图片 ${index + 1}`}
                                  />
                                </Button>
                                <div className="photo-tile-actions">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label={`前移图片 ${index + 1}`}
                                    disabled={index === 0}
                                    onClick={() => {
                                      const photos = [...scene.photos];
                                      [photos[index - 1], photos[index]] = [
                                        photos[index],
                                        photos[index - 1],
                                      ];
                                      edit({ photos });
                                    }}
                                  >
                                    <ArrowLeft size={11} />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label={`后移图片 ${index + 1}`}
                                    disabled={index === scene.photos.length - 1}
                                    onClick={() => {
                                      const photos = [...scene.photos];
                                      [photos[index], photos[index + 1]] = [
                                        photos[index + 1],
                                        photos[index],
                                      ];
                                      edit({ photos });
                                    }}
                                  >
                                    <ArrowRight size={11} />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    aria-label={`删除图片 ${index + 1}`}
                                    onClick={() =>
                                      edit({
                                        photos: scene.photos.filter(
                                          (p) => p.id !== photo.id,
                                        ),
                                      })
                                    }
                                  >
                                    <X size={11} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {scene.photos.length < currentPreset.photos && (
                              <Button
                                variant="outline"
                                className="add-photo-tile"
                                disabled={loading}
                                aria-label="添加图片"
                                onClick={() => chooseMedia("photo")}
                              >
                                <ImagePlus size={22} />
                                <span>选择图片</span>
                              </Button>
                            )}
                          </div>
                          <p className="editor-help">
                            可多选或直接粘贴，版式会自动安排图片。
                          </p>
                          <PhotoSettings scene={scene} onChange={edit} />
                        </div>
                      )}
                      {currentPreset.composition === "cinema" && (
                        <div data-editor-section="video">
                          <div className="editor-group-title">
                            <span>视频</span>
                            <span>可选</span>
                          </div>
                          <div className="video-editor-actions">
                            <Button
                              variant="outline"
                              disabled={loading}
                              onClick={() => chooseMedia("video")}
                            >
                              <Film size={14} />
                              {scene.videoId ? "替换视频" : "选择本地视频"}
                            </Button>
                            {scene.videoId && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => chooseMedia("poster")}
                                >
                                  设置封面
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    pauseMedia();
                                    edit(
                                      applyPreset(
                                        {
                                          ...scene,
                                          videoId: undefined,
                                          posterId: undefined,
                                        },
                                        "story",
                                      ),
                                    );
                                    toast.info("视频已移除，已切换为文字版式");
                                  }}
                                >
                                  移除视频
                                </Button>
                                {toggle("静音播放", scene.muted, (muted) =>
                                  edit({ muted }),
                                )}
                                {toggle("循环播放", scene.loop, (loop) =>
                                  edit({ loop }),
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {scene.composition === "table" && (
                        <div
                          className="legacy-table-editor"
                          data-editor-section="table"
                        >
                          <TableSettings scene={scene} onChange={edit} />
                          <div className="editor-group-title">
                            <span>表格内容</span>
                          </div>
                          <Table>
                            <TableBody>
                              {(
                                scene.table || [
                                  ["项目", "内容"],
                                  ["说明", "信息"],
                                ]
                              ).map((row, r) => (
                                <TableRow key={r}>
                                  {row.map((cell, c) => (
                                    <TableCell key={c}>
                                      <Input
                                        aria-label={`表格 ${r + 1} 行 ${c + 1} 列`}
                                        value={cell}
                                        maxLength={120}
                                        onChange={(e) =>
                                          edit({
                                            table: (
                                              scene.table || [
                                                ["项目", "内容"],
                                                ["说明", "信息"],
                                              ]
                                            ).map((row, ri) =>
                                              row.map((cell, ci) =>
                                                ri === r && ci === c
                                                  ? e.target.value
                                                  : cell,
                                              ),
                                            ),
                                          })
                                        }
                                      />
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      <div
                        className="editor-scene-actions"
                        data-editor-section="manage"
                      >
                        <Button variant="ghost" size="sm" onClick={duplicate}>
                          <Copy size={13} />
                          复制这一屏
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="上移场景"
                          onClick={() => move(-1)}
                          disabled={activeIndex === 0}
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="下移场景"
                          onClick={() => move(1)}
                          disabled={activeIndex === project.scenes.length - 1}
                        >
                          <ArrowDown size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="删除这一屏"
                          disabled={project.scenes.length <= 1}
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <TextStyleEditor
                        data-editor-section="text"
                        scene={scene}
                        onChange={edit}
                        select={select}
                      />
                      <MotionEditor
                        data-editor-section="motion"
                        scene={scene}
                        onChange={edit}
                        select={select}
                        toggle={toggle}
                        experience={experience}
                      />
                    </EditorNavigation>
                  </TabsContent>
                  <TabsContent value="atmosphere">
                    <EditorNavigation
                      scope="atmosphere"
                      selected={section}
                      onSelect={setSection}
                      scene={scene}
                    >
                      {field(
                        "网页名称",
                        <Input
                          aria-label="网页名称"
                          value={project.name}
                          maxLength={60}
                          onChange={(e) =>
                            update((p) => ({ ...p, name: e.target.value }))
                          }
                        />,
                      )}
                      {backgroundUnavailable && (
                        <p className="editor-help" id="background-unavailable">
                          {isOutro
                            ? "收尾页使用固定黑场，背景设置在此页不可用。请切换到其他页面调整全局背景。"
                            : "整屏视频覆盖背景，背景设置在此页不可用。请切换到其他页面调整全局背景。"}
                        </p>
                      )}
                      <BackgroundEditor
                        data-editor-section="background"
                        project={project}
                        update={update}
                        backgroundUnavailable={backgroundUnavailable}
                        paletteAllScenes={paletteAllScenes}
                        setPaletteAllScenes={(value: boolean) => {
                          setPaletteAllScenes(value);
                          localStorage.setItem(
                            "flow-palette-all",
                            value ? "1" : "0",
                          );
                        }}
                        toggle={toggle}
                        choosePalette={(palette: (typeof palettes)[number]) =>
                          update((p) => ({
                            ...p,
                            background: {
                              ...p.background,
                              kind: palette.kind,
                              preset: palette.id,
                              colors: palette.colors,
                            },
                            scenes: p.scenes.map((s) =>
                              paletteAllScenes || s.id === scene.id
                                ? { ...s, textColor: palette.ink }
                                : s,
                            ),
                          }))
                        }
                      />
                      <div data-editor-section="transition">
                        <div className="editor-inline-row">
                          {select(
                            "切屏转场",
                            project.transition,
                            transitions.map((t) => ({
                              value: t.id,
                              label:
                                t.id === "fade" ? "柔和淡入（默认）" : t.label,
                            })),
                            (value) =>
                              update((p) => ({
                                ...p,
                                transition: value as Project["transition"],
                              })),
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="transition-preview"
                            onClick={() => {
                              setEditing(false);
                              setTimeout(() => {
                                if (activeIndex < project.scenes.length - 1) {
                                  experience.current?.next();
                                  setTimeout(
                                    () => experience.current?.previous(),
                                    1400,
                                  );
                                } else {
                                  experience.current?.previous();
                                  setTimeout(
                                    () => experience.current?.next(),
                                    1400,
                                  );
                                }
                              }, 120);
                            }}
                          >
                            <RotateCcw size={13} />
                            预览
                          </Button>
                        </div>
                      </div>
                    </EditorNavigation>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
            <footer className="hark-editor-footer">
              <span>
                <ShieldCheck size={13} />
                {saveState === "saved"
                  ? "修改已自动保存"
                  : saveState === "saving"
                    ? "正在保存…"
                    : "保存失败，请重试"}
              </span>
              <Button variant="ghost" size="sm" onClick={startGuide}>
                <BookOpen size={14} />
                使用指南
              </Button>
            </footer>
          </SheetContent>
        </Sheet>
        <input
          type="file"
          ref={uploadRef}
          hidden
          aria-label="上传素材"
          onChange={(e) => {
            const target = targetRef.current;
            const files = Array.from(e.currentTarget.files || []);
            if (target && files.length) void importMedia(files, target);
            e.currentTarget.value = "";
          }}
        />
        <input
          type="file"
          ref={importRef}
          hidden
          accept=".zip,application/zip"
          aria-label="导入运行包"
          onChange={(e) => {
            if (e.currentTarget.files?.[0])
              setPendingImport(e.currentTarget.files[0]);
            e.currentTarget.value = "";
          }}
        />
        <Dialog open={presetOpen} onOpenChange={setPresetOpen}>
          <DialogContent className="preset-dialog">
            <DialogHeader>
              <DialogTitle>
                {creating ? "选一个适合内容的版式" : "换一种讲述方式"}
              </DialogTitle>
              <DialogDescription>
                文字和图片位由预设固定。替换内容，效果自然成立。按内容形态分组，先选分类再挑版式。
              </DialogDescription>
            </DialogHeader>
            <div className="preset-picker">
              <div className="preset-rail" role="tablist" aria-label="版式分类">
                {presetCategories.map((c) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={presetFilter === c.id}
                    className={`preset-category ${presetFilter === c.id ? "chosen" : ""}`}
                    key={c.id}
                    onClick={() => {
                      setPresetFilter(c.id);
                      const first = presets.find(
                        (p) => !p.legacy && presetCategory(p) === c.id,
                      );
                      if (
                        first &&
                        !presets.some(
                          (p) =>
                            p.id === chosenPreset && presetCategory(p) === c.id,
                        )
                      )
                        setChosenPreset(first.id);
                    }}
                  >
                    <span>{c.label}</span>
                    <small>
                      {
                        presets.filter(
                          (p) => !p.legacy && presetCategory(p) === c.id,
                        ).length
                      }
                    </small>
                  </button>
                ))}
              </div>
              <ScrollArea className="preset-dialog-scroll">
                <div className="preset-grid">
                  {presets
                    .filter(
                      (p) =>
                        !p.legacy &&
                        (presetFilter === "all" ||
                          presetCategory(p) === presetFilter),
                    )
                    .map((preset) => (
                      <Button
                        variant="outline"
                        key={preset.id}
                        className={`preset-choice ${chosenPreset === preset.id ? "selected" : ""}`}
                        onClick={() => setChosenPreset(preset.id)}
                      >
                        <PresetPreview preset={preset} />
                        <strong>{preset.name}</strong>
                        <small>{preset.description}</small>
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </div>
            {!creating && presetLoss.length > 0 && (
              <p className="preset-loss-warning">
                切换后将移除 {presetLoss.join("、")}
              </p>
            )}
            {!creating && (
              <p className="editor-help preset-warning">
                切换前自动保留项目备份，再采用对应数量的内容。
              </p>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPresetOpen(false)}>
                取消
              </Button>
              <Button onClick={() => void applyChosenPreset()}>
                {creating ? "添加这个场景" : "应用这个版式"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={presetLossOpen} onOpenChange={setPresetLossOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>切换版式将减少内容位</AlertDialogTitle>
              <AlertDialogDescription>
                切换后将移除 {presetLoss.join("、")}
                ，可通过撤销或在顶栏「恢复备份」中找回。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => void applyChosenPreset(true)}>
                仍要切换
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>移除第 {activeIndex + 1} 屏？</AlertDialogTitle>
              <AlertDialogDescription>
                这一屏将从网页中移除，可通过“撤销”恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>保留</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>移除这一屏</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={Boolean(pendingImport)}
          onOpenChange={(open) => {
            if (!open) setPendingImport(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>打开这个运行包？</AlertDialogTitle>
              <AlertDialogDescription>
                将载入其中的网页、图片与视频。当前项目会先保留一份本地备份。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => void acceptImport()}>
                打开并继续编辑
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={backups !== null}
          onOpenChange={(open) => {
            if (!open) setBackups(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢复备份</AlertDialogTitle>
              <AlertDialogDescription>
                最近的本地备份都在这里；恢复会把备份写回当前项目。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="backup-list">
              {backups?.map((b) => (
                <div className="backup-row" key={b.id}>
                  <div className="backup-info">
                    <strong>{backupLabel(b.id)}</strong>
                    <span>{b.name}</span>
                    <small>{new Date(b.updatedAt).toLocaleString()}</small>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => setRestoreTarget(b)}
                  >
                    恢复
                  </Button>
                </div>
              ))}
              {backups?.length === 0 && (
                <p className="backup-empty">暂无可用备份</p>
              )}
            </div>
            {storageInfo && (
              <p className="editor-help backup-storage">
                本地已用 {(storageInfo.usage / 1024 / 1024).toFixed(1)} MB
                {storageInfo.quota > 0
                  ? ` / ${(storageInfo.quota / 1024 / 1024 / 1024).toFixed(1)} GB`
                  : ""}{" "}
                ·{" "}
                {storageInfo.persistent ? "已申请持久保存" : "建议定期打包备份"}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>关闭</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={!!restoreTarget}
          onOpenChange={(open) => {
            if (!open) setRestoreTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢复这份备份？</AlertDialogTitle>
              <AlertDialogDescription>
                恢复后当前项目会被该备份覆盖。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => void restoreBackup()}>
                恢复
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster position="bottom-center" />
        <AgentDialog
          open={agentOpen}
          onOpenChange={setAgentOpen}
          connection={connection}
        />
        <AlertDialog open={demoOpen} onOpenChange={setDemoOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>载入软件介绍示例？</AlertDialogTitle>
              <AlertDialogDescription>
                将载入介绍流光功能与使用方法的 8
                屏示例。当前作品会先保留一份浏览器本地备份，可从「恢复备份」找回。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDemoOpen(false);
                  void loadDemo();
                }}
              >
                载入示例
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {!landing && !guide && !agentOpen && guideHint && !fullscreen && (
          <section
            className="hark-guide-hint"
            aria-label="新手指南提示"
            data-hark-surface
          >
            <BookOpen size={21} />
            <div>
              <strong>第一次来？</strong>
              <span>用 1 分钟，认识你的舞台。</span>
            </div>
            <Button size="sm" onClick={startGuide}>
              开始教程
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="暂时隐藏教程提示"
              onClick={() => {
                setGuideHint(false);
                localStorage.setItem("flow-guide-dismissed-v1", "1");
              }}
            >
              <X size={13} />
            </Button>
          </section>
        )}
        {guide && (
          <WorkbenchTour onNavigate={navigateGuide} onClose={closeGuide} />
        )}
      </div>
      {landing && (
        <LandingPage
          onEnter={() => {
            setLanding(false);
            localStorage.setItem("flow-landing-dismissed", "1");
          }}
        />
      )}{" "}
    </div>
  );
}
