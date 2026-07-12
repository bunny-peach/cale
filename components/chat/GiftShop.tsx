"use client";

import {
  X,
  Gift as GiftIcon,
  Flower2,
  CupSoda,
  Cherry,
  Rabbit,
  Heart,
  Cake,
  Star,
  Crown,
} from "lucide-react";
import { GIFTS, Gift } from "@/lib/gifts";

const ICONS: Record<string, typeof Heart> = {
  Flower2,
  CupSoda,
  Cherry,
  Rabbit,
  Heart,
  Cake,
  Star,
  Crown,
};

export default function GiftShop({
  balance,
  onClose,
  onConfirm,
}: {
  balance: number;
  onClose: () => void;
  onConfirm: (gift: Gift) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full bg-cale-card rounded-t-2xl p-5"
        style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[17px] font-semibold text-cale-textDark flex items-center gap-1.5">
            <GiftIcon size={18} className="text-cale-accent" /> 礼物商店
          </span>
          <button onClick={onClose} className="text-cale-textLight">
            <X size={20} />
          </button>
        </div>
        <div className="text-[12px] text-cale-textLight mb-4">
          你的余额 ¥{balance}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {GIFTS.map((g) => {
            const Icon = ICONS[g.icon] || GiftIcon;
            const afford = balance >= g.price;
            return (
              <button
                key={g.name}
                disabled={!afford}
                onClick={() => onConfirm(g)}
                className="flex flex-col items-center gap-1 py-3 rounded-[14px] bg-cale-input active:opacity-70 disabled:opacity-40"
              >
                <Icon size={26} strokeWidth={1.7} className="text-cale-accent" />
                <span className="text-[12px] text-cale-textDark">{g.name}</span>
                <span className="text-[11px] text-cale-textLight">
                  ¥{g.price}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
