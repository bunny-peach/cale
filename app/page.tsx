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

export default function Home() {
  const { hydrated, apiConfig } = useApp();
  const [tab, setTab] = useState<Tab>("chat");
  const [guided, setGuided] = useState(false);
  const [entered, setEntered] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [theaterOpen, setTheaterOpen] = useState(false);

  // First launch with no API config → guide user to settings
  useEffect(() => {
    if (hydrated && entered && !guided && apiConfig.provider === "proxy" && !apiConfig.baseURL) {
      setTab("settings");
      setGuided(true);
    }
  }, [hydrated, entered, apiConfig.baseURL, guided]);

  // Welcome page shows on every app open, until the user taps Enter this session
  const showWelcome = hydrated && !entered;

  if (!hydrated) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-cale-textLight">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-cale-primary/30 mx-auto mb-3" />
          <div>Cale 正在醒来…</div>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return <WelcomeView onEnter={() => setEntered(true)} />;
  }

  return (
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
  );
}
