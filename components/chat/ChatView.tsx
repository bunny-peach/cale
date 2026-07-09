"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppContext";
import { uid } from "@/lib/storage";
import { Conversation, Message, ChatImage } from "@/lib/types";
import { streamChat } from "@/lib/api";
import { buildSystemPrompt } from "@/lib/prompt";
import { parseMarkers } from "@/lib/markers";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ConversationSidebar from "./ConversationSidebar";

export default function ChatView() {
  const app = useApp();
  const {
    apiConfig,
    conversations,
    setConversations,
    currentId,
    setCurrentId,
  } = app;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [actionMsg, setActionMsg] = useState<Message | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = useMemo(
    () => conversations.find((c) => c.id === currentId) ?? null,
    [conversations, currentId]
  );

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1600);
  };

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

  const updateConversation = (
    id: string,
    updater: (c: Conversation) => Conversation
  ) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? updater(c) : c))
    );
  };

  const newConversation = (): string => {
    const conv: Conversation = {
      id: uid(),
      title: "",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    return conv.id;
  };

  const handleSend = async (text: string, images: ChatImage[]) => {
    if (!apiConfig.baseURL) {
      showToast("请先在设置中配置 API");
      return;
    }
    let convId = currentId;
    if (!convId || !conversations.some((c) => c.id === convId)) {
      convId = newConversation();
    }

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      images: images.length ? images : undefined,
      createdAt: Date.now(),
    };
    const assistantMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };

    const cid = convId!;
    updateConversation(cid, (c) => ({
      ...c,
      title: c.title || text.slice(0, 20) || "图片对话",
      messages: [...c.messages, userMsg, assistantMsg],
      updatedAt: Date.now(),
    }));
    scrollToBottom();

    // Build history from the messages we just derived (avoid stale state)
    const base = conversations.find((c) => c.id === cid);
    const history: Message[] = [...(base?.messages ?? []), userMsg];

    const system = buildSystemPrompt({
      systemPrompt: app.systemPrompt,
      memories: app.memories,
      wishlist: app.wishlist,
      settings: app.settings,
      periodData: app.periodData,
      todayMood: app.todayMood
        ? { mood: app.todayMood.mood, note: app.todayMood.note }
        : undefined,
    });

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    let acc = "";
    let think = "";
    try {
      await streamChat(apiConfig, system, history, {
        signal: controller.signal,
        onThinking: (d) => {
          think += d;
          updateConversation(cid, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, thinking: think } : m
            ),
          }));
          scrollToBottom();
        },
        onText: (d) => {
          acc += d;
          updateConversation(cid, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: acc } : m
            ),
          }));
          scrollToBottom();
        },
        onUsage: (input, output) => app.recordUsage(input, output),
      });

      // Parse Cale's self-action markers, strip from displayed text
      const parsed = parseMarkers(acc);
      updateConversation(cid, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: parsed.cleanText, thinking: think || undefined }
            : m
        ),
        updatedAt: Date.now(),
      }));
      parsed.mcpAdds.forEach((t) => app.addWish(t, "cale"));
      parsed.songAdds.forEach((s) =>
        app.setPlaylist((prev) => (prev.includes(s) ? prev : [...prev, s]))
      );
      parsed.bookAdds.forEach((b) =>
        app.setBookshelf((prev) => (prev.includes(b) ? prev : [...prev, b]))
      );
      parsed.moodNotes.forEach((n) => app.setTodayMoodNote(n));
      if (
        parsed.mcpAdds.length ||
        parsed.songAdds.length ||
        parsed.bookAdds.length
      ) {
        showToast("Cale 悄悄记下了一些东西 ✨");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        updateConversation(cid, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content:
                    (m.content ? m.content + "\n\n" : "") +
                    `⚠️ ${(err as Error).message}`,
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

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const saveAsDiary = (m: Message) => {
    app.setDiary((prev) => [
      {
        id: uid(),
        title: `来自聊天 · ${new Date().toLocaleDateString("zh-CN")}`,
        content: m.content,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setActionMsg(null);
    showToast("已保存为日记 📖");
  };

  const copyMessage = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.content);
      showToast("已复制");
    } catch {
      showToast("复制失败");
    }
    setActionMsg(null);
  };

  const messages = current?.messages ?? [];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Top bar */}
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-full bg-cale-primary/30 flex items-center justify-center text-lg active:opacity-70"
          aria-label="对话列表"
        >
          🌸
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold">
          {app.settings.caleName || "Cale"}
        </div>
        <button
          onClick={() => {
            newConversation();
            showToast("新对话已开始");
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-cale-accent text-xl active:opacity-70"
          aria-label="新建对话"
        >
          ✏️
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-cale-textLight">
            <div className="text-5xl mb-3">🌸</div>
            <div className="text-[15px]">
              和 {app.settings.caleName || "Cale"} 开始聊天吧
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            streaming={
              streaming && i === messages.length - 1 && m.role === "assistant"
            }
            onAction={setActionMsg}
          />
        ))}
      </div>

      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        streaming={streaming}
      />

      <ConversationSidebar
        open={sidebarOpen}
        conversations={conversations}
        currentId={currentId}
        onSelect={(id) => {
          setCurrentId(id);
          setSidebarOpen(false);
        }}
        onNew={() => {
          newConversation();
          setSidebarOpen(false);
        }}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (currentId === id) setCurrentId(null);
        }}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Action sheet */}
      {actionMsg && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/30"
          onClick={() => setActionMsg(null)}
        >
          <div
            className="w-full bg-cale-card rounded-t-2xl p-2 pb-6"
            style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => copyMessage(actionMsg)}
              className="w-full py-3.5 text-center text-[16px] text-cale-textDark active:bg-cale-input rounded-xl"
            >
              复制
            </button>
            {actionMsg.role === "assistant" && actionMsg.content && (
              <button
                onClick={() => saveAsDiary(actionMsg)}
                className="w-full py-3.5 text-center text-[16px] text-cale-textDark active:bg-cale-input rounded-xl"
              >
                保存为日记
              </button>
            )}
            <button
              onClick={() => setActionMsg(null)}
              className="w-full py-3.5 mt-1 text-center text-[16px] text-cale-accent active:bg-cale-input rounded-xl"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
