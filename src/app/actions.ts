"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManage, createSession, destroySession, requireCompany, requireUser } from "@/lib/auth";
import { AppointmentStatus, ProfessionalType, UserRole, Prisma } from "@prisma/client";
import { createPatientSession, destroyPatientSession, getPatientForCompany } from "@/lib/patient-auth";
import { getAvailableSlots } from "@/lib/slots";
import { audit } from "@/lib/audit";
import crypto from "node:crypto";

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
  const companySlug = String(formData.get("companySlug") || "").trim();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect(companySlug ? `/acesso/${companySlug}?erro=credenciais` : "/login?erro=credenciais");
  }

  if (companySlug && user.role !== "SUPER_ADMIN" && user.company?.slug !== companySlug) {
    redirect(`/acesso/${companySlug}?erro=credenciais`);
  }

  if (user.role !== "SUPER_ADMIN" && user.company?.active === false) {
    redirect(companySlug ? `/acesso/${companySlug}?erro=bloqueado` : "/login?erro=bloqueado");
  }

  await createSession(user.id);
  await audit({
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    companyId: user.companyId,
    userId: user.id,
    description: "Login realizado"
  });

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
  if (!["OWNER", "ADMIN"].includes(user.role)) return;

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const type = String(formData.get("type") || "OTHER") as ProfessionalType;
  const specialtyId = String(formData.get("specialtyId") || "") || null;
  const duration = Number(formData.get("appointmentDuration") || 30);

  if (!name || !email) return;
  if (await prisma.user.findUnique({ where: { email } })) {
    redirect("/profissionais?erro=email");
  }

  const publicSlugBase = slugify(name) || "profissional";
  let publicSlug = publicSlugBase;
  let suffix = 1;
  while (await prisma.professional.findFirst({ where: { companyId, publicSlug } })) {
    publicSlug = `${publicSlugBase}-${suffix++}`;
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  const inviteToken = crypto.randomBytes(32).toString("hex");

  const professionalUser = await prisma.$transaction(async tx => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "PROFESSIONAL",
        companyId,
        mustChangePassword: true
      }
    });

    await tx.professional.create({
      data: {
        name,
        publicSlug,
        type,
        specialtyId,
        companyId,
        userId: createdUser.id,
        email,
        phone: String(formData.get("phone") || "") || null,
        council: String(formData.get("council") || "") || null,
        registrationNumber: String(formData.get("registrationNumber") || "") || null,
        appointmentDuration: Number.isFinite(duration) ? duration : 30
      }
    });

    await tx.passwordResetToken.create({
      data: {
        token: inviteToken,
        userId: createdUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        inviteKind: "PROFESSIONAL_INVITE"
      }
    });

    return createdUser;
  });

  await audit({
    action: "CREATE",
    entityType: "Professional",
    entityId: professionalUser.id,
    companyId,
    userId: user.id,
    description: `Profissional ${name} criado com convite de acesso`
  });

  redirect(`/profissionais?convite=${inviteToken}&email=${encodeURIComponent(email)}&sucesso=1`);
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
  const { user, companyId } = await requireCompany();
  const requestedProfessionalId = String(formData.get("professionalId") || "");
  const professionalId =
    user.role === "PROFESSIONAL"
      ? user.professional?.id || ""
      : requestedProfessionalId;

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

  try {
    const createdAppointment = await prisma.$transaction(async tx => {
      const [collision, block] = await Promise.all([
        tx.appointment.findFirst({
          where: {
            companyId,
            professionalId,
            status: { not: AppointmentStatus.CANCELLED },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt }
          }
        }),
        tx.scheduleBlock.findFirst({
          where: {
            companyId,
            professionalId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt }
          }
        })
      ]);

      if (collision || block) throw new Error("SLOT_TAKEN");

      return tx.appointment.create({
        data: { companyId, professionalId, patientId, startsAt, endsAt, reason }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    await audit({
      action: "CREATE",
      entityType: "Appointment",
      entityId: createdAppointment.id,
      companyId,
      userId: user.id,
      description: "Consulta criada"
    });
  } catch (error) {
    redirect("/agenda?erro=horario");
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/atendimentos");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "SCHEDULED") as AppointmentStatus;

  const where =
    user.role === "PROFESSIONAL"
      ? { id, companyId, professionalId: user.professional?.id || "__none__" }
      : { id, companyId };

  await prisma.appointment.updateMany({ where, data: { status } });
  await audit({ action:"CHANGE_APPOINTMENT", entityType:"Appointment", entityId:id, companyId, userId:user.id, description:`Status alterado para ${status}` });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/atendimentos");
}

export async function createTeamUserAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role)) return;

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "RECEPTIONIST") as UserRole;

  if (!email || !name || !["ADMIN", "RECEPTIONIST"].includes(role)) return;
  if (await prisma.user.findUnique({ where: { email } })) {
    redirect("/equipe?erro=email");
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  const inviteToken = crypto.randomBytes(32).toString("hex");

  const created = await prisma.$transaction(async tx => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        companyId,
        mustChangePassword: true
      }
    });

    await tx.passwordResetToken.create({
      data: {
        token: inviteToken,
        userId: createdUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        inviteKind: "TEAM_INVITE"
      }
    });

    return createdUser;
  });

  await audit({
    action: "CREATE",
    entityType: "User",
    entityId: created.id,
    companyId,
    userId: user.id,
    description: `Usuário ${name} (${role}) criado com convite`
  });

  redirect(`/equipe?convite=${inviteToken}&email=${encodeURIComponent(email)}&sucesso=1`);
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
  const { user, companyId } = await requireCompany();

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.id,
      companyId,
      ...(user.role === "PROFESSIONAL"
        ? { professionalId: user.professional?.id || "__none__" }
        : {})
    }
  });

  if (!appointment) return { ok: false, message: "Consulta não encontrada ou sem permissão." };

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { ok: false, message: "Data inválida." };
  }

  const [collision, block] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        companyId,
        professionalId: appointment.professionalId,
        id: { not: appointment.id },
        status: { not: AppointmentStatus.CANCELLED },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      }
    }),
    prisma.scheduleBlock.findFirst({
      where: {
        companyId,
        professionalId: appointment.professionalId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      }
    })
  ]);

  if (collision || block) {
    return { ok: false, message: "Horário indisponível para este profissional." };
  }

  await prisma.appointment.update({ where: { id: appointment.id }, data: { startsAt, endsAt } });
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/atendimentos");
  return { ok: true };
}


