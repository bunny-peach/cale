"use client";

import { ChevronLeft } from "lucide-react";

export default function SubPageHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header
      className="flex-shrink-0 bg-white border-b border-cale-divider flex items-center px-3 h-12"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <button
        onClick={onBack}
        className="text-cale-accent active:opacity-70 min-w-[56px] flex items-center"
      >
        <ChevronLeft size={22} />
      </button>
      <div className="flex-1 text-center text-[17px] font-semibold truncate">
        {title}
      </div>
      <div className="min-w-[56px] text-right">{right}</div>
    </header>
  );
}
