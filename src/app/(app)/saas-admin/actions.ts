"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return user;
}

export async function toggleCompanyActiveAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const companyId = String(formData.get("companyId") || "");
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return;

  const nextActive = !company.active;
  await prisma.company.update({
    where: { id: companyId },
    data: { active: nextActive }
  });

  if (!nextActive) {
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true }
    });
    if (users.length) {
      await prisma.session.deleteMany({
        where: { userId: { in: users.map(u => u.id) } }
      });
    }
  }

  await audit({
    action: "UPDATE",
    entityType: "Company",
    entityId: companyId,
    companyId,
    userId: user.id,
    description: nextActive ? "Cliente desbloqueado pelo Super Admin" : "Cliente bloqueado pelo Super Admin"
  });

  revalidatePath("/saas-admin");
  revalidatePath(`/saas-admin/${companyId}`);
}

export async function extendTrialAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const companyId = String(formData.get("companyId") || "");
  const days = Math.min(30, Math.max(1, Number(formData.get("days") || 7)));

  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  if (!subscription) return;

  const base =
    subscription.trialEnds && subscription.trialEnds > new Date()
      ? subscription.trialEnds
      : new Date();

  const trialEnds = new Date(base.getTime() + days * 86400000);

  await prisma.subscription.update({
    where: { companyId },
    data: {
      status: subscription.status === "ACTIVE" ? "ACTIVE" : "TRIAL",
      trialStartedAt: subscription.trialStartedAt ?? new Date(),
      trialEnds
    }
  });

  await audit({
    action: "UPDATE",
    entityType: "Subscription",
    entityId: subscription.id,
    companyId,
    userId: user.id,
    description: `Trial estendido em ${days} dia(s)`
  });

  revalidatePath("/saas-admin");
  revalidatePath(`/saas-admin/${companyId}`);
}
