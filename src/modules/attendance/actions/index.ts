"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { attendanceSchema } from "@/modules/attendance/validations";

async function requireProfessionalAppointment(appointmentId: string) {
  const { user, companyId } = await requireCompany();
  if (!user.professional?.id) redirect("/atendimentos?erro=permissao");
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, companyId, professionalId: user.professional.id },
    include: { patient: true, consultation: true }
  });
  if (!appointment) redirect("/atendimentos?erro=consulta");
  return { companyId, appointment };
}

export async function markPatientArrivedAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!["OWNER","ADMIN","RECEPTIONIST","PROFESSIONAL"].includes(user.role)) return;
  const appointmentId = String(formData.get("appointmentId") || "");
  await prisma.appointment.updateMany({
    where: { id: appointmentId, companyId, status: { in: ["SCHEDULED","CONFIRMED"] } },
    data: { status: "ARRIVED" }
  });
  revalidatePath("/atendimentos"); revalidatePath("/dashboard"); revalidatePath("/agenda");
}

export async function startConsultationAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") || "");
  const { companyId, appointment } = await requireProfessionalAppointment(appointmentId);
  await prisma.medicalRecord.upsert({ where:{patientId:appointment.patientId}, update:{}, create:{patientId:appointment.patientId,companyId} });
  await prisma.consultation.upsert({
    where:{appointmentId},
    update:{startedAt: appointment.consultation?.startedAt ?? new Date()},
    create:{appointmentId,patientId:appointment.patientId,professionalId:appointment.professionalId,companyId,startedAt:new Date()}
  });
  await prisma.appointment.update({ where:{id:appointmentId}, data:{status:"IN_PROGRESS"} });
  revalidatePath("/dashboard"); revalidatePath("/atendimentos");
  redirect(`/atendimentos/${appointmentId}`);
}

export async function saveConsultationAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") || "");
  const intent = String(formData.get("intent") || "draft");
  const { companyId, appointment } = await requireProfessionalAppointment(appointmentId);
  const parsed = attendanceSchema.safeParse({
    complaint:String(formData.get("complaint") || "") || undefined,
    anamnesis:String(formData.get("anamnesis") || "") || undefined,
    examination:String(formData.get("examination") || "") || undefined,
    assessment:String(formData.get("assessment") || "") || undefined,
    evolution:String(formData.get("evolution") || "") || undefined,
    conduct:String(formData.get("conduct") || "") || undefined,
    returnNotes:String(formData.get("returnNotes") || "") || undefined,
    returnDate:String(formData.get("returnDate") || "") || undefined
  });
  if (!parsed.success) redirect(`/atendimentos/${appointmentId}?erro=dados`);
  const returnDate = parsed.data.returnDate ? new Date(`${parsed.data.returnDate}T12:00:00`) : null;
  const clinicalData = {
    complaint:parsed.data.complaint, anamnesis:parsed.data.anamnesis, examination:parsed.data.examination,
    assessment:parsed.data.assessment, evolution:parsed.data.evolution, conduct:parsed.data.conduct,
    returnNotes:parsed.data.returnNotes, returnDate
  };
  await prisma.consultation.upsert({
    where:{appointmentId},
    update:{...clinicalData, ...(intent === "finish" ? {finishedAt:new Date()} : {})},
    create:{appointmentId,patientId:appointment.patientId,professionalId:appointment.professionalId,companyId,...clinicalData,startedAt:new Date(),...(intent === "finish" ? {finishedAt:new Date()} : {})}
  });
  if (intent === "finish") {
    await prisma.appointment.update({where:{id:appointmentId},data:{status:"COMPLETED"}});
    revalidatePath("/dashboard"); revalidatePath("/atendimentos"); revalidatePath(`/pacientes/${appointment.patientId}`);
    redirect("/atendimentos?sucesso=finalizado");
  }
  if (appointment.status !== "IN_PROGRESS") await prisma.appointment.update({where:{id:appointmentId},data:{status:"IN_PROGRESS"}});
  revalidatePath(`/atendimentos/${appointmentId}`); revalidatePath(`/pacientes/${appointment.patientId}`);
  redirect(`/atendimentos/${appointmentId}?sucesso=rascunho`);
}

export async function finishConsultationAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") || "");
  const { appointment } = await requireProfessionalAppointment(appointmentId);
  const consultation = await prisma.consultation.findUnique({ where:{appointmentId} });
  if (!consultation) redirect(`/atendimentos/${appointmentId}?erro=nao-iniciado`);
  await prisma.$transaction([
    prisma.consultation.update({where:{appointmentId},data:{finishedAt:new Date()}}),
    prisma.appointment.update({where:{id:appointmentId},data:{status:"COMPLETED"}})
  ]);
  revalidatePath("/dashboard"); revalidatePath("/atendimentos"); revalidatePath(`/pacientes/${appointment.patientId}`);
  redirect("/atendimentos?sucesso=finalizado");
}

export async function addClinicalNoteAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") || "");
  const content = String(formData.get("content") || "").trim();
  if (!content) return;
  const { companyId, appointment } = await requireProfessionalAppointment(appointmentId);
  const record = await prisma.medicalRecord.upsert({where:{patientId:appointment.patientId},update:{},create:{patientId:appointment.patientId,companyId}});
  const consultation = await prisma.consultation.upsert({
    where:{appointmentId},update:{},
    create:{appointmentId,patientId:appointment.patientId,professionalId:appointment.professionalId,companyId,startedAt:new Date()}
  });
  await prisma.clinicalNote.create({data:{content,medicalRecordId:record.id,consultationId:consultation.id,patientId:appointment.patientId,professionalId:appointment.professionalId,companyId}});
  revalidatePath(`/atendimentos/${appointmentId}`);
}
