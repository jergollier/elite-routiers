import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ClientBody = {
  type?: string;
  data?: Record<string, unknown>;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toInt(value: unknown, fallback = 0): number {
  const n = toNumber(value, fallback);
  return Math.round(n);
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase();
}

function isStartType(type: string): boolean {
  const t = normalizeType(type);
  return t === "delivery_started";
}

function isFinishType(type: string): boolean {
  const t = normalizeType(type);
  return t === "delivery_finished";
}

function getTruckName(data: Record<string, unknown>): string {
  return (
    toStringValue(data.truck) ||
    toStringValue(data.truckName) ||
    toStringValue(data.brandName) ||
    "Camion inconnu"
  );
}

function getSteamId(data: Record<string, unknown>): string {
  return (
    toStringValue(data.steamId) ||
    toStringValue(data.steamID) ||
    toStringValue(data.userSteamId)
  );
}

function getOdometerKm(data: Record<string, unknown>): number {
  return toNumber(data.odometerKm, 0);
}

function getIncome(data: Record<string, unknown>): number {
  return toInt(data.income, 0);
}

function getJobId(data: Record<string, unknown>): string | null {
  const jobId =
    toStringValue(data.jobId) ||
    toStringValue(data.jobID) ||
    toStringValue(data.deliveryId);

  if (!jobId || jobId === "TRAILER_CONNECTED") {
    return null;
  }

  return jobId;
}
function getOptionalString(data: Record<string, unknown>, key: string): string | null {
  const value = toStringValue(data[key]);
  return value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  try {
    console.log("🔥 ROUTE LIVRAISON ACTIVE 🔥");
    const body = (await request.json()) as ClientBody;

    const type = body.type ?? "unknown";
    const data = (body.data ?? {}) as Record<string, unknown>;

    await prisma.clientEvent.create({
  data: {
    type,
    payload: data as Prisma.InputJsonValue,
  },
});

    if (isStartType(type)) {
  const steamId = getSteamId(data);
  const truck = getTruckName(data);
  const startOdometerKm = getOdometerKm(data);
  const jobId = getJobId(data);
  const sourceCity = getOptionalString(data, "sourceCity");
  const destinationCity = getOptionalString(data, "destinationCity");
  const cargo = getOptionalString(data, "cargo");

      if (!steamId) {
        return NextResponse.json(
          { ok: false, error: "steamId manquant pour le début de mission" },
          { status: 400 }
        );
      }

      const activeLivraison = await prisma.livraison.findFirst({
        where: {
          steamId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (activeLivraison) {
        return NextResponse.json({
          ok: true,
          message: "Mission déjà active, aucun doublon créé",
          livraison: activeLivraison,
        });
      }

      const user = await prisma.user.findUnique({
        where: { steamId },
        include: {
          memberships: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      const entrepriseId = user?.memberships?.[0]?.entrepriseId ?? null;

      const livraison = await prisma.livraison.create({
  data: {
    jobId,
    steamId,
    entrepriseId,
    truck,
    cargo,
    sourceCity,
    destinationCity,
    status: "EN_COURS",
    startedAt: new Date(),
    startOdometerKm,
  },
});

      if (user) {
        const camionAttribue = await prisma.camion.findFirst({
          where: {
            chauffeurId: user.id,
            actif: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (camionAttribue) {
          await prisma.camion.update({
            where: { id: camionAttribue.id },
            data: {
              statut: "EN_MISSION",
              kilometrage: Math.max(
                camionAttribue.kilometrage,
                Math.floor(startOdometerKm)
              ),
            },
          });
        }
      }

      return NextResponse.json({
        ok: true,
        message: "Mission créée",
        livraison,
      });
    }

    if (isFinishType(type)) {
  const steamId = getSteamId(data);
  const endOdometerKm = getOdometerKm(data);
  const income = getIncome(data);
  const sourceCity = getOptionalString(data, "sourceCity");
  const destinationCity = getOptionalString(data, "destinationCity");
  const cargo = getOptionalString(data, "cargo");

      if (!steamId) {
        return NextResponse.json(
          { ok: false, error: "steamId manquant pour la fin de mission" },
          { status: 400 }
        );
      }

      const activeLivraison = await prisma.livraison.findFirst({
        where: {
          steamId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!activeLivraison) {
        return NextResponse.json(
          { ok: false, error: "Aucune mission active trouvée" },
          { status: 404 }
        );
      }

      const distanceReelleKm = Math.max(
        0,
        endOdometerKm - activeLivraison.startOdometerKm
      );

      const user = await prisma.user.findUnique({
        where: { steamId },
        include: {
          memberships: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      const entrepriseId =
        activeLivraison.entrepriseId ?? user?.memberships?.[0]?.entrepriseId ?? null;

      const result = await prisma.$transaction(async (tx) => {
        const livraisonMaj = await tx.livraison.update({
  where: { id: activeLivraison.id },
  data: {
    status: "TERMINEE",
    finishedAt: new Date(),
    endOdometerKm,
    distanceReelleKm,
    income,
    argentAjoute: true,
    entrepriseId,
    sourceCity: activeLivraison.sourceCity ?? sourceCity,
    destinationCity: activeLivraison.destinationCity ?? destinationCity,
    cargo: activeLivraison.cargo ?? cargo,
  },
});

        if (entrepriseId && income > 0) {
          const financeExiste = await tx.finance.findFirst({
            where: {
              entrepriseId,
              type: "LIVRAISON",
              description: `Livraison ${activeLivraison.id}`,
            },
          });

          if (!financeExiste) {
            await tx.entreprise.update({
              where: { id: entrepriseId },
              data: {
                argent: {
                  increment: income,
                },
              },
            });

            await tx.finance.create({
              data: {
                entrepriseId,
                chauffeurId: user?.id ?? null,
                type: "LIVRAISON",
                description: `Livraison ${activeLivraison.id}`,
                montant: income,
              },
            });
          }
        }

        if (user && entrepriseId) {
          await tx.chauffeurStat.upsert({
            where: {
              userId_entrepriseId: {
                userId: user.id,
                entrepriseId,
              },
            },
            update: {
              argentGagne: {
                increment: income,
              },
              kilometres: {
                increment: Math.round(distanceReelleKm),
              },
              livraisons: {
                increment: 1,
              },
            },
            create: {
              userId: user.id,
              entrepriseId,
              argentGagne: income,
              kilometres: Math.round(distanceReelleKm),
              infractions: 0,
              accidents: 0,
              livraisons: 1,
            },
          });

          const camionAttribue = await tx.camion.findFirst({
            where: {
              chauffeurId: user.id,
              actif: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (camionAttribue) {
            await tx.camion.update({
              where: { id: camionAttribue.id },
              data: {
                statut: "DISPONIBLE",
                kilometrage: Math.max(
                  camionAttribue.kilometrage,
                  Math.floor(endOdometerKm)
                ),
              },
            });
          }
        }

        return livraisonMaj;
      });

      return NextResponse.json({
        ok: true,
        message: "Mission terminée",
        livraison: result,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Événement reçu mais non traité par le système livraison",
    });
  } catch (error) {
    console.error("Erreur client-event:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erreur serveur sur le système livraison",
      },
      { status: 500 }
    );
  }
}