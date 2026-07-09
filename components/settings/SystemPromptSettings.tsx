"use client";

import { useState } from "react";
import { useApp } from "@/components/AppContext";
import SubPageHeader from "./SubPageHeader";

export default function SystemPromptSettings({
  onBack,
}: {
  onBack: () => void;
}) {
  const { systemPrompt, setSystemPrompt } = useApp();
  const [draft, setDraft] = useState(systemPrompt);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSystemPrompt(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader
        title="System Prompt"
        onBack={onBack}
        right={
          <button
            onClick={save}
            className="text-cale-accent text-[15px] font-medium active:opacity-70"
          >
            保存
          </button>
        }
      />
      <div className="flex-1 flex flex-col px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-cale-textLight">
            Cale 的人设手册
          </span>
          <span className="text-[12px] text-cale-textLight">
            {draft.length} 字
          </span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
          placeholder="在这里粘贴 Cale 的手册内容…"
          className="flex-1 bg-cale-card rounded-card px-3 py-3 outline-none text-[15px] leading-relaxed resize-none"
        />
        {saved && (
          <div className="text-center text-cale-accent text-[13px] mt-2">
            已保存 ✓
          </div>
        )}
        <p className="text-[12px] text-cale-textLight mt-2 px-1">
          记忆库、经期状态、心情、MCP 清单会在发送时自动附加到 prompt 后面。
        </p>
      </div>
    </div>
  );
}
