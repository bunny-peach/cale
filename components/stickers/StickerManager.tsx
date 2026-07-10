"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { uid } from "@/lib/storage";
import { Sticker } from "@/lib/types";
import SubPageHeader from "@/components/settings/SubPageHeader";

export default function StickerManager({ onBack }: { onBack: () => void }) {
  const { stickers, setStickers } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const s: Sticker = {
          id: uid(),
          dataUrl: reader.result as string,
          mediaType: file.type,
          prompt: "",
          createdAt: Date.now(),
        };
        setStickers((prev) => [...prev, s]);
        setEditing(s.id);
        setDraft("");
      };
      reader.readAsDataURL(file);
    });
  };

  const savePrompt = (id: string) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, prompt: draft.trim() } : s))
    );
    setEditing(null);
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader
        title="表情包"
        onBack={onBack}
        right={
          <button
            onClick={() => fileRef.current?.click()}
            className="text-cale-accent active:opacity-70"
          >
            <Plus size={22} />
          </button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        <p className="text-[12px] text-cale-textLight px-1">
          从相册导入图片作为表情包，给每个表情写一句含义描述，Cale 就能读懂你发的表情。
        </p>
        {stickers.length === 0 && (
          <div className="text-center text-cale-textLight text-[13px] mt-10">
            点右上角的加号添加表情包
          </div>
        )}
        {stickers.map((s) => (
          <div
            key={s.id}
            className="bg-cale-card rounded-[14px] p-3 flex gap-3 items-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.dataUrl}
              alt={s.prompt}
              className="w-16 h-16 rounded-[12px] object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              {editing === s.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="这个表情的含义，比如：一只生气的兔子"
                    autoFocus
                    className="w-full bg-cale-input rounded-[12px] px-2.5 py-2 outline-none text-[14px] resize-none min-h-[56px]"
                  />
                  <button
                    onClick={() => savePrompt(s.id)}
                    className="self-start flex items-center gap-1 text-[13px] text-cale-accent"
                  >
                    <Check size={15} /> 保存
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(s.id);
                    setDraft(s.prompt);
                  }}
                  className="text-left w-full"
                >
                  <div className="text-[14px] text-cale-textDark break-words">
                    {s.prompt || (
                      <span className="text-cale-textLight">
                        点此添加含义描述
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
            <button
              onClick={() =>
                setStickers((prev) => prev.filter((x) => x.id !== s.id))
              }
              className="text-cale-textLight active:opacity-60 flex-shrink-0"
            >
              <Trash2 size={17} strokeWidth={1.8} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
