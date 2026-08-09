import { prisma } from "@/lib/prisma";

function hhmmToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(value: number) {
  const h = Math.floor(value / 60).toString().padStart(2, "0");
  const m = (value % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function getAvailableSlots(
  companyId: string,
  professionalId: string,
  date: string
) {
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId, active: true },
    include: { availabilities: true }
  });
  if (!professional) return [];

  const localDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(localDate.getTime())) return [];
  const weekday = localDate.getDay();

  const availability = professional.availabilities.find(a => a.weekday === weekday);
  if (!availability) return [];

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        companyId,
        professionalId,
        status: { not: "CANCELLED" },
        startsAt: { gte: dayStart, lte: dayEnd }
      }
    }),
    prisma.scheduleBlock.findMany({
      where: {
        companyId,
        professionalId,
        startsAt: { lte: dayEnd },
        endsAt: { gte: dayStart }
      }
    })
  ]);

  const duration = professional.appointmentDuration;
  const start = hhmmToMinutes(availability.startTime);
  const end = hhmmToMinutes(availability.endTime);
  const now = new Date();

  const result: string[] = [];
  for (let cursor = start; cursor + duration <= end; cursor += duration) {
    const hhmm = minutesToHHMM(cursor);
    const slotStart = new Date(`${date}T${hhmm}:00`);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);
    if (slotStart <= now) continue;

    const busy = appointments.some(a => a.startsAt < slotEnd && a.endsAt > slotStart);
    const blocked = blocks.some(b => b.startsAt < slotEnd && b.endsAt > slotStart);
    if (!busy && !blocked) result.push(hhmm);
  }

  return result;
}