export async function createScheduleBlockAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role) && user.role !== "RECEPTIONIST" && user.role !== "PROFESSIONAL") return;

  const requestedProfessionalId = String(formData.get("professionalId") || "");
  const professionalId = user.role === "PROFESSIONAL" ? user.professional?.id || "" : requestedProfessionalId;
  const date = String(formData.get("date") || "");
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");
  const title = String(formData.get("title") || "Bloqueio").trim() || "Bloqueio";

  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId }
  });
  if (!professional || !date || !startTime || !endTime) return;

  const startsAt = new Date(`${date}T${startTime}:00`);
  const endsAt = new Date(`${date}T${endTime}:00`);
  if (endsAt <= startsAt) return;

  await prisma.scheduleBlock.create({
    data: { title, startsAt, endsAt, companyId, professionalId }
  });

  revalidatePath("/agenda");
}

export async function deleteScheduleBlockAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role) && user.role !== "RECEPTIONIST" && user.role !== "PROFESSIONAL") return;
  const id = String(formData.get("id") || "");
  await prisma.scheduleBlock.deleteMany({
    where: {
      id,
      companyId,
      ...(user.role === "PROFESSIONAL" ? { professionalId: user.professional?.id || "__none__" } : {})
    }
  });
  revalidatePath("/agenda");
}

export async function identifyPatientAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const document = String(formData.get("document") || "").replace(/\D/g, "");
  const birthDate = String(formData.get("birthDate") || "");

  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company || !document || !birthDate) redirect(`/agendar/${slug}?erro=identificacao`);

  const start = new Date(`${birthDate}T00:00:00`);
  const end = new Date(`${birthDate}T23:59:59`);

  const patient = await prisma.patient.findFirst({
    where: {
      companyId: company.id,
      document,
      birthDate: { gte: start, lte: end }
    }
  });

  if (!patient) {
    redirect(`/agendar/${slug}/cadastro?document=${encodeURIComponent(document)}&birthDate=${encodeURIComponent(birthDate)}`);
  }

  await createPatientSession(slug, company.id, patient.id);
  redirect(`/agendar/${slug}/horarios`);
}

export async function registerPublicPatientAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) redirect("/");

  const name = String(formData.get("name") || "").trim();
  const document = String(formData.get("document") || "").replace(/\D/g, "");
  const birthDate = String(formData.get("birthDate") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !document || !birthDate || !phone) {
    redirect(`/agendar/${slug}/cadastro?erro=dados`);
  }

  let patient = await prisma.patient.findFirst({
    where: { companyId: company.id, document }
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        name,
        document,
        birthDate: new Date(`${birthDate}T12:00:00`),
        email: email || null,
        phone,
        companyId: company.id
      }
    });
  }

  await createPatientSession(slug, company.id, patient.id);
  redirect(`/agendar/${slug}/horarios`);
}

