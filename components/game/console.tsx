"use client"

import { cn } from "@/lib/utils"
import { GameProvider } from "@/lib/game/store"
import { Boxes, Flag, LayoutDashboard, Radar, Rocket, Warehouse, UserRound, Swords } from "lucide-react"
import { useState } from "react"
import { BasePanel } from "./base-panel"
import { BattleModal } from "./battle-modal"
import { CombatArena } from "./combat-arena"
import { Dashboard } from "./dashboard"
import { EquipmentPanel } from "./equipment-panel"
import { FleetPanel } from "./fleet-panel"
import { HudBar } from "./hud-bar"
import { MapPanel } from "./map-panel"
import { WarRoom } from "./war-room"
import { PilotPanel } from "./pilot-panel"

type Tab = "combat" | "dashboard" | "pilot" | "fleet" | "equipment" | "base" | "map" | "war"

const NAV: { id: Tab; label: string; icon: typeof Radar; badge?: string }[] = [
  { id: "combat", label: "STARFRONT (P1-3)", icon: Swords, badge: "Chiến dịch" },
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "pilot", label: "Nhân vật", icon: UserRound },
  { id: "fleet", label: "Hạm đội", icon: Rocket },
  { id: "equipment", label: "Trang bị", icon: Boxes },
  { id: "base", label: "Căn cứ", icon: Warehouse },
  { id: "map", label: "Infinity", icon: Radar },
  { id: "war", label: "Chiến sự", icon: Flag },
]

export function GameConsole() {
  return (
    <GameProvider>
      <div className="min-h-screen">
        <HudBar />
        <ConsoleBody />
        <BattleModal />
      </div>
    </GameProvider>
  )
}

function ConsoleBody() {
  const [tab, setTab] = useState<Tab>("combat")

  return (
    <div className="mx-auto flex max-w-[1600px] gap-0">
      {/* Nav rail */}
      <nav className="sticky top-[57px] z-20 flex h-[calc(100vh-57px)] w-16 shrink-0 flex-col gap-1 border-r border-border/70 bg-panel/50 p-2 md:w-48">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "group relative flex items-center justify-between rounded-sm px-3 py-2.5 text-left transition-colors",
                active
                  ? "bg-primary/15 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0" />
                <span className="hidden font-display text-xs font-600 tracking-wider uppercase md:inline">
                  {item.label}
                </span>
              </div>
              {item.badge && (
                <span className="hidden rounded bg-cyan-500/20 px-1 py-0.2 font-mono text-[9px] font-bold text-cyan-300 md:inline">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
        <div className="mt-auto hidden px-3 py-2 md:block">
          <p className="text-[9px] leading-relaxed text-muted-foreground/70">
            STARFRONT Phase 3: Bản đồ chiến dịch 3 Sector, 3 lớp Cơ Giáp (Vanguard, Falcon, Aegis), Chợ quân sự và Hiệu ứng âm thanh Sci-Fi.
          </p>
        </div>
      </nav>

      {/* Content */}
      <main className="min-w-0 flex-1 p-3 md:p-5">
        {tab === "combat" && <CombatArena />}
        {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
        {tab === "pilot" && <PilotPanel />}
        {tab === "fleet" && <FleetPanel />}
        {tab === "equipment" && <EquipmentPanel />}
        {tab === "base" && <BasePanel />}
        {tab === "map" && <MapPanel />}
        {tab === "war" && <WarRoom />}
      </main>
    </div>
  )
}

export type { Tab }
