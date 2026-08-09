import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const PREFIX = "clyra_patient_";
const DAYS = 30;

function cookieName(slug: string) {
  return `${PREFIX}${slug}`;
}

export async function createPatientSession(slug: string, companyId: string, patientId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);

  await prisma.patientSession.create({
    data: { token, expiresAt, patientId, companyId }
  });

  const store = await cookies();
  store.set(cookieName(slug), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export async function getPatientForCompany(slug: string) {
  const store = await cookies();
  const token = store.get(cookieName(slug))?.value;
  if (!token) return null;

  const session = await prisma.patientSession.findUnique({
    where: { token },
    include: { patient: true, company: true }
  });

  if (!session || session.expiresAt < new Date() || session.company.slug !== slug) {
    return null;
  }

  return session.patient;
}

export async function destroyPatientSession(slug: string) {
  const store = await cookies();
  const token = store.get(cookieName(slug))?.value;
  if (token) await prisma.patientSession.deleteMany({ where: { token } });
  store.delete(cookieName(slug));
}
