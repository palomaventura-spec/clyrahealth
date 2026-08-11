"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";

export async function createWaitlistEntryAction(formData:FormData){
 const {user,companyId}=await requireCompany();
 if(!["OWNER","ADMIN","RECEPTIONIST","PROFESSIONAL"].includes(user.role)) return;
 const patientId=String(formData.get("patientId")||""); if(!patientId) redirect("/lista-espera?erro=paciente");
 const patient=await prisma.patient.findFirst({where:{id:patientId,companyId}}); if(!patient) redirect("/lista-espera?erro=paciente");
 let professionalId=String(formData.get("professionalId")||"")||null;
 if(user.role==="PROFESSIONAL") professionalId=user.professional?.id||null;
 if(professionalId){const p=await prisma.professional.findFirst({where:{id:professionalId,companyId}}); if(!p) professionalId=null;}
 await prisma.waitlistEntry.create({data:{patientId,professionalId,specialty:String(formData.get("specialty")||"")||null,preferredDays:String(formData.get("preferredDays")||"")||null,preferredPeriod:String(formData.get("preferredPeriod")||"")||null,priority:String(formData.get("priority")||"NORMAL"),notes:String(formData.get("notes")||"")||null,companyId}});
 revalidatePath("/lista-espera"); redirect("/lista-espera?sucesso=criado");
}
export async function updateWaitlistStatusAction(formData:FormData){
 const {user,companyId}=await requireCompany(); if(!["OWNER","ADMIN","RECEPTIONIST","PROFESSIONAL"].includes(user.role)) return;
 const id=String(formData.get("id")||""); const status=String(formData.get("status")||"WAITING");
 await prisma.waitlistEntry.updateMany({where:{id,companyId},data:{status}});
 revalidatePath("/lista-espera");
}
export async function deleteWaitlistEntryAction(formData:FormData){
 const {user,companyId}=await requireCompany(); if(!["OWNER","ADMIN","RECEPTIONIST"].includes(user.role)) return;
 await prisma.waitlistEntry.deleteMany({where:{id:String(formData.get("id")||""),companyId}});
 revalidatePath("/lista-espera");
}
