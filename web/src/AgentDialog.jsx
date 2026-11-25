import * as React from "react";
import { Bot, ShieldCheck, Copy } from './WorkbenchIcons';

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
const extensionUrl = `https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm`;
const codexCommand = `codex mcp add playwright-extension -- npx -y @playwright/mcp@latest --extension`;
const cursorConfig = JSON.stringify(
  {
    mcpServers: {
      "playwright-extension": {
        command: `npx`,
        args: [`-y`, `@playwright/mcp@latest`, `--extension`],
      },
    },
  },
  null,
  2,
);
const agentPrompt = (
  url,
  client = "Codex",
) => `请用 Playwright MCP 的扩展模式，连接我已打开的 Stage 工作台：${url}
我已安装 Playwright 浏览器扩展。保留当前浏览器里的作品，不要另开隔离浏览器。
先检查 Node.js 和 playwright-extension MCP。缺少 Node.js 时提示我安装；缺少 MCP 时为 ${client} 安装并配置扩展模式。
Codex 配置命令：codex mcp add playwright-extension -- npx -y @playwright/mcp@latest --extension。Cursor 请合并到 MCP 配置并保留其他连接。
配置完成后先尝试使用；如果当前会话没有加载新 MCP，请只提示我重新打开会话，并再次粘贴这段提示词。
首次连接弹出浏览器授权页时，提示我选择当前 Stage 标签并允许连接；不要绕过授权。
连接后调用 await window.flowAgent.ping("${client}")，再依次读取 help()、listPresets()、inspect()。页面显示已连接后，再继续制作。
只使用 flowAgent 的公开方法修改作品，写入逐次 await。保留现有内容，覆盖或删除前先征得我同意；不要直接改数据库或内部状态。
按我的资料确认主题、受众、时长和页数；缺少素材或数据时先询问。完成后逐屏检查，并按要求通过界面导出。
接下来我要制作的内容是：`;
function CopyBlock({ label, value, prompt = false }) {
  const text = React.useRef(null);
  const preview = React.useRef(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(
        prompt ? "提示词已复制，粘贴给 Agent 即可" : label + "已复制",
      );
      if (prompt)
        window.dispatchEvent(new CustomEvent("stage-agent-prompt-copied"));
    } catch {
      if (preview.current) preview.current.open = true;
      text.current?.focus();
      text.current?.select();
      toast.error("复制失败，请手动复制已选中的文字");
    }
  };
  const textarea = (
    <textarea
      ref={text}
      aria-label={label}
      readOnly={true}
      spellCheck={false}
      value={value}
      rows={prompt ? 6 : Math.min(12, value.split("\n").length + 1)}
    />
  );
  if (prompt)
    return (
      <div className={"agent-copy-block agent-prompt-block"}>
        {
          <Button
            size={"lg"}
            onClick={() => void copy()}
            aria-label={"复制提示词"}
          >
            {<Copy size={16} />}
            {"复制提示词"}
          </Button>
        }
        {
          <details ref={preview} className={"agent-guide-details"}>
            {<summary>{"查看完整提示词"}</summary>}
            {textarea}
          </details>
        }
      </div>
    );
  return (
    <div className={"agent-copy-block"}>
      {
        <div className={"agent-copy-heading"}>
          {<span>{label}</span>}
          {
            <Button
              variant={"ghost"}
              size={"sm"}
              onClick={() => void copy()}
              aria-label={"复制" + label}
            >
              {<Copy size={14} />}
              {"复制"}
            </Button>
          }
        </div>
      }
      {textarea}
    </div>
  );
}
function AgentDialog({ open, onOpenChange, connection }) {
  const [client, setClient] = React.useState("codex");
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => { const onCopy = () => setCopied(true); window.addEventListener('stage-agent-prompt-copied', onCopy); return () => window.removeEventListener('stage-agent-prompt-copied', onCopy) }, []);
  const phase = connection?.phase || (copied ? 'checking' : 'idle');
  const status = {
    idle: ['Agent 未连接', '待连接', '完成下面两步，页面收到 Agent 的回执后会显示已连接。'],
    checking: ['等待 Agent 连接', '待回执', '提示词已复制。粘贴给 Agent，按它的提示完成配置和浏览器授权；尚未收到连接回执。'],
    awaiting: ['等待浏览器授权', '等待授权', '请在浏览器扩展授权页选择当前「流光工作台」标签并允许连接。Playwright 扩展需要你本人点击安装，Agent 无法代装。'],
    connected: [(connection?.client || 'Agent') + ' 已连接', '已连接', '当前作品已经可以由 Agent 读取和修改，可以继续告诉它要改什么。']
  }[phase];
  const priorFocus = React.useRef(null);
  const clientName = client === "cursor" ? "Cursor" : "Codex";
  const url = location.href;
  const helpContent = (
    <div>
      {
        <p>
          {
            "先把提示词交给 Agent。只有自动配置失败时，才需要查看下面的手动配置。"
          }
        </p>
      }
      {
        <p>
          {"Agent 提示缺少 Node.js 时，请按它的说明安装，然后重新打开 Agent。"}
        </p>
      }
      {
        <a
          href={"https://nodejs.org/zh-cn/download"}
          target={"_blank"}
          rel={"noreferrer"}
        >
          {"Node.js 官方下载 ↗"}
        </a>
      }
      {
        <Tabs defaultValue={"codex"}>
          {
            <TabsList aria-label={"手动配置的客户端"}>
              {<TabsTrigger value={"codex"}>{"Codex"}</TabsTrigger>}
              {<TabsTrigger value={"cursor"}>{"Cursor"}</TabsTrigger>}
            </TabsList>
          }
          {
            <TabsContent value={"codex"}>
              {<CopyBlock label={"Codex 手动配置命令"} value={codexCommand} />}
              {<p>{"配置后重新打开会话，再粘贴同一段提示词。"}</p>}
            </TabsContent>
          }
          {
            <TabsContent value={"cursor"}>
              {
                <p>
                  {
                    "合并到 ~/.cursor/mcp.json，保留原有配置。在 Cursor 的 MCP 设置中启用后重新打开会话。"
                  }
                </p>
              }
              {<CopyBlock label={"Cursor 手动配置"} value={cursorConfig} />}
            </TabsContent>
          }
        </Tabs>
      }
      {
        <p>
          {
            "没有授权窗口：确认扩展已安装，让 Agent 重新发起连接，并选择当前 Stage 标签。"
          }
        </p>
      }
      {
        <p>
          {
            "尚未显示已连接：表示页面还没有收到 Agent 的连接回执，不一定是浏览器正在等待授权。"
          }
        </p>
      }
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {
        <DialogContent
          className={"agent-guide-dialog"}
          onOpenAutoFocus={() => {
            priorFocus.current =
              document.activeElement instanceof HTMLElement &&
              document.activeElement.matches("button, a, [tabindex]")
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            [
              priorFocus.current,
              ...document.querySelectorAll(".agent-button, .more-button"),
            ]
              .find(
                (element) =>
                  element?.isConnected && element.getClientRects().length,
              )
              ?.focus();
          }}
        >
          {
            <DialogHeader>
              {
                <span className={"agent-guide-eyebrow"}>
                  {<Bot size={18} />}
                  {"与你自己的 AI 一起做"}
                </span>
              }
              {<DialogTitle>{"两步连接你的 Agent"}</DialogTitle>}
              {
                <DialogDescription>
                  {
                    "装好扩展，把提示词发给 Agent。连接成功后，就可以告诉它你想做什么。"
                  }
                </DialogDescription>
              }
            </DialogHeader>
          }
          {
            <div className="agent-guide-body"><div className="stage-agent-live" role="status" aria-live="polite" data-phase={phase}><div className="stage-agent-live-head"><span className="stage-agent-live-dot" aria-hidden="true"/><strong className="stage-agent-live-title">{status[0]}</strong><span className="stage-agent-live-badge">{status[1]}</span></div><p className="stage-agent-live-desc">{status[2]}</p><div className="stage-agent-live-actions"><button type="button" onClick={() => toast.info(status[0])}>查看连接状态</button><a href={extensionUrl} target="_blank" rel="noreferrer">安装 Playwright 扩展</a></div></div>
              {
                <section className={"agent-guide-step"}>
                  {<span className={"agent-step-number"}>{"01"}</span>}
                  {
                    <div>
                      {<h3>{"安装浏览器扩展"}</h3>}
                      {
                        <p>
                          {
                            "在 Chrome 或 Edge 中安装 Playwright 扩展。只需安装一次，装过就跳过。"
                          }
                        </p>
                      }
                      {
                        <div className={"agent-guide-links"}>
                          {
                            <Button variant={"outline"} asChild={true}>
                              {
                                <a
                                  href={extensionUrl}
                                  target={"_blank"}
                                  rel={"noreferrer"}
                                >
                                  {"安装 Playwright 扩展 ↗"}
                                </a>
                              }
                            </Button>
                          }
                        </div>
                      }
                    </div>
                  }
                </section>
              }
              {
                <section className={"agent-guide-step"}>
                  {<span className={"agent-step-number"}>{"02"}</span>}
                  {
                    <div>
                      {<h3>{"复制提示词，发给 Agent"}</h3>}
                      {
                        <p>
                          {
                            "Agent 会检查环境并配置连接。浏览器弹出授权页时，选择当前 Stage 标签并允许连接。"
                          }
                        </p>
                      }
                      {
                        <Tabs value={client} onValueChange={setClient}>
                          {
                            <TabsList aria-label={"选择你的 Agent"}>
                              {
                                <TabsTrigger value={"codex"}>
                                  {"Codex"}
                                </TabsTrigger>
                              }
                              {
                                <TabsTrigger value={"cursor"}>
                                  {"Cursor"}
                                </TabsTrigger>
                              }
                            </TabsList>
                          }
                          {
                            <TabsContent value={"codex"}>
                              {
                                <CopyBlock
                                  label={"Agent 提示词"}
                                  value={agentPrompt(url, "Codex")}
                                  prompt={true}
                                />
                              }
                            </TabsContent>
                          }
                          {
                            <TabsContent value={"cursor"}>
                              {
                                <CopyBlock
                                  label={"Agent 提示词"}
                                  value={agentPrompt(url, "Cursor")}
                                  prompt={true}
                                />
                              }
                            </TabsContent>
                          }
                        </Tabs>
                      }
                      {
                        <p className={"agent-guide-note"}>
                          {"按 " +
                            clientName +
                            " 的提示操作即可。首次配置后若提示重新打开会话，再粘贴同一段提示词。"}
                        </p>
                      }
                    </div>
                  }
                </section>
              }
              {
                <details className={"agent-guide-details"}>
                  {<summary>{"连接遇到问题？"}</summary>}
                  {helpContent}
                </details>
              }
              {
                <div className={"agent-guide-privacy"}>
                  {<ShieldCheck size={17} />}
                  {
                    <p>
                      {
                        "作品保存在当前浏览器，本站不接收作品内容。Agent 读取的资料会按你所用 AI 的设置处理。"
                      }
                    </p>
                  }
                </div>
              }
              {
                <details className={"agent-guide-details"}>
                  {<summary>{"Agent 可以做什么？"}</summary>}
                  {
                    <p>
                      {
                        "修改文字、图片、视频、图表和表格，添加页面，调整背景与转场，并通过工作台导出 PPT、HTML 或 ZIP。"
                      }
                    </p>
                  }
                  {
                    <p>
                      {
                        "连接状态以 Agent 调用 flowAgent.ping() 的真实回执为准；页面无法直接判断扩展是否已安装。"
                      }
                    </p>
                  }
                </details>
              }
            </div>
          }
          {
            <div className={"agent-guide-footer"}>
              {
                <span id={"agent-status-footer"}>
                  {<ShieldCheck size={14} />}
                  {<span>{'工作台正常 · ' + (phase === 'connected' ? (connection?.client || 'Agent') + ' 已连接' : phase === 'awaiting' ? '等待浏览器授权' : phase === 'checking' ? '等待 Agent 回执' : 'Agent 未连接')}</span>}
                </span>
              }
              {
                <Button onClick={() => onOpenChange(false)}>
                  {"回到工作台"}
                </Button>
              }
            </div>
          }
        </DialogContent>
      }
    </Dialog>
  );
}

export default AgentDialog;
