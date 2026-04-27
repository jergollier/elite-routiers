import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.0.5",
    url: "https://evsucubtev4fgabq.public.blob.vercel-storage.com/Elite%20Routier%20Tacky%20Setup%201.0.5.exe",
    notes: "Mise à jour Tacky 1.0.5",
  });
}