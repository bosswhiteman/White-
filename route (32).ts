import { NextResponse } from "next/server";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ settings: await getSettings() });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Paramètres indisponibles." }, { status: 500 });
  }
}
