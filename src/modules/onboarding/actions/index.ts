"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createTrialWindow } from "@/modules/billing/services/trial";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string) {
  let slug = base || "cliente";
  let i = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function createTrialCompanyAction(formData: FormData) {
  const organizationName = String(formData.get("organizationName") || "").trim();
  const ownerName = String(formData.get("ownerName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const organizationKind = String(formData.get("organizationKind") || "CLINIC") as any;

  if (!organizationName || !ownerName || !email || password.length < 8) redirect("/comece-gratis?erro=dados");
  if (await prisma.user.findUnique({ where: { email } })) redirect("/comece-gratis?erro=email");

  const slug = await uniqueSlug(slugify(organizationName));
  const passwordHash = await bcrypt.hash(password, 10);
  const { trialStartedAt, trialEnds } = createTrialWindow();

  const company = await prisma.company.create({
    data: {
      name: organizationName,
      publicName: organizationName,
      slug,
      organizationKind,
      onboardingCompleted: false,
      subscription: { create: { plan: "TRIAL", status: "TRIAL", trialStartedAt, trialEnds } },
      billingSettings: { create: { provider: "NONE", environment: "SANDBOX", enabled: false } }
    }
  });

  await prisma.user.create({
    data: { name: ownerName, email, passwordHash, role: "OWNER", companyId: company.id }
  });

  redirect(`/acesso/${slug}?cadastro=sucesso`);
}
