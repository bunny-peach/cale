"use client";

import {
  Send,
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
import { MessagePayload } from "@/lib/types";
import { GIFTS } from "@/lib/gifts";

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

export default function PayloadCard({
  payload,
  isUser,
}: {
  payload: MessagePayload;
  isUser: boolean;
}) {
  if (payload.kind === "transfer") {
    return (
      <div
        className="rounded-[16px] px-4 py-3 min-w-[150px] cale-pop"
        style={{
          background: "linear-gradient(135deg,#F6B98A,#E8916B)",
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Send size={22} strokeWidth={1.8} />
          <div>
            <div className="text-[18px] font-semibold leading-tight">
              ¥{payload.amount}
            </div>
            <div className="text-[12px] opacity-90 leading-tight mt-0.5">
              转账{isUser ? "给 Cale" : "给你"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gift = GIFTS.find((g) => g.name === payload.giftName);
  const Icon = (gift && ICONS[gift.icon]) || GiftIcon;
  return (
    <div
      className="rounded-[16px] px-4 py-3 min-w-[140px] cale-pop"
      style={{
        background: "linear-gradient(135deg,#F3A6C0,#E884A6)",
        color: "#fff",
      }}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={26} strokeWidth={1.8} />
        <div>
          <div className="text-[15px] font-semibold leading-tight">
            {payload.giftName}
          </div>
          <div className="text-[12px] opacity-90 leading-tight mt-0.5">
            {isUser ? "送给 Cale" : "送给你"}
          </div>
        </div>
      </div>
    </div>
  );
}
