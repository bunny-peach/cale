"use client";

import { useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { KEYS } from "@/lib/storage";
import ApiSettings from "./ApiSettings";
import SystemPromptSettings from "./SystemPromptSettings";
import MemoryManager from "./MemoryManager";
import WishlistManager from "./WishlistManager";
import RecommendManager from "./RecommendManager";

type Page =
  | "main"
  | "api"
  | "prompt"
  | "memory"
  | "wishlist"
  | "recommend";

const ALL_KEYS = [
  ...Object.values(KEYS),
  "cale_playlist",
  "cale_bookshelf",
];

export default function SettingsView({ goToChat }: { goToChat: () => void }) {
  const app = useApp();
  const [page, setPage] = useState<Page>("main");
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  const back = () => setPage("main");

  if (page === "api") return <ApiSettings onBack={back} />;
  if (page === "prompt") return <SystemPromptSettings onBack={back} />;
  if (page === "memory") return <MemoryManager onBack={back} />;
  if (page === "wishlist") return <WishlistManager onBack={back} />;
  if (page === "recommend") return <RecommendManager onBack={back} />;

  const exportData = () => {
    const dump: Record<string, unknown> = {};
    ALL_KEYS.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw != null) {
        try {
          dump[k] = JSON.parse(raw);
        } catch {
          dump[k] = raw;
        }
      }
    });
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cale-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("已导出备份 ✓");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([k, v]) => {
          if (ALL_KEYS.includes(k)) {
            localStorage.setItem(k, JSON.stringify(v));
          }
        });
        showToast("导入成功，正在刷新…");
        setTimeout(() => window.location.reload(), 900);
      } catch {
        showToast("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
  };

  const clearConversations = () => {
    if (
      !confirm("确定要清除所有对话记录吗？此操作不可恢复。")
    )
      return;
    app.setConversations([]);
    app.setCurrentId(null);
    showToast("已清除所有对话");
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center justify-center h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="text-[17px] font-semibold">设置</div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-4">
        {!app.apiConfig.baseURL && (
          <div className="bg-cale-userBubble/60 rounded-card px-4 py-3 text-[13px] text-cale-accent">
            👋 欢迎！请先配置 API，就能开始和 Cale 聊天啦。
          </div>
        )}

        {/* Core settings */}
        <Group title="核心设置">
          <Row
            label="API 设置"
            icon="🔑"
            value={app.apiConfig.baseURL ? "已配置" : "未配置"}
            onClick={() => setPage("api")}
          />
          <Row
            label="System Prompt"
            icon="📝"
            value={`${app.systemPrompt.length} 字`}
            onClick={() => setPage("prompt")}
          />
        </Group>

        {/* Sub features */}
        <Group title="Cale 的小世界">
          <Row
            label="记忆库"
            icon="🧠"
            value={`${app.memories.length} 条`}
            onClick={() => setPage("memory")}
          />
          <Row
            label="MCP 愿望清单"
            icon="✨"
            value={`${app.wishlist.length} 项`}
            onClick={() => setPage("wishlist")}
          />
          <Row
            label="Cale 的推荐"
            icon="🎁"
            value={`${app.playlist.length + app.bookshelf.length} 条`}
            onClick={() => setPage("recommend")}
          />
        </Group>

        {/* Personalization */}
        <Group title="个性化">
          <div className="px-4 py-3 space-y-3">
            <LabeledInput
              label="Cale 的备注名"
              value={app.settings.caleName}
              placeholder="Cale"
              onChange={(v) =>
                app.setSettings({ ...app.settings, caleName: v })
              }
            />
            <LabeledInput
              label="在一起的日期"
              type="date"
              value={app.settings.anniversary}
              onChange={(v) =>
                app.setSettings({ ...app.settings, anniversary: v })
              }
            />
            <div className="flex gap-3">
              <LabeledInput
                label="输入单价 (元/1M)"
                type="number"
                value={String(app.settings.inputPrice)}
                onChange={(v) =>
                  app.setSettings({
                    ...app.settings,
                    inputPrice: Number(v) || 0,
                  })
                }
              />
              <LabeledInput
                label="输出单价 (元/1M)"
                type="number"
                value={String(app.settings.outputPrice)}
                onChange={(v) =>
                  app.setSettings({
                    ...app.settings,
                    outputPrice: Number(v) || 0,
                  })
                }
              />
            </div>
          </div>
        </Group>

        {/* Data management */}
        <Group title="数据管理">
          <Row label="导出数据" icon="⬇️" onClick={exportData} />
          <Row
            label="导入数据"
            icon="⬆️"
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && importData(e.target.files[0])
            }
          />
          <Row
            label="清除所有对话记录"
            icon="🗑"
            danger
            onClick={clearConversations}
          />
        </Group>

        <div className="text-center text-[12px] text-cale-textLight pt-2 pb-4">
          Cale · 只属于你的 AI 伙伴 🌸
        </div>
      </div>

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[12px] text-cale-textLight px-3 mb-1.5">{title}</div>
      <div className="bg-cale-card rounded-card overflow-hidden divide-y divide-cale-divider">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  icon,
  value,
  danger,
  onClick,
}: {
  label: string;
  icon: string;
  value?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-4 py-3.5 active:bg-cale-input"
    >
      <span className="text-lg mr-3">{icon}</span>
      <span
        className={`flex-1 text-left text-[15px] ${
          danger ? "text-red-500" : "text-cale-textDark"
        }`}
      >
        {label}
      </span>
      {value && (
        <span className="text-[13px] text-cale-textLight mr-1">{value}</span>
      )}
      <span className="text-cale-textLight">›</span>
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block flex-1">
      <span className="text-[13px] text-cale-textLight">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cale-input rounded-xl px-3 py-2 outline-none text-[16px] mt-1"
        inputMode={type === "number" ? "decimal" : undefined}
      />
    </label>
  );
}
