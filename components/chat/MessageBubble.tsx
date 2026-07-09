"use client";

import { useRef } from "react";
import { Message } from "@/lib/types";
import Markdown from "@/components/Markdown";
import ThinkingBlock from "./ThinkingBlock";

export default function MessageBubble({
  message,
  streaming,
  onAction,
}: {
  message: Message;
  streaming?: boolean;
  onAction: (m: Message) => void;
}) {
  const isUser = message.role === "user";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    timer.current = setTimeout(() => onAction(message), 500);
  };
  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
      onContextMenu={(e) => {
        e.preventDefault();
        onAction(message);
      }}
    >
      {!isUser && message.thinking && (
        <div className="max-w-[85%]">
          <ThinkingBlock thinking={message.thinking} streaming={streaming} />
        </div>
      )}
      <div
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        className={`max-w-[85%] px-3.5 py-2.5 text-[15px] select-text ${
          isUser ? "text-cale-textDark" : "bg-cale-card text-cale-textDark"
        }`}
        style={{
          borderRadius: 18,
          background: isUser ? "#F5E0EA" : "#FFFFFF",
          boxShadow: isUser ? "none" : "0 1px 2px rgba(45,45,45,0.05)",
        }}
      >
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
    </div>
  );
}
