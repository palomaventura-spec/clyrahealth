import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "./whatsapp";
export async function sendNotification(input:{companyId:string;patientId?:string|null;appointmentId?:string|null;channel:NotificationChannel;recipient?:string|null;subject?:string|null;body:string}){
 const item=await prisma.notification.create({data:{companyId:input.companyId,patientId:input.patientId??null,appointmentId:input.appointmentId??null,channel:input.channel,recipient:input.recipient??null,subject:input.subject??null,body:input.body}});
 try{if(input.channel==="WHATSAPP"){if(!input.recipient)throw new Error("Paciente sem telefone.");const r=await sendWhatsAppMessage({to:input.recipient,body:input.body});if(!r.ok)throw new Error(r.error);return prisma.notification.update({where:{id:item.id},data:{status:"SENT",providerId:r.providerId??null,sentAt:new Date()}});}return prisma.notification.update({where:{id:item.id},data:{status:"SENT",sentAt:new Date()}});}
 catch(e){return prisma.notification.update({where:{id:item.id},data:{status:"FAILED",errorMessage:e instanceof Error?e.message:"Erro"}});}
}
