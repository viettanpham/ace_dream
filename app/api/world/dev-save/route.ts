import { NextRequest, NextResponse } from "next/server"
import {
  loadWorldStateFromDevFile,
  saveWorldStateToDevFile,
} from "@/lib/game/world/base/auto-save"
import { validateWorldStateStructure } from "@/lib/game/world/storage"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const state = body?.state
    if (!state || !validateWorldStateStructure(state)) {
      return NextResponse.json(
        { success: false, error: "Invalid WorldState payload" },
        { status: 400 }
      )
    }

    const result = saveWorldStateToDevFile(state)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = loadWorldStateFromDevFile()
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
