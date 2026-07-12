"use client";

import { useState } from "react";
import { Music, BookOpen, X, Plus } from "lucide-react";
import { useApp } from "@/components/AppContext";
import SubPageHeader from "./SubPageHeader";

export default function RecommendManager({ onBack }: { onBack: () => void }) {
  const { playlist, setPlaylist, bookshelf, setBookshelf } = useApp();
  const [songDraft, setSongDraft] = useState("");
  const [bookDraft, setBookDraft] = useState("");

  const addSong = () => {
    const s = songDraft.trim();
    if (!s) return;
    setPlaylist((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setSongDraft("");
  };
  const addBook = () => {
    const t = bookDraft.trim();
    if (!t) return;
    setBookshelf((prev) =>
      prev.some((b) => b.title === t) ? prev : [...prev, { title: t }]
    );
    setBookDraft("");
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader title="Cale 的推荐" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {/* Songs */}
        <div className="bg-cale-card rounded-[14px] p-3">
          <div className="text-[15px] font-semibold mb-2 flex items-center gap-1.5">
            <Music size={17} strokeWidth={1.8} className="text-cale-accent" />
            我们的歌单
          </div>
          <div className="flex gap-2 mb-2">
            <input
              value={songDraft}
              onChange={(e) => setSongDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSong()}
              placeholder="手动加一首歌（歌名 - 歌手）"
              className="flex-1 bg-cale-input rounded-[12px] px-3 py-2 outline-none text-[14px]"
            />
            <button
              onClick={addSong}
              className="w-10 rounded-[12px] bg-cale-accent text-white flex items-center justify-center active:opacity-80"
            >
              <Plus size={18} />
            </button>
          </div>
          {playlist.length === 0 ? (
            <div className="text-[13px] text-cale-textLight py-1">
              Cale 推荐的歌会出现在这里
            </div>
          ) : (
            <div className="space-y-1.5">
              {playlist.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 bg-cale-input rounded-[12px] px-3 py-2"
                >
                  <span className="text-[14px] text-cale-textDark break-words min-w-0">
                    {item}
                  </span>
                  <button
                    onClick={() =>
                      setPlaylist((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-cale-textLight active:opacity-60 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Books */}
        <div className="bg-cale-card rounded-[14px] p-3">
          <div className="text-[15px] font-semibold mb-2 flex items-center gap-1.5">
            <BookOpen size={17} strokeWidth={1.8} className="text-cale-accent" />
            我们的书架
          </div>
          <div className="flex gap-2 mb-2">
            <input
              value={bookDraft}
              onChange={(e) => setBookDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBook()}
              placeholder="手动加一本书（书名 - 作者）"
              className="flex-1 bg-cale-input rounded-[12px] px-3 py-2 outline-none text-[14px]"
            />
            <button
              onClick={addBook}
              className="w-10 rounded-[12px] bg-cale-accent text-white flex items-center justify-center active:opacity-80"
            >
              <Plus size={18} />
            </button>
          </div>
          {bookshelf.length === 0 ? (
            <div className="text-[13px] text-cale-textLight py-1">
              Cale 推荐的书会出现在这里
            </div>
          ) : (
            <div className="space-y-1.5">
              {bookshelf.map((b, i) => (
                <div
                  key={i}
                  className="bg-cale-input rounded-[12px] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] text-cale-textDark break-words min-w-0">
                      {b.title}
                    </span>
                    <button
                      onClick={() =>
                        setBookshelf((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-cale-textLight active:opacity-60 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    value={b.progress ?? ""}
                    onChange={(e) =>
                      setBookshelf((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, progress: e.target.value } : x
                        )
                      )
                    }
                    placeholder="阅读进度（如 读到 p.120 / 60%）"
                    className="w-full bg-transparent outline-none text-[12px] text-cale-textLight mt-1 border-t border-cale-divider pt-1.5"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[12px] text-cale-textLight px-1">
          聊天时 Cale 用 [SONG_ADD: …] / [BOOK_ADD: …] 标记也能自动添加。
        </p>
      </div>
    </div>
  );
}
