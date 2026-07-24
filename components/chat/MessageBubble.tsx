"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, RotateCcw, Copy, MoreHorizontal } from "lucide-react";
import { Message } from "@/lib/types";
import { useApp } from "@/components/AppContext";
import Markdown from "@/components/Markdown";
import ThinkingBlock from "./ThinkingBlock";
import PayloadCard from "./PayloadCard";

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
  const { settings } = useApp();
  const claude = settings.theme === "claude";
  const isUser = message.role === "user";
  const isPayload = !!message.payload;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const [dragX, setDragX] = useState(0);
  const moved = useRef(false);

  // Double-tap "like" heart burst animation
  const [burst, setBurst] = useState(false);
  const prevLiked = useRef(message.liked);
  useEffect(() => {
    if (message.liked && !prevLiked.current) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 900);
      prevLiked.current = message.liked;
      return () => clearTimeout(t);
    }
    prevLiked.current = message.liked;
  }, [message.liked]);

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const copy = () => {
    navigator.clipboard?.writeText(message.content).catch(() => {});
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

  // Claude theme: no bubbles — messages sit directly on the canvas, wider and
  // with slightly larger, "readable" type. User messages keep a subtle rounded
  // card so turn-taking stays clear.
  const bubbleClass = isPayload
    ? ""
    : claude
      ? isUser
        ? "bg-cale-userBubble rounded-[18px] px-4 py-2.5 text-[15px]"
        : "px-0.5 py-0.5 text-[16px] leading-[1.8]"
      : `${isUser ? "bg-cale-userBubble" : "bg-cale-card no-glass"} px-[15px] py-[10px] text-[15px]`;

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && message.thinking && (
        <div className={claude ? "w-full" : "max-w-[70%]"}>
          <ThinkingBlock thinking={message.thinking} streaming={streaming} />
        </div>
      )}

      <div
        className={`flex items-center gap-2.5 ${
          isUser ? "flex-row-reverse" : ""
        } ${
          claude ? (isUser ? "max-w-[85%]" : "w-full") : "max-w-[75%]"
        }`}
      >
        <div
          className={`relative min-w-0 ${claude && !isUser ? "flex-1" : ""}`}
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
              style={{
                background: "rgb(var(--cale-textDark) / 0.06)",
                maxWidth: "100%",
              }}
            >
              <span className="font-medium">{message.quote.author}</span>：
              {message.quote.text.slice(0, 40)}
            </div>
          )}

          <div
            className={`relative select-text text-cale-textDark ${bubbleClass}`}
            style={
              claude || isPayload
                ? undefined
                : {
                    borderRadius: 18,
                    borderBottomRightRadius: isUser ? 4 : 18,
                    borderBottomLeftRadius: isUser ? 18 : 4,
                    boxShadow: "none",
                    border: isUser
                      ? "1px solid rgb(var(--cale-userBubble))"
                      : "1px solid rgb(var(--cale-divider))",
                  }
            }
          >
          {/* Transfer / gift card */}
          {message.payload && (
            <PayloadCard payload={message.payload} isUser={isUser} />
          )}
          {!isPayload && message.images && message.images.length > 0 && (
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

          {/* Heart burst on double-tap like */}
          {burst && (
            <div className="absolute left-1/2 top-1/2 pointer-events-none heart-burst z-10">
              <Heart
                size={40}
                className="text-cale-accent"
                fill="rgb(var(--cale-accent))"
              />
            </div>
          )}
          </div>
        </div>

        {/* Like heart button beside the message (hidden in Claude layout) */}
        {!claude && (
          <button
            onClick={() => onLike(message)}
            className="flex-shrink-0 p-1 active:opacity-60"
            aria-label="点赞"
          >
            <span
              key={message.liked ? "on" : "off"}
              className={`inline-flex ${message.liked ? "heart-pop" : ""}`}
            >
              <Heart
                size={16}
                strokeWidth={1.8}
                style={{ color: message.liked ? "#e88b7a" : "#d4b5ab" }}
                fill={message.liked ? "#e88b7a" : "none"}
              />
            </span>
          </button>
        )}
      </div>

      {/* Cale reply action row */}
      {!isUser && !isPayload && !streaming && message.content && (
        claude ? (
          // Claude-style icon action row
          <div className="flex items-center gap-4 mt-1.5 ml-0.5 text-cale-textLight">
            <button onClick={copy} className="active:opacity-60" aria-label="复制">
              <Copy size={15} strokeWidth={1.7} />
            </button>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(message)}
                className="active:opacity-60"
                aria-label="重新回复"
              >
                <RotateCcw size={15} strokeWidth={1.7} />
              </button>
            )}
            <button
              onClick={() => onLike(message)}
              className="active:opacity-60"
              aria-label="点赞"
            >
              <Heart
                size={15}
                strokeWidth={1.7}
                className={message.liked ? "text-cale-accent" : ""}
                fill={message.liked ? "rgb(var(--cale-accent))" : "none"}
              />
            </button>
            <button
              onClick={() => onAction(message)}
              className="active:opacity-60"
              aria-label="更多"
            >
              <MoreHorizontal size={16} strokeWidth={1.7} />
            </button>
          </div>
        ) : (
          onRegenerate && (
            <button
              onClick={() => onRegenerate(message)}
              className="mt-1 ml-1 flex items-center gap-1 text-[12px] text-cale-textLight active:opacity-60"
            >
              <RotateCcw size={12} strokeWidth={1.8} />
              重新回复
            </button>
          )
        )
      )}
    </div>
  );
}
