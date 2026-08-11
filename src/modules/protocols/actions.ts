"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";

export async function createProtocolAction(formData:FormData){
 const {user,companyId}=await requireCompany();
 if(!["OWNER","ADMIN","PROFESSIONAL"].includes(user.role)) return;
 const name=String(formData.get("name")||"").trim(); if(!name) redirect("/protocolos?erro=nome");
 const fields=["specialty","description","complaint","anamnesis","examination","assessment","evolution","conduct","returnNotes"] as const;
 const data:any={name,companyId}; for(const f of fields){const v=String(formData.get(f)||"").trim(); data[f]=v||null;}
 await prisma.protocolTemplate.create({data});
 revalidatePath("/protocolos"); redirect("/protocolos?sucesso=criado");
}
export async function deleteProtocolAction(formData:FormData){
 const {user,companyId}=await requireCompany(); if(!["OWNER","ADMIN"].includes(user.role)) return;
 await prisma.protocolTemplate.deleteMany({where:{id:String(formData.get("id")||""),companyId}});
 revalidatePath("/protocolos");
}
