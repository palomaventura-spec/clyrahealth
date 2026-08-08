"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManage, createSession, destroySession, requireCompany, requireUser } from "@/lib/auth";
import { AppointmentStatus, ProfessionalType, UserRole } from "@prisma/client";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?erro=credenciais");
  }

  await createSession(user.id);
  redirect(user.role === "SUPER_ADMIN" ? "/saas-admin" : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function registerCompanyAction(formData: FormData) {
  const companyName = String(formData.get("companyName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!companyName || !name || !email || password.length < 8) {
    redirect("/cadastro?erro=dados");
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    redirect("/cadastro?erro=email");
  }

  let slug = slugify(companyName) || "clinica";
  let suffix = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${slugify(companyName)}-${suffix++}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      slug,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: UserRole.OWNER
        }
      },
      subscription: {
        create: {
          plan: "TRIAL",
          status: "TRIAL",
          trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      }
    },
    include: { users: true }
  });

  await createSession(company.users[0].id);
  redirect("/onboarding");
}

export async function completeOnboardingAction(formData: FormData) {
  const { companyId } = await requireCompany();
  await prisma.company.update({
    where: { id: companyId },
    data: {
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      city: String(formData.get("city") || "") || null,
      state: String(formData.get("state") || "") || null,
      onboardingCompleted: true
    }
  });
  redirect("/dashboard");
}

export async function createSpecialtyAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role)) return;
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.specialty.upsert({
    where: { companyId_name: { companyId, name } },
    update: {},
    create: { companyId, name }
  });
  revalidatePath("/profissionais");
}

export async function createProfessionalAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role)) return;

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "OTHER") as ProfessionalType;
  const specialtyId = String(formData.get("specialtyId") || "") || null;
  const duration = Number(formData.get("appointmentDuration") || 30);

  if (!name) return;

  await prisma.professional.create({
    data: {
      name,
      type,
      specialtyId,
      companyId,
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      council: String(formData.get("council") || "") || null,
      registrationNumber: String(formData.get("registrationNumber") || "") || null,
      appointmentDuration: Number.isFinite(duration) ? duration : 30
    }
  });
  revalidatePath("/profissionais");
}

export async function createPatientAction(formData: FormData) {
  const { companyId } = await requireCompany();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await prisma.patient.create({
    data: {
      name,
      companyId,
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      document: String(formData.get("document") || "") || null,
      insurance: String(formData.get("insurance") || "") || null,
      notes: String(formData.get("notes") || "") || null
    }
  });
  revalidatePath("/pacientes");
}

export async function createAvailabilityAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role)) return;

  const professionalId = String(formData.get("professionalId") || "");
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId }
  });
  if (!professional) return;

  await prisma.availability.create({
    data: {
      professionalId,
      weekday: Number(formData.get("weekday")),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime"))
    }
  });
  revalidatePath("/profissionais");
}

export async function createAppointmentAction(formData: FormData) {
  const { companyId } = await requireCompany();
  const professionalId = String(formData.get("professionalId") || "");
  const patientId = String(formData.get("patientId") || "");
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const reason = String(formData.get("reason") || "") || null;

  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId, active: true }
  });
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, companyId }
  });

  if (!professional || !patient || !date || !time) return;

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + professional.appointmentDuration * 60000);

  const collision = await prisma.appointment.findFirst({
    where: {
      companyId,
      professionalId,
      status: { not: AppointmentStatus.CANCELLED },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (collision) redirect("/agenda?erro=horario");

  await prisma.appointment.create({
    data: {
      companyId,
      professionalId,
      patientId,
      startsAt,
      endsAt,
      reason
    }
  });
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const { companyId } = await requireCompany();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "SCHEDULED") as AppointmentStatus;

  await prisma.appointment.updateMany({
    where: { id, companyId },
    data: { status }
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

export async function createTeamUserAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role)) return;

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "RECEPTIONIST") as UserRole;

  if (!email || !name || password.length < 8 || role === "SUPER_ADMIN") return;
  if (await prisma.user.findUnique({ where: { email } })) return;

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      companyId
    }
  });
  revalidatePath("/equipe");
}

export async function publicBookingAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return;

  const professionalId = String(formData.get("professionalId") || "");
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId: company.id, active: true }
  });
  if (!professional) return;

  const patientName = String(formData.get("patientName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  if (!patientName || !date || !time) return;

  let patient = email
    ? await prisma.patient.findFirst({ where: { companyId: company.id, email } })
    : null;

  if (!patient) {
    patient = await prisma.patient.create({
      data: { name: patientName, email: email || null, phone: phone || null, companyId: company.id }
    });
  }

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + professional.appointmentDuration * 60000);

  const collision = await prisma.appointment.findFirst({
    where: {
      professionalId,
      status: { not: AppointmentStatus.CANCELLED },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });
  if (collision) redirect(`/agendar/${slug}?erro=ocupado`);

  await prisma.appointment.create({
    data: {
      companyId: company.id,
      professionalId,
      patientId: patient.id,
      startsAt,
      endsAt,
      status: AppointmentStatus.SCHEDULED,
      reason: String(formData.get("reason") || "") || null
    }
  });

  redirect(`/agendar/${slug}?sucesso=1`);
}


export async function moveAppointmentAction(input: {
  id: string;
  startsAt: string;
  endsAt: string;
}) {
  const { companyId } = await requireCompany();

  const appointment = await prisma.appointment.findFirst({
    where: { id: input.id, companyId }
  });

  if (!appointment) {
    return { ok: false, message: "Consulta não encontrada." };
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false, message: "Data inválida." };
  }

  const collision = await prisma.appointment.findFirst({
    where: {
      companyId,
      professionalId: appointment.professionalId,
      id: { not: appointment.id },
      status: { not: AppointmentStatus.CANCELLED },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (collision) {
    return {
      ok: false,
      message: "Este profissional já possui uma consulta nesse horário."
    };
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { startsAt, endsAt }
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");

  return { ok: true };
}
