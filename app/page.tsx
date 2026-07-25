"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppContext";
import TabBar, { Tab } from "@/components/TabBar";
import ChatView from "@/components/chat/ChatView";
import TheaterView from "@/components/theater/TheaterView";
import PetView from "@/components/pet/PetView";
import DiaryView from "@/components/diary/DiaryView";
import CalendarView from "@/components/calendar/CalendarView";
import SettingsView from "@/components/settings/SettingsView";
import StickerManager from "@/components/stickers/StickerManager";
import WelcomeView from "@/components/WelcomeView";
import { randomQuote } from "@/lib/quotes";

export default function Home() {
  const { hydrated, apiConfig } = useApp();
  const [tab, setTab] = useState<Tab>("chat");
  const [guided, setGuided] = useState(false);
  const [entered, setEntered] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [theaterOpen, setTheaterOpen] = useState(false);
  const [splash, setSplash] = useState(true);
  const [quote] = useState(randomQuote);

  // Brief loading splash with a random Cale line, fades out after ~2.2s.
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2400);
    return () => clearTimeout(t);
  }, []);

  // Late-night ambience: after 23:00 (before 6:00) soften into a warm milk-tea
  // palette by tagging the root; CSS handles the rest.
  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours();
      const night = h >= 23 || h < 6;
      if (night) document.documentElement.dataset.night = "1";
      else delete document.documentElement.dataset.night;
    };
    apply();
    const id = setInterval(apply, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // First launch with no API config → guide user to settings
  useEffect(() => {
    if (hydrated && entered && !guided && apiConfig.provider === "proxy" && !apiConfig.baseURL) {
      setTab("settings");
      setGuided(true);
    }
  }, [hydrated, entered, apiConfig.baseURL, guided]);

  // Welcome page shows on every app open, until the user taps Enter this session
  const showWelcome = hydrated && !entered;

  const splashOverlay = splash ? (
    <div className="fixed inset-0 z-[100] welcome-bg flex items-center justify-center cale-splash pointer-events-none">
      <p
        className="text-cale-textLight text-[15px] tracking-wide"
        style={{ fontFamily: 'ui-serif, "Songti SC", "Noto Serif SC", serif' }}
      >
        {quote}
      </p>
    </div>
  ) : null;

  if (!hydrated) {
    return (
      <>
        {splashOverlay}
        <div className="h-[100dvh] flex items-center justify-center text-cale-textLight">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-cale-primary/30 mx-auto mb-3" />
            <div>Cale 正在醒来…</div>
          </div>
        </div>
      </>
    );
  }

  if (showWelcome) {
    return (
      <>
        {splashOverlay}
        <WelcomeView onEnter={() => setEntered(true)} />
      </>
    );
  }

  return (
    <>
    {splashOverlay}
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-cale-bg">
      <div className="flex-1 min-h-0 relative">
        <div className={tab === "chat" ? "h-full" : "hidden"}>
          <ChatView
            onManageStickers={() => setStickerOpen(true)}
            onOpenTheater={() => setTheaterOpen(true)}
          />
        </div>
        <div className={tab === "pet" ? "h-full" : "hidden"}>
          <PetView />
        </div>
        {tab === "diary" && <DiaryView />}
        {tab === "calendar" && <CalendarView />}
        {tab === "settings" && (
          <SettingsView
            goToChat={() => setTab("chat")}
            onManageStickers={() => setStickerOpen(true)}
          />
        )}
      </div>
      <TabBar active={tab} onChange={setTab} />

      {stickerOpen && (
        <div className="absolute inset-0 z-50 app-bg">
          <StickerManager onBack={() => setStickerOpen(false)} />
        </div>
      )}

      {theaterOpen && (
        <div className="absolute inset-0 z-50 app-bg">
          <TheaterView onClose={() => setTheaterOpen(false)} />
        </div>
      )}
    </div>
    </>
  );
}
