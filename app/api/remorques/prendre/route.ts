import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const formData = await req.formData();
    const remorqueId = Number(formData.get("remorqueId"));

    if (!remorqueId) {
      return NextResponse.redirect(new URL("/remorques", req.url));
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Vérifie si il a déjà une remorque
    const dejaUne = await prisma.remorque.findFirst({
      where: {
        chauffeurAttribueId: user.id,
      },
    });

    if (dejaUne) {
      return NextResponse.redirect(new URL("/remorques", req.url));
    }

    // Vérifie dispo
    const remorque = await prisma.remorque.findUnique({
      where: { id: remorqueId },
    });

    if (!remorque || remorque.statut !== "DISPONIBLE") {
      return NextResponse.redirect(new URL("/remorques", req.url));
    }

    await prisma.remorque.update({
      where: { id: remorqueId },
      data: {
        chauffeurAttribueId: user.id,
        statut: "ATTRIBUEE",
      },
    });

    return NextResponse.redirect(new URL("/remorques", req.url));
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL("/remorques", req.url));
  }
}