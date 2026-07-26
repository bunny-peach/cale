"use client";

import { useState } from "react";
import { Code2, Maximize2, X, Download, Copy, Check } from "lucide-react";

// A card for an HTML document Cale generated (网页模式). Shows a live, isolated
// preview and opens a full-screen viewer on tap — similar to chat artifacts.
export default function HtmlArtifact({ html }: { html: string }) {
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cale-page.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Preview card */}
      <button
        onClick={() => setFull(true)}
        className="block w-full text-left rounded-[14px] overflow-hidden border border-cale-divider bg-cale-card no-glass active:opacity-90"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-cale-divider">
          <Code2 size={15} className="text-cale-accent" />
          <span className="text-[13px] font-medium text-cale-textDark">网页</span>
          <Maximize2 size={14} className="ml-auto text-cale-textLight" />
        </div>
        <div className="relative h-[190px] bg-white overflow-hidden">
          <iframe
            srcDoc={html}
            title="网页预览"
            sandbox="allow-scripts allow-popups allow-forms"
            scrolling="no"
            className="pointer-events-none border-0"
            style={{
              width: "200%",
              height: "380px",
              transform: "scale(0.5)",
              transformOrigin: "top left",
            }}
          />
          <span className="absolute bottom-2 right-2 text-[11px] text-white bg-black/45 rounded-full px-2 py-0.5">
            点击全屏
          </span>
        </div>
      </button>

      {/* Full-screen viewer */}
      {full && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/70">
          <div
            className="flex-shrink-0 flex items-center gap-2 px-3 bg-cale-card"
            style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)", paddingBottom: "0.5rem" }}
          >
            <span className="text-[15px] font-semibold text-cale-textDark">网页预览</span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={copy}
                className="h-8 px-2.5 flex items-center gap-1 rounded-full text-[13px] text-cale-textDark bg-cale-input active:opacity-70"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "已复制" : "代码"}
              </button>
              <button
                onClick={download}
                className="h-8 px-2.5 flex items-center gap-1 rounded-full text-[13px] text-cale-textDark bg-cale-input active:opacity-70"
              >
                <Download size={14} /> 下载
              </button>
              <button
                onClick={() => setFull(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-cale-textDark bg-cale-input active:opacity-70"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <iframe
            srcDoc={html}
            title="网页全屏预览"
            sandbox="allow-scripts allow-popups allow-forms allow-modals"
            className="flex-1 w-full border-0 bg-white"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          />
        </div>
      )}
    </>
  );
}
