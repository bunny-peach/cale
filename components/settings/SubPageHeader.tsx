"use client";

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
      className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <button
        onClick={onBack}
        className="text-cale-accent text-[15px] active:opacity-70 min-w-[56px] text-left"
      >
        ‹ 返回
      </button>
      <div className="flex-1 text-center text-[17px] font-semibold truncate">
        {title}
      </div>
      <div className="min-w-[56px] text-right">{right}</div>
    </header>
  );
}
