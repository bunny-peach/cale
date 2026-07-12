"use client";

import { ArrowRight, Wallet, Gift } from "lucide-react";
import { useApp } from "@/components/AppContext";
import SubPageHeader from "./SubPageHeader";

export default function WalletManager({ onBack }: { onBack: () => void }) {
  const { wallet, setWallet, transactions } = useApp();

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader title="钱包" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-5">
        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <BalanceCard
            label="你的钱包"
            value={wallet.quinn}
            onChange={(v) => setWallet({ ...wallet, quinn: v })}
          />
          <BalanceCard
            label="Cale 的钱包"
            value={wallet.cale}
            onChange={(v) => setWallet({ ...wallet, cale: v })}
          />
        </div>
        <p className="text-[12px] text-cale-textLight px-1">
          可直接修改余额作为初始值。转账、送礼会自动增减。
        </p>

        {/* Transactions */}
        <div>
          <div className="text-[12px] text-cale-textLight px-1 mb-1.5">
            交易记录
          </div>
          <div className="bg-cale-card rounded-[14px] overflow-hidden divide-y divide-cale-divider">
            {transactions.length === 0 && (
              <div className="text-center text-cale-textLight text-[14px] py-8">
                还没有交易记录
              </div>
            )}
            {transactions.map((t) => {
              const mine = t.from === "quinn";
              return (
                <div key={t.id} className="flex items-center px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-cale-input flex items-center justify-center text-cale-accent mr-3">
                    {t.kind === "transfer" ? (
                      <Wallet size={18} />
                    ) : (
                      <Gift size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-cale-textDark flex items-center gap-1">
                      {mine ? "你" : "Cale"}
                      <ArrowRight size={12} className="text-cale-textLight" />
                      {t.to === "quinn" ? "你" : "Cale"}
                      <span className="text-cale-textLight">
                        {t.kind === "transfer"
                          ? "转账"
                          : `送「${t.giftName}」`}
                      </span>
                    </div>
                    <div className="text-[12px] text-cale-textLight">
                      {new Date(t.createdAt).toLocaleString("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    className={`text-[15px] font-medium ${
                      mine ? "text-cale-textDark" : "text-cale-accent"
                    }`}
                  >
                    {mine ? "-" : "+"}¥{t.amount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-cale-card rounded-[14px] px-4 py-3.5">
      <div className="text-[12px] text-cale-textLight mb-1">{label}</div>
      <div className="flex items-center">
        <span className="text-[20px] font-semibold text-cale-textDark mr-0.5">
          ¥
        </span>
        <input
          inputMode="numeric"
          value={String(value)}
          onChange={(e) =>
            onChange(Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, "")) || 0)))
          }
          className="w-full text-[20px] font-semibold bg-transparent outline-none text-cale-textDark"
        />
      </div>
    </div>
  );
}
