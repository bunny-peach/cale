"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { List, Plus, Square, Send, Trash2, X } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { uid, load, save, KEYS } from "@/lib/storage";
import { Conversation, Message } from "@/lib/types";
import { streamChat } from "@/lib/api";
import { buildSystemPrompt, buildMemoryContext } from "@/lib/prompt";
import { parseMarkers } from "@/lib/markers";
import Markdown from "@/components/Markdown";
import ThinkingBlock from "@/components/chat/ThinkingBlock";

// Theater mode pushes the model to write long-form; ask for the max we can.
const THEATER_MAX_TOKENS = 65536;

export default function TheaterView() {
  const app = useApp();
  const {
    apiConfig,
    theaterConversations: convs,
    setTheaterConversations: setConvs,
    theaterCurrentId: currentId,
    setTheaterCurrentId: setCurrentId,
    settings,
  } = app;

  const [listOpen, setListOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const current = useMemo(
    () => convs.find((c) => c.id === currentId) ?? null,
    [convs, currentId]
  );
  const messages = current?.messages ?? [];
  const displayName = settings.caleName || "Cale";

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  };
  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const update = (id: string, fn: (c: Conversation) => Conversation) =>
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  const newPiece = (): string => {
    const conv: Conversation = {
      id: uid(),
      title: "",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConvs((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    return conv.id;
  };

  const runAssistant = async (cid: string, history: Message[], aId: string) => {
    const prevActive = load<number | null>(KEYS.lastActive, null);
    save(KEYS.lastActive, Date.now());
    const system = buildSystemPrompt({
      systemPrompt: app.systemPrompt,
      memories: app.memories,
      wishlist: app.wishlist,
      settings: app.settings,
      periodData: app.periodData,
      todayMood: app.todayMood
        ? { mood: app.todayMood.mood, note: app.todayMood.note }
        : undefined,
      theater: true,
      lastActive: prevActive,
      weather:
        app.settings.weatherEnabled && app.weather
          ? { tempC: app.weather.tempC, desc: app.weather.desc }
          : null,
    });

    // Inject OFF memories as hidden context on the first user message (shared lib)
    let finalHistory = history;
    const memCtx = buildMemoryContext(app.memories);
    if (memCtx) {
      const idx = history.findIndex((m) => m.role === "user");
      if (idx >= 0) {
        finalHistory = history.map((m, i) =>
          i === idx
            ? { ...m, hiddenText: [memCtx, m.hiddenText].filter(Boolean).join("\n") }
            : m
        );
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    let acc = "";
    let think = "";
    try {
      await streamChat(apiConfig, system, finalHistory, {
        signal: controller.signal,
        maxTokens: THEATER_MAX_TOKENS,
        onThinking: (d) => {
          think += d;
          update(cid, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === aId ? { ...m, thinking: think } : m
            ),
          }));
          scrollToBottom();
        },
        onText: (d) => {
          acc += d;
          update(cid, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === aId ? { ...m, content: acc } : m
            ),
          }));
          scrollToBottom();
        },
        onUsage: (i, o) => {
          app.recordUsage(i, o);
          app.recordQuota(i, o);
        },
      });

      const parsed = parseMarkers(acc);
      parsed.diaryAdds.forEach((d) => app.addDiary(d.title, d.content));
      parsed.moodNotes.forEach((n) => app.setTodayMoodNote(n));
      update(cid, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === aId
            ? { ...m, content: parsed.cleanText.trim(), thinking: think || undefined }
            : m
        ),
        updatedAt: Date.now(),
      }));
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        update(cid, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === aId
              ? {
                  ...m,
                  content:
                    (m.content ? m.content + "\n\n" : "") +
                    `（出错了）${(err as Error).message}`,
                }
              : m
          ),
        }));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const submit = () => {
    if (streaming) return;
    const body = text.trim();
    if (!body) return;
    if (!apiConfig.baseURL && apiConfig.provider === "proxy") return;
    let cid = currentId;
    if (!cid || !convs.some((c) => c.id === cid)) cid = newPiece();
    const base = convs.find((c) => c.id === cid);
    const prior = base?.messages ?? [];
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: body,
      createdAt: Date.now(),
    };
    const aMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };
    update(cid!, (c) => ({
      ...c,
      title: c.title || body.slice(0, 18),
      messages: [...c.messages, userMsg, aMsg],
      updatedAt: Date.now(),
    }));
    setText("");
    if (taRef.current) taRef.current.style.height = "auto";
    scrollToBottom();
    runAssistant(cid!, [...prior, userMsg], aMsg.id);
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const sorted = [...convs].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-cale-bg">
      {/* Header */}
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <button
          onClick={() => setListOpen(true)}
          className="w-9 h-9 flex items-center justify-center text-cale-textLight active:opacity-60"
          aria-label="剧场历史"
        >
          <List size={21} strokeWidth={1.8} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-[16px] font-semibold truncate px-2">
            {current?.title || "小剧场"}
          </div>
          <div className="text-[11px] text-cale-textLight leading-tight">
            小说质感 · 长篇沉浸
          </div>
        </div>
        <button
          onClick={newPiece}
          className="w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
          aria-label="新篇章"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      </header>

      {/* Reading area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[680px] mx-auto px-5 py-6 space-y-7">
          {messages.length === 0 && (
            <div className="h-full text-center text-cale-textLight text-[15px] mt-24">
              写下开场，和 {displayName} 一起展开一幕小剧场。
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] text-[14px] text-cale-textLight border-r-2 border-cale-accent/50 pr-3 text-right leading-relaxed">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id}>
                {m.thinking && (
                  <ThinkingBlock
                    thinking={m.thinking}
                    streaming={streaming && i === messages.length - 1}
                  />
                )}
                <div className="theater-prose text-cale-textDark text-[16.5px] leading-[2.0]">
                  {m.content ? (
                    <Markdown>{m.content}</Markdown>
                  ) : streaming ? (
                    <span className="text-cale-textLight">
                      {displayName} 正在落笔…
                    </span>
                  ) : null}
                  {streaming &&
                    m.content &&
                    i === messages.length - 1 && (
                      <span className="cale-cursor" />
                    )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 bg-cale-card border-t border-cale-divider px-3 pt-2 pb-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-cale-input rounded-[18px] px-4 py-2">
            <textarea
              ref={taRef}
              value={text}
              rows={1}
              placeholder="写下情节、场景或一句提示…"
              onChange={(e) => {
                setText(e.target.value);
                const ta = taRef.current;
                if (ta) {
                  ta.style.height = "auto";
                  ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
                }
              }}
              className="w-full bg-transparent outline-none resize-none text-[16px] leading-[22px] max-h-[120px] no-scrollbar placeholder:text-cale-textLight"
            />
          </div>
          {streaming ? (
            <button
              onClick={stop}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-cale-accent text-white flex items-center justify-center active:opacity-80"
              aria-label="停止"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-cale-accent text-white disabled:opacity-40"
              aria-label="发送"
            >
              <Send size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* History list */}
      {listOpen && (
        <div className="absolute inset-0 z-30 flex flex-col bg-cale-bg">
          <header
            className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <div className="flex-1 text-[16px] font-semibold text-center">
              剧场历史
            </div>
            <button
              onClick={() => setListOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-cale-textLight active:opacity-60"
            >
              <X size={20} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
            <button
              onClick={() => {
                newPiece();
                setListOpen(false);
              }}
              className="w-full flex items-center gap-2 justify-center py-3 rounded-[14px] border border-dashed border-cale-divider text-cale-accent active:opacity-70"
            >
              <Plus size={17} /> 新篇章
            </button>
            {sorted.length === 0 && (
              <div className="text-center text-cale-textLight text-[14px] mt-10">
                还没有小剧场
              </div>
            )}
            {sorted.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setCurrentId(c.id);
                  setListOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-[14px] bg-cale-card active:opacity-80 ${
                  c.id === currentId ? "ring-1 ring-cale-accent" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] text-cale-textDark">
                    {c.title || "未命名篇章"}
                  </div>
                  <div className="text-[12px] text-cale-textLight">
                    {new Date(c.updatedAt).toLocaleString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {c.messages.filter((m) => m.role === "assistant").length} 幕
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConvs((prev) => prev.filter((x) => x.id !== c.id));
                    if (currentId === c.id) setCurrentId(null);
                  }}
                  className="text-cale-textLight active:opacity-60"
                  aria-label="删除"
                >
                  <Trash2 size={17} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
