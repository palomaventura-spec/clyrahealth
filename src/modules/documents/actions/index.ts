"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { clinicalDocumentSchema } from "@/modules/documents/validations";
import { audit } from "@/lib/audit";

export async function createClinicalDocumentAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!["OWNER","PROFESSIONAL"].includes(user.role)) redirect("/atendimentos?erro=permissao");

  const appointmentId = String(formData.get("appointmentId") || "");
  const parsed = clinicalDocumentSchema.safeParse({
    type: String(formData.get("type") || ""),
    title: String(formData.get("title") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    instructions: String(formData.get("instructions") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined
  });
  if (!parsed.success) redirect(`/atendimentos/${appointmentId}/documentos/novo?tipo=${String(formData.get("type") || "")}&erro=dados`);

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, companyId, ...(user.role === "PROFESSIONAL" ? { professionalId: user.professional?.id || "__none__" } : {}) },
    include: { consultation: true }
  });
  if (!appointment) redirect("/atendimentos?erro=consulta");

  const doc = await prisma.clinicalDocument.create({
    data: {
      ...parsed.data,
      instructions: parsed.data.instructions || null,
      notes: parsed.data.notes || null,
      companyId,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      appointmentId: appointment.id,
      consultationId: appointment.consultation?.id || null
    }
  });

  await audit({ action:"CREATE_DOCUMENT", entityType:"ClinicalDocument", entityId:doc.id, companyId, userId:user.id, description:`Documento ${parsed.data.type} emitido` });
  revalidatePath(`/atendimentos/${appointmentId}`);
  revalidatePath("/documentos");
  redirect(`/documentos/${doc.id}`);
}

export async function deleteClinicalDocumentAction(formData: FormData) {
  const { user, companyId } = await requireCompany();
  if (!["OWNER","PROFESSIONAL"].includes(user.role)) return;
  const documentId = String(formData.get("documentId") || "");
  const doc = await prisma.clinicalDocument.findFirst({ where: { id: documentId, companyId, ...(user.role === "PROFESSIONAL" ? { professionalId: user.professional?.id || "__none__" } : {}) } });
  if (!doc) return;
  await prisma.clinicalDocument.delete({ where: { id: doc.id } });
  await audit({ action:"DELETE", entityType:"ClinicalDocument", entityId:doc.id, companyId, userId:user.id, description:"Documento clínico excluído" });
  revalidatePath("/documentos");
  revalidatePath(`/atendimentos/${doc.appointmentId}`);
  redirect(`/atendimentos/${doc.appointmentId}`);
}
