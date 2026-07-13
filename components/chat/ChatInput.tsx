"use client";

import { useRef, useState } from "react";
import {
  Plus,
  Send,
  Square,
  Image as ImageIcon,
  Smile,
  X,
  Wallet,
  Gift,
  Drama,
} from "lucide-react";
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
  onTransfer,
  onGift,
  onTheater,
}: {
  onSubmit: (text: string, images: ChatImage[]) => void;
  onSendSticker: (s: Sticker) => void;
  onStop: () => void;
  streaming: boolean;
  burstMode: boolean;
  onToggleBurst: () => void;
  stickers: Sticker[];
  onManageStickers: () => void;
  onTransfer: () => void;
  onGift: () => void;
  onTheater: () => void;
}) {
  const { settings, wallet } = useApp();
  const claude = settings.theme === "claude";
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

  const plusBtn = (
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
  );

  const burstBtn = (
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
  );

  const sendBtn = streaming ? (
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
  );

  return (
    <div className="px-3 pt-2 pb-2">
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
        <div className="mb-2 px-1">
          <div className="flex items-center justify-center gap-3 mb-2 text-[12px] text-cale-textLight">
            <span>
              你 <span className="text-cale-accent font-medium">¥{wallet.quinn}</span>
            </span>
            <span className="opacity-50">·</span>
            <span>
              Cale{" "}
              <span className="text-cale-accent font-medium">¥{wallet.cale}</span>
            </span>
          </div>
          <div className="flex gap-3">
            <MenuItem
              icon={<ImageIcon size={22} strokeWidth={1.8} />}
              label="照片"
              onClick={() => fileRef.current?.click()}
            />
            <MenuItem
              icon={<Smile size={22} strokeWidth={1.8} />}
              label="表情包"
              onClick={() => {
                setTrayOpen((t) => !t);
                setMenuOpen(false);
              }}
            />
            <MenuItem
              icon={<Wallet size={22} strokeWidth={1.8} />}
              label="转账"
              onClick={() => {
                setMenuOpen(false);
                onTransfer();
              }}
            />
            <MenuItem
              icon={<Gift size={22} strokeWidth={1.8} />}
              label="礼物"
              onClick={() => {
                setMenuOpen(false);
                onGift();
              }}
            />
            <MenuItem
              icon={<Drama size={22} strokeWidth={1.8} />}
              label="小剧场"
              onClick={() => {
                setMenuOpen(false);
                onTheater();
              }}
            />
          </div>
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

      {claude ? (
        /* Claude-style composer: a tall rounded box with the controls inside */
        <div className="bg-cale-card border border-cale-divider rounded-[24px] px-3.5 pt-3 pb-2 shadow-sm">
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
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="w-full bg-transparent outline-none resize-none text-[16px] leading-[22px] max-h-[140px] no-scrollbar placeholder:text-cale-textLight mb-1"
          />
          <div className="flex items-center gap-2">
            {plusBtn}
            {burstBtn}
            <div className="flex-1" />
            {sendBtn}
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {plusBtn}
          {burstBtn}
          <div className="flex-1 bg-cale-input rounded-[22px] px-4 py-2">
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
          {sendBtn}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:opacity-70"
    >
      <span className="w-12 h-12 rounded-[14px] bg-cale-input flex items-center justify-center text-cale-accent">
        {icon}
      </span>
      <span className="text-[11px] text-cale-textLight">{label}</span>
    </button>
  );
}
