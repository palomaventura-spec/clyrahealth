import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { updateProfessionalAction } from "@/app/actions";
import { ProfessionalScheduleFields } from "@/components/ProfessionalScheduleFields";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfessionalClinicalFields } from "@/components/ProfessionalClinicalFields";
export default async function Page({params,searchParams}:{params:Promise<{professionalId:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {professionalId}=await params; const q=await searchParams; const {user,companyId}=await requireCompany();
  const p=await prisma.professional.findFirst({where:{id:professionalId,companyId},include:{availabilities:true,specialty:true}}); if(!p) notFound();
  const allowed=["OWNER","ADMIN"].includes(user.role)||(user.role==="PROFESSIONAL"&&user.professional?.id===p.id); if(!allowed) redirect("/profissionais");
  const isProfessional=user.role==="PROFESSIONAL";
  return <div><div className="page-header"><div><Link href="/profissionais" className="back-link">← Voltar</Link><span className="eyebrow">Profissional</span><h1>{p.name}</h1><p>Edite os dados e personalize os dias e horários deste profissional.</p></div></div>
    {q.sucesso&&<div className="alert alert-success">✓ Profissional e agenda atualizados com sucesso.</div>}
    <section className="card section-card"><form action={updateProfessionalAction} className="form-grid professional-form">
      <input type="hidden" name="id" value={p.id}/><label>Nome<input name="name" defaultValue={p.name} required disabled={isProfessional}/>{isProfessional&&<input type="hidden" name="name" value={p.name}/>}</label>
      <label>Telefone<input name="phone" defaultValue={p.phone??""} disabled={isProfessional}/></label>
      <ProfessionalClinicalFields defaultType={p.type} defaultSpecialty={p.specialty?.name??""} disabled={isProfessional}/>
      <label>Conselho<input name="council" defaultValue={p.council??""} disabled={isProfessional}/></label><label>Registro<input name="registrationNumber" defaultValue={p.registrationNumber??""} disabled={isProfessional}/></label>
      <label>Duração da consulta (min)<input name="appointmentDuration" type="number" defaultValue={p.appointmentDuration} min={10} step={5}/></label>
      <div className="span-2 schedule-highlight"><ProfessionalScheduleFields availabilities={p.availabilities}/></div>
      <PendingSubmitButton idle="Salvar profissional e agenda" pending="Salvando agenda..." className="btn btn-primary span-2"/>
    </form></section>
  </div>;
}
