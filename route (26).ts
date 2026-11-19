import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const contact = String(body.contact ?? body.email ?? "").trim();

    if (contact.length < 6 || contact.length > 100) {
      return NextResponse.json(
        { error: "Veuillez saisir un numéro WhatsApp ou une adresse e-mail valide." },
        { status: 400 }
      );
    }

    await db
      .insert(newsletterSubscribers)
      .values({ contact })
      .onConflictDoNothing({ target: newsletterSubscribers.contact });

    return NextResponse.json({
      message:
        "Inscription enregistrée ! Vous recevrez nos prochains arrivages et baisses de prix en priorité.",
    });
  } catch (error) {
    console.error("POST /api/newsletter error:", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer votre contact pour le moment." },
      { status: 500 }
    );
  }
}
