"use client";

import { useRef, useState } from "react";
import { Heart, RotateCcw } from "lucide-react";
import { Message } from "@/lib/types";
import Markdown from "@/components/Markdown";
import ThinkingBlock from "./ThinkingBlock";

export default function MessageBubble({
  message,
  streaming,
  onAction,
  onLike,
  onQuote,
  onRegenerate,
}: {
  message: Message;
  streaming?: boolean;
  onAction: (m: Message) => void;
  onLike: (m: Message) => void;
  onQuote?: (m: Message) => void;
  onRegenerate?: (m: Message) => void;
}) {
  const isUser = message.role === "user";
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const [dragX, setDragX] = useState(0);
  const moved = useRef(false);

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    moved.current = false;
    pressTimer.current = setTimeout(() => onAction(message), 500);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      moved.current = true;
      clearPress();
    }
    // Left-swipe to quote (Cale messages only)
    if (!isUser && onQuote && dx < 0 && Math.abs(dx) > Math.abs(dy)) {
      setDragX(Math.max(dx, -70));
    }
  };

  const onTouchEnd = () => {
    clearPress();
    if (!isUser && onQuote && dragX < -50) {
      onQuote(message);
    }
    setDragX(0);
    if (!moved.current) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        onLike(message);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  };

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && message.thinking && (
        <div className="max-w-[85%]">
          <ThinkingBlock thinking={message.thinking} streaming={streaming} />
        </div>
      )}

      <div
        className="relative max-w-[85%]"
        style={{
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          transition: dragX ? "none" : "transform 0.2s",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onAction(message);
        }}
        onDoubleClick={() => onLike(message)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Quoted message */}
        {message.quote && (
          <div
            className={`text-[12px] mb-1 px-2.5 py-1 rounded-lg text-cale-textLight ${
              isUser ? "ml-auto" : ""
            }`}
            style={{ background: "rgba(0,0,0,0.05)", maxWidth: "100%" }}
          >
            <span className="font-medium">{message.quote.author}</span>：
            {message.quote.text.slice(0, 40)}
          </div>
        )}

        <div
          className={`relative px-3.5 py-2.5 text-[15px] select-text ${
            isUser ? "text-cale-textDark" : "text-cale-textDark"
          }`}
          style={{
            background: isUser ? "#F5E0EA" : "#FFFFFF",
            borderRadius: 18,
            borderBottomRightRadius: isUser ? 5 : 18,
            borderBottomLeftRadius: isUser ? 18 : 5,
            boxShadow: isUser ? "none" : "0 1px 2px rgba(45,45,45,0.06)",
          }}
        >
          {/* Tail */}
          <span
            className="absolute bottom-0 w-3 h-3"
            style={{
              background: isUser ? "#F5E0EA" : "#FFFFFF",
              right: isUser ? -5 : undefined,
              left: isUser ? undefined : -5,
              clipPath: isUser
                ? "polygon(0 0, 0 100%, 100% 100%)"
                : "polygon(100% 0, 100% 100%, 0 100%)",
            }}
          />
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {message.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.dataUrl}
                  alt="attachment"
                  className="max-w-[160px] max-h-[160px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {message.content ? (
            <Markdown>{message.content}</Markdown>
          ) : streaming && !message.thinking ? (
            <span className="text-cale-textLight">Cale 正在思考…</span>
          ) : null}
          {streaming && message.content && <span className="cale-cursor" />}
        </div>

        {/* Like heart */}
        {message.liked && (
          <div
            className={`absolute -bottom-2 ${
              isUser ? "left-0" : "right-0"
            } bg-white rounded-full p-0.5 shadow`}
          >
            <Heart size={12} className="text-cale-accent" fill="#D4849F" />
          </div>
        )}
      </div>

      {/* Regenerate (Cale replies only, when not streaming) */}
      {!isUser && onRegenerate && !streaming && message.content && (
        <button
          onClick={() => onRegenerate(message)}
          className="mt-1 ml-1 flex items-center gap-1 text-[12px] text-cale-textLight active:opacity-60"
        >
          <RotateCcw size={12} strokeWidth={1.8} />
          重新回复
        </button>
      )}
    </div>
  );
}
