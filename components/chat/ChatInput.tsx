"use client";

import { useRef, useState } from "react";
import { Plus, Send, Square, Image as ImageIcon, Smile, X } from "lucide-react";
import { ChatImage, Sticker } from "@/lib/types";
import { useApp } from "@/components/AppContext";

const MAX_LINES = 4;
const LINE_HEIGHT = 22;

export default function ChatInput({
  onSubmit,
  onSendSticker,
  onStop,
  streaming,
  burstMode,
  onToggleBurst,
  stickers,
  onManageStickers,
}: {
  onSubmit: (text: string, images: ChatImage[]) => void;
  onSendSticker: (s: Sticker) => void;
  onStop: () => void;
  streaming: boolean;
  burstMode: boolean;
  onToggleBurst: () => void;
  stickers: Sticker[];
  onManageStickers: () => void;
}) {
  const claude = useApp().settings.theme === "claude";
  const [text, setText] = useState("");
  const [images, setImages] = useState<ChatImage[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
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
      reader.onload = () =>
        setImages((prev) => [
          ...prev,
          { dataUrl: reader.result as string, mediaType: file.type },
        ]);
      reader.readAsDataURL(file);
    });
    setMenuOpen(false);
  };

  const submit = () => {
    if (streaming) return;
    if (!text.trim() && images.length === 0) return;
    onSubmit(text.trim(), images);
    setText("");
    setImages([]);
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  };

  return (
    <div className="flex-shrink-0 bg-cale-card border-t border-cale-divider px-3 pt-2 pb-2">
      {/* Sticker tray */}
      {trayOpen && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-1">
          <button
            onClick={onManageStickers}
            className="flex-shrink-0 w-16 h-16 rounded-[14px] border border-dashed border-cale-divider flex flex-col items-center justify-center text-cale-textLight active:opacity-70"
          >
            <Plus size={18} />
            <span className="text-[10px] mt-0.5">管理</span>
          </button>
          {stickers.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSendSticker(s);
                setTrayOpen(false);
              }}
              className="flex-shrink-0 w-16 h-16 rounded-[14px] overflow-hidden active:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.dataUrl}
                alt={s.prompt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {stickers.length === 0 && (
            <div className="flex items-center text-[13px] text-cale-textLight px-2">
              还没有表情包，点「管理」添加
            </div>
          )}
        </div>
      )}

      {/* "+" action menu */}
      {menuOpen && (
        <div className="flex gap-3 mb-2 px-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-1 active:opacity-70"
          >
            <span className="w-12 h-12 rounded-[14px] bg-cale-input flex items-center justify-center text-cale-accent">
              <ImageIcon size={22} strokeWidth={1.8} />
            </span>
            <span className="text-[11px] text-cale-textLight">照片</span>
          </button>
          <button
            onClick={() => {
              setTrayOpen((t) => !t);
              setMenuOpen(false);
            }}
            className="flex flex-col items-center gap-1 active:opacity-70"
          >
            <span className="w-12 h-12 rounded-[14px] bg-cale-input flex items-center justify-center text-cale-accent">
              <Smile size={22} strokeWidth={1.8} />
            </span>
            <span className="text-[11px] text-cale-textLight">表情包</span>
          </button>
        </div>
      )}

      {/* Image previews */}
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
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 bg-cale-accent text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-end gap-2">
        <button
          onClick={() => {
            setMenuOpen((m) => !m);
            setTrayOpen(false);
          }}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-cale-input text-cale-textLight flex items-center justify-center active:opacity-70"
          aria-label="更多"
        >
          <Plus
            size={20}
            style={{
              transform: menuOpen ? "rotate(45deg)" : "none",
              transition: "transform 0.15s",
            }}
          />
        </button>

        {/* Mode toggle */}
        <button
          onClick={onToggleBurst}
          className={`flex-shrink-0 h-9 px-2.5 rounded-full text-[12px] active:opacity-70 ${
            burstMode
              ? "bg-cale-accent text-white"
              : "bg-cale-input text-cale-textLight"
          }`}
          title="连发模式：连续发多条后再让 Cale 回复"
        >
          {burstMode ? "连发" : "单条"}
        </button>

        <div
          className={`flex-1 px-4 py-2 ${
            claude
              ? "bg-cale-card border border-cale-divider rounded-[20px]"
              : "bg-cale-input rounded-[22px]"
          }`}
        >
          <textarea
            ref={taRef}
            value={text}
            rows={1}
            placeholder="和 Cale 说点什么…"
            onChange={(e) => {
              setText(e.target.value);
              resize();
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                submit();
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
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim() && images.length === 0}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40 bg-cale-accent text-white"
            aria-label="发送"
          >
            <Send size={17} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
