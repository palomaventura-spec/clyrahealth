"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { audit } from "@/lib/audit";

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() &&
    a.getMonth()===b.getMonth() &&
    a.getDate()===b.getDate();
}

function canOperateFinance(user: any, appointment: { startsAt: Date; professionalId: string }) {
  if (["OWNER","ADMIN"].includes(user.role)) return true;
  if (user.role === "PROFESSIONAL") return user.professional?.id === appointment.professionalId;
  if (user.role === "RECEPTIONIST") {
    if (user.receptionFinanceAccess === "FULL") return true;
    if (user.receptionFinanceAccess === "DAILY") return isSameLocalDay(appointment.startsAt, new Date());
  }
  return false;
}

function moneyToCents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

export async function updateAppointmentFinancialAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  const id = String(formData.get("id") || "");
  const appointment = await prisma.appointment.findFirst({
    where: { id, companyId },
    include: { patient: true }
  });
  if (!appointment || !canOperateFinance(user, appointment)) return;

  const grossAmountCents = moneyToCents(formData.get("grossAmount"));
  const discountCents = Math.min(
    grossAmountCents,
    moneyToCents(formData.get("discount"))
  );
  const finalAmountCents = Math.max(0, grossAmountCents - discountCents);
  const paymentStatus = String(
    formData.get("paymentStatus") || "PENDING"
  ) as PaymentStatus;
  const methodRaw = String(formData.get("paymentMethod") || "");
  const paymentMethod = methodRaw ? (methodRaw as PaymentMethod) : null;
  const careType = String(formData.get("careType") || "PRIVATE");

  await prisma.appointment.update({
    where: { id },
    data: {
      careType,
      grossAmountCents,
      discountCents,
      finalAmountCents,
      paymentStatus,
      paymentMethod,
      paidAt: paymentStatus === "PAID" ? appointment.paidAt ?? new Date() : null,
      insuranceName: careType === "INSURANCE" ? appointment.patient.insurance : null,
      insurancePlan: careType === "INSURANCE" ? appointment.patient.insurancePlan : null,
      insuranceCard: careType === "INSURANCE" ? appointment.patient.insuranceCard : null
    }
  });

  await audit({
    action: "UPDATE",
    entityType: "AppointmentFinance",
    entityId: id,
    companyId,
    userId: user.id,
    description: `Financeiro atualizado: ${paymentStatus} · valor final ${finalAmountCents} centavos · ${paymentMethod ?? "sem forma informada"}`
  });

  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
  redirect("/financeiro?sucesso=1");
}

export async function markAppointmentPaidAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  const id = String(formData.get("id") || "");
  const methodRaw = String(formData.get("paymentMethod") || "PIX");
  const appointment = await prisma.appointment.findFirst({ where: { id, companyId } });
  if (!appointment || !canOperateFinance(user, appointment)) return;

  await prisma.appointment.updateMany({
    where: { id, companyId },
    data: {
      paymentStatus: "PAID",
      paymentMethod: methodRaw as PaymentMethod,
      paidAt: new Date()
    }
  });

  await audit({
    action: "UPDATE",
    entityType: "AppointmentFinance",
    entityId: id,
    companyId,
    userId: user.id,
    description: "Pagamento marcado como recebido"
  });

  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
}
