"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function TransferSheet({
  balance,
  onClose,
  onConfirm,
}: {
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const n = Math.floor(Number(amount) || 0);
  const valid = n > 0 && n <= balance;

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
        <div className="flex items-center justify-between mb-4">
          <span className="text-[17px] font-semibold text-cale-textDark">
            转账给 Cale
          </span>
          <button onClick={onClose} className="text-cale-textLight">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1 mb-2">
          <span className="text-[28px] font-semibold text-cale-textDark">¥</span>
          <input
            autoFocus
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
            className="flex-1 text-[34px] font-semibold bg-transparent outline-none text-cale-textDark placeholder:text-cale-textLight"
          />
        </div>
        <div className="text-[12px] text-cale-textLight mb-4">
          你的余额 ¥{balance}
        </div>

        <div className="flex gap-2 mb-4">
          {[52, 66, 199, 520].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="flex-1 py-1.5 rounded-full bg-cale-input text-[13px] text-cale-textDark active:opacity-70"
            >
              {v}
            </button>
          ))}
        </div>

        <button
          disabled={!valid}
          onClick={() => onConfirm(n)}
          className="w-full py-3 rounded-[14px] bg-cale-accent text-white font-medium active:opacity-80 disabled:opacity-40"
        >
          转账
        </button>
      </div>
    </div>
  );
}
