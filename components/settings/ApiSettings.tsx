"use client";

import { useState } from "react";
import { RefreshCw, Eye, EyeOff, Check } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { ApiConfig, ApiFormat, ApiProvider } from "@/lib/types";
import { testConnection, fetchModels } from "@/lib/api";
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

  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [manualModel, setManualModel] = useState(false);

  const update = (patch: Partial<ApiConfig>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
    setResult(null);
  };

  const loadModels = async () => {
    setLoadingModels(true);
    setModelError(null);
    try {
      const list = await fetchModels(draft);
      if (list.length === 0) {
        setModelError("未获取到模型，请手动输入");
        setManualModel(true);
      } else {
        setModels(list);
        setManualModel(false);
        // keep current model if present, else pick first
        if (!list.includes(draft.model)) update({ model: list[0] });
      }
    } catch (e) {
      setModelError(`获取失败：${(e as Error).message.slice(0, 80)}`);
      setManualModel(true);
    } finally {
      setLoadingModels(false);
    }
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
        <Field label="线路">
          <div className="flex gap-2">
            {(
              [
                { key: "proxy", label: "中转 API" },
                { key: "claude-code", label: "Claude Code 通道" },
              ] as { key: ApiProvider; label: string }[]
            ).map((p) => (
              <button
                key={p.key}
                onClick={() => update({ provider: p.key })}
                className={`flex-1 py-2.5 rounded-card text-[13px] border transition-colors ${
                  draft.provider === p.key
                    ? "border-cale-accent bg-cale-userBubble text-cale-accent font-medium"
                    : "border-transparent bg-cale-card text-cale-textLight"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="hint">
            {draft.provider === "claude-code"
              ? "使用本机 Claude Code（Pro/Max 订阅额度），无需填地址和 Key。"
              : "使用中转 API 的地址与 Key。"}
          </p>
        </Field>

        {draft.provider === "proxy" ? (
          <>
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
              className="px-3 text-cale-textLight"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="hint">API Key 只保存在本机，不会上传到任何服务器</p>
        </Field>

        <Field label="模型">
          <button
            onClick={loadModels}
            disabled={loadingModels || !draft.baseURL || !draft.apiKey}
            className="w-full mb-2 py-2.5 rounded-card bg-cale-input text-cale-textDark text-[14px] flex items-center justify-center gap-2 active:opacity-70 disabled:opacity-40"
          >
            <RefreshCw
              size={15}
              className={loadingModels ? "animate-spin" : ""}
            />
            {loadingModels ? "获取中…" : "获取模型列表"}
          </button>

          {models.length > 0 && !manualModel ? (
            <select
              value={draft.model}
              onChange={(e) => update({ model: e.target.value })}
              className="input appearance-none"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={draft.model}
              onChange={(e) => update({ model: e.target.value.trim() })}
              placeholder="例如 claude-opus-4-6"
              className="input"
              autoCapitalize="off"
              autoCorrect="off"
            />
          )}
          {modelError && <p className="hint text-red-500">{modelError}</p>}
          {models.length > 0 && !manualModel && (
            <button
              onClick={() => setManualModel(true)}
              className="hint underline"
            >
              改为手动输入
            </button>
          )}
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
          </>
        ) : (
          <div className="rounded-card bg-cale-card px-4 py-3.5 text-[13px] text-cale-textLight leading-relaxed">
            当前线路：
            <span className="text-cale-accent font-medium">
              Claude Code 通道
            </span>
            <br />
            通过本机已登录的 claude CLI 使用订阅额度。当前为插桩版本：界面与配置已就绪，真实调用待在本地接入{" "}
            <code>/api/claude-code</code>。在 Vercel
            等静态托管上会自动回退到中转 API。
          </div>
        )}

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
          <div className="flex items-center justify-center gap-1 text-cale-accent text-[13px]">
            <Check size={14} strokeWidth={2} /> 已保存
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
