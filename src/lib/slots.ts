import { prisma } from "@/lib/prisma";
import { weekdayInTimeZone, zonedDateTimeToUtc } from "@/lib/timezone";

function hhmmToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToHHMM(value: number): string {
  const hour = Math.floor(value / 60).toString().padStart(2, "0");
  const minute = (value % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export async function getAvailableSlots(
  companyId: string,
  professionalId: string,
  date: string
): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  const professional = await prisma.professional.findFirst({
    where: {
      id: professionalId,
      companyId,
      active: true
    },
    select: {
      id: true,
      appointmentDuration: true
    }
  });

  if (!professional) return [];

  // Piloto BR: usamos o fuso padrão diretamente para não depender
  // do tipo Company do Prisma Client que pode estar desatualizado localmente.
  const timeZone = "America/Sao_Paulo";
  const weekday = weekdayInTimeZone(date, timeZone);

  const periods = await prisma.availability.findMany({
    where: {
      professionalId,
      weekday
    },
    select: {
      startTime: true,
      endTime: true
    },
    orderBy: {
      startTime: "asc"
    }
  });

  if (periods.length === 0) return [];

  const dayStart = zonedDateTimeToUtc(date, "00:00", timeZone);
  const dayEnd = zonedDateTimeToUtc(date, "23:59", timeZone);

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        companyId,
        professionalId,
        status: { not: "CANCELLED" },
        startsAt: { gte: dayStart, lte: dayEnd }
      },
      select: { startsAt: true, endsAt: true }
    }),
    prisma.scheduleBlock.findMany({
      where: {
        companyId,
        professionalId,
        startsAt: { lte: dayEnd },
        endsAt: { gte: dayStart }
      },
      select: { startsAt: true, endsAt: true }
    })
  ]);

  const duration = professional.appointmentDuration;
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const now = new Date();
  const result = new Set<string>();

  for (const period of periods) {
    const start = hhmmToMinutes(period.startTime);
    const end = hhmmToMinutes(period.endTime);

    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) continue;

    for (let cursor = start; cursor + duration <= end; cursor += duration) {
      const hhmm = minutesToHHMM(cursor);
      const slotStart = zonedDateTimeToUtc(date, hhmm, timeZone);
      const slotEnd = new Date(slotStart.getTime() + duration * 60_000);

      if (slotStart <= now) continue;

      const busy = appointments.some(
        appointment => appointment.startsAt < slotEnd && appointment.endsAt > slotStart
      );

      const blocked = blocks.some(
        block => block.startsAt < slotEnd && block.endsAt > slotStart
      );

      if (!busy && !blocked) result.add(hhmm);
    }
  }

  return Array.from(result).sort((a, b) => a.localeCompare(b));
}
