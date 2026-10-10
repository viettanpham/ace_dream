"use client"

import { StarfrontShell } from "./starfront-shell"

export function GameConsole() {
  return <StarfrontShell />
}

export type Tab = "combat" | "dashboard" | "pilot" | "fleet" | "equipment" | "base" | "map" | "war"