export async function patientBookAppointmentAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const patient = await getPatientForCompany(slug);
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!patient || !company) redirect(`/agendar/${slug}`);

  const professionalId = String(formData.get("professionalId") || "");
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const reason = String(formData.get("reason") || "").trim() || null;

  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId: company.id, active: true }
  });
  if (!professional) redirect(`/agendar/${slug}/horarios?erro=profissional`);

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + professional.appointmentDuration * 60000);

  try {
    await prisma.$transaction(async tx => {
      const [collision, block] = await Promise.all([
        tx.appointment.findFirst({
          where: {
            companyId: company.id,
            professionalId,
            status: { not: AppointmentStatus.CANCELLED },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt }
          }
        }),
        tx.scheduleBlock.findFirst({
          where: {
            companyId: company.id,
            professionalId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt }
          }
        })
      ]);

      if (collision || block) throw new Error("SLOT_TAKEN");

      await tx.appointment.create({
        data: {
          companyId: company.id,
          professionalId: professional.id,
          patientId: patient.id,
          startsAt,
          endsAt,
          status: AppointmentStatus.SCHEDULED,
          reason
        }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  } catch {
    redirect(`/agendar/${slug}/horarios?profissional=${professional.id}&date=${date}&erro=ocupado`);
  }

  redirect(`/paciente/${slug}?sucesso=agendado`);
}

export async function patientConfirmAppointmentAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const appointmentId = String(formData.get("appointmentId") || "");
  const patient = await getPatientForCompany(slug);
  if (!patient) redirect(`/agendar/${slug}`);

  await prisma.appointment.updateMany({
    where: { id: appointmentId, patientId: patient.id, status: "SCHEDULED" },
    data: { status: "CONFIRMED" }
  });

  revalidatePath(`/paciente/${slug}`);
}

export async function patientCancelAppointmentAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const appointmentId = String(formData.get("appointmentId") || "");
  const patient = await getPatientForCompany(slug);
  if (!patient) redirect(`/agendar/${slug}`);

  await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      patientId: patient.id,
      startsAt: { gt: new Date() },
      status: { in: ["SCHEDULED", "CONFIRMED"] }
    },
    data: { status: "CANCELLED" }
  });

  revalidatePath(`/paciente/${slug}`);
}

export async function patientRescheduleAppointmentAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const appointmentId = String(formData.get("appointmentId") || "");
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const patient = await getPatientForCompany(slug);
  const company = await prisma.company.findUnique({ where: { slug } });

  if (!patient || !company) redirect(`/agendar/${slug}`);

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId: patient.id, companyId: company.id },
    include: { professional: true }
  });
  if (!appointment) redirect(`/paciente/${slug}`);

  const slots = await getAvailableSlots(company.id, appointment.professionalId, date);
  if (!slots.includes(time)) {
    redirect(`/paciente/${slug}/reagendar/${appointmentId}?date=${date}&erro=ocupado`);
  }

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + appointment.professional.appointmentDuration * 60000);

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { startsAt, endsAt, status: "SCHEDULED" }
  });

  redirect(`/paciente/${slug}?sucesso=reagendado`);
}

export async function patientLogoutAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  await destroyPatientSession(slug);
  redirect(`/agendar/${slug}`);
}


export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where:{email} });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({ data:{token,userId:user.id,expiresAt:new Date(Date.now()+30*60*1000)} });
    console.log(`[PASSWORD RESET] ${email}: /redefinir-senha?token=${token}`);
  }
  redirect("/esqueci-senha?enviado=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  if (password.length < 8) redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&erro=senha`);
  const reset = await prisma.passwordResetToken.findUnique({ where:{token}, include:{user:true} });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) redirect("/login?erro=token");
  const passwordHash=await bcrypt.hash(password,10);
  await prisma.$transaction([
    prisma.user.update({where:{id:reset.userId},data:{passwordHash,mustChangePassword:false}}),
    prisma.passwordResetToken.update({where:{id:reset.id},data:{usedAt:new Date()}}),
    prisma.session.deleteMany({where:{userId:reset.userId}})
  ]);
  await audit({action:"PASSWORD_RESET",entityType:"User",entityId:reset.userId,companyId:reset.user.companyId,userId:reset.userId,description:"Senha redefinida"});
  redirect("/login?senha=alterada");
}
