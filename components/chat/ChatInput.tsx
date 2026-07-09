"use client";

import { useRef, useState } from "react";
import { ChatImage } from "@/lib/types";

const MAX_LINES = 4;
const LINE_HEIGHT = 22;

export default function ChatInput({
  onSend,
  onStop,
  streaming,
  disabled,
}: {
  onSend: (text: string, images: ChatImage[]) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<ChatImage[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = LINE_HEIGHT * MAX_LINES + 20;
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { dataUrl: reader.result as string, mediaType: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const send = () => {
    if (streaming) return;
    if (!text.trim() && images.length === 0) return;
    onSend(text.trim(), images);
    setText("");
    setImages([]);
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  };

  return (
    <div
      className="flex-shrink-0 bg-cale-card border-t border-cale-divider px-3 pt-2 pb-2"
    >
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt="preview"
                className="w-14 h-14 rounded-lg object-cover"
              />
              <button
                onClick={() =>
                  setImages((prev) => prev.filter((_, j) => j !== i))
                }
                className="absolute -top-1.5 -right-1.5 bg-cale-accent text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-cale-input text-cale-textLight flex items-center justify-center text-lg active:opacity-70"
          aria-label="添加图片"
        >
          ＋
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex-1 bg-cale-input rounded-[22px] px-4 py-2">
          <textarea
            ref={taRef}
            value={text}
            rows={1}
            placeholder="和 Cale 说点什么…"
            disabled={disabled}
            onChange={(e) => {
              setText(e.target.value);
              resize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            className="w-full bg-transparent outline-none resize-none text-[16px] leading-[22px] max-h-[108px] no-scrollbar placeholder:text-cale-textLight"
          />
        </div>
        {streaming ? (
          <button
            onClick={onStop}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-cale-accent text-white flex items-center justify-center active:opacity-80"
            aria-label="停止"
          >
            <span className="block w-3 h-3 bg-white rounded-[2px]" />
          </button>
        ) : (
          <button
            onClick={send}
            disabled={!text.trim() && images.length === 0}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
            style={{ background: "#D4849F", color: "#fff" }}
            aria-label="发送"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19V5M12 5l-6 6M12 5l6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
