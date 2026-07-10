"use client";

import { useState } from "react";
import { useApp } from "@/components/AppContext";
import { ApiConfig, ApiFormat } from "@/lib/types";
import { testConnection } from "@/lib/api";
import SubPageHeader from "./SubPageHeader";

export default function ApiSettings({ onBack }: { onBack: () => void }) {
  const { apiConfig, setApiConfig } = useApp();
  const [draft, setDraft] = useState<ApiConfig>(apiConfig);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(
    null
  );
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<ApiConfig>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
    setResult(null);
  };

  const save = () => {
    setApiConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    // Save first so the test uses the latest values
    setApiConfig(draft);
    try {
      const reply = await testConnection(draft);
      setResult({ ok: true, msg: `连接成功！Cale 回复：${reply.slice(0, 60)}` });
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader
        title="API 设置"
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
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        <Field label="API 地址">
          <input
            value={draft.baseURL}
            onChange={(e) => update({ baseURL: e.target.value.trim() })}
            placeholder="输入中转API地址"
            className="input"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <p className="hint">例如 https://api.example.com（无需带 /v1）</p>
        </Field>

        <Field label="API Key">
          <div className="flex items-center bg-cale-card rounded-card">
            <input
              value={draft.apiKey}
              onChange={(e) => update({ apiKey: e.target.value.trim() })}
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              className="flex-1 bg-transparent px-3 py-2.5 outline-none text-[16px]"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              onClick={() => setShowKey((s) => !s)}
              className="px-3 text-cale-textLight text-lg"
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
          <p className="hint">API Key 只保存在本机，不会上传到任何服务器</p>
        </Field>

        <Field label="模型名称">
          <input
            value={draft.model}
            onChange={(e) => update({ model: e.target.value.trim() })}
            placeholder="例如 claude-opus-4-6"
            className="input"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </Field>

        <Field label="接口格式">
          <div className="flex gap-2">
            {(
              [
                { key: "anthropic", label: "Anthropic 原生" },
                { key: "openai", label: "OpenAI 兼容" },
              ] as { key: ApiFormat; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => update({ format: f.key })}
                className={`flex-1 py-2.5 rounded-card text-[14px] border transition-colors ${
                  draft.format === f.key
                    ? "border-cale-accent bg-cale-userBubble text-cale-accent font-medium"
                    : "border-transparent bg-cale-card text-cale-textLight"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Field>

        <button
          onClick={test}
          disabled={testing || !draft.baseURL || !draft.model}
          className="w-full py-3 rounded-card bg-cale-primary text-white font-medium active:opacity-80 disabled:opacity-40"
        >
          {testing ? "测试中…" : "测试连接"}
        </button>

        {result && (
          <div
            className={`text-[13px] rounded-card px-3 py-2.5 ${
              result.ok
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {result.msg}
          </div>
        )}

        {saved && (
          <div className="text-center text-cale-accent text-[13px]">
            已保存 ✓
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: #ffffff;
          border-radius: 14px;
          padding: 10px 12px;
          outline: none;
          font-size: 16px;
        }
        .hint {
          font-size: 12px;
          color: #8e8e93;
          margin-top: 6px;
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[13px] text-cale-textLight mb-1.5 px-1">{label}</div>
      {children}
    </div>
  );
}
