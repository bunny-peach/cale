"use client";

import { Music, BookOpen, X } from "lucide-react";
import { useApp } from "@/components/AppContext";
import SubPageHeader from "./SubPageHeader";

export default function RecommendManager({ onBack }: { onBack: () => void }) {
  const { playlist, setPlaylist, bookshelf, setBookshelf } = useApp();

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader title="Cale 的推荐" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        <Section
          title="我们的歌单"
          Icon={Music}
          items={playlist}
          empty="Cale 推荐的歌会出现在这里"
          onDelete={(i) =>
            setPlaylist((prev) => prev.filter((_, j) => j !== i))
          }
        />
        <Section
          title="我们的书架"
          Icon={BookOpen}
          items={bookshelf}
          empty="Cale 推荐的书会出现在这里"
          onDelete={(i) =>
            setBookshelf((prev) => prev.filter((_, j) => j !== i))
          }
        />
        <p className="text-[12px] text-cale-textLight px-1">
          聊天时 Cale 用 [SONG_ADD: …] / [BOOK_ADD: …] 标记就能自动添加。
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  Icon,
  items,
  empty,
  onDelete,
}: {
  title: string;
  Icon: typeof Music;
  items: string[];
  empty: string;
  onDelete: (i: number) => void;
}) {
  return (
    <div className="bg-white rounded-[14px] p-3">
      <div className="text-[15px] font-semibold mb-2 flex items-center gap-1.5">
        <Icon size={17} strokeWidth={1.8} className="text-cale-accent" />
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-[13px] text-cale-textLight py-2">{empty}</div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 bg-cale-input rounded-[12px] px-3 py-2"
            >
              <span className="text-[14px] text-cale-textDark break-words min-w-0">
                {item}
              </span>
              <button
                onClick={() => onDelete(i)}
                className="text-cale-textLight active:opacity-60 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
