import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateProfessionalAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfessionalClinicalFields } from "@/components/ProfessionalClinicalFields";
import { ProfessionalScheduleFields } from "@/components/ProfessionalScheduleFields";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Page({params,searchParams}:{params:Promise<{professionalId:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {professionalId}=await params;
  const query=await searchParams;
  const {user,companyId}=await requireCompany();

  const p=await prisma.professional.findFirst({
    where:{id:professionalId,companyId},
    include:{availabilities:{orderBy:[{weekday:"asc"},{startTime:"asc"}]},specialty:true}
  });
  if(!p) notFound();

  const manager=["OWNER","ADMIN"].includes(user.role);
  const self=user.role==="PROFESSIONAL"&&user.professional?.id===p.id;
  if(!manager&&!self) redirect("/profissionais");

  return <div>
    <div className="page-header"><div>
      <Link href="/profissionais" className="back-link">← Voltar</Link>
      <span className="eyebrow">Profissional</span>
      <h1>{p.name}</h1>
      <p>{manager?"Edite dados, especialidade e agenda.":"Edite sua duração, dias e horários."}</p>
    </div></div>

    {query.sucesso&&<div className="alert alert-success">✓ Profissional e agenda atualizados com sucesso.</div>}

    <section className="card section-card">
      <form action={updateProfessionalAction} className="form-grid professional-form">
        <input type="hidden" name="id" value={p.id}/>

        <label>Nome
          <input name="name" defaultValue={p.name} required disabled={!manager}/>
          {!manager&&<input type="hidden" name="name" value={p.name}/>}
        </label>

        <label>Telefone
          <input name="phone" defaultValue={p.phone??""} disabled={!manager}/>
          {!manager&&<input type="hidden" name="phone" value={p.phone??""}/>}
        </label>

        <ProfessionalClinicalFields defaultType={p.type} defaultSpecialty={p.specialty?.name??""} disabled={!manager}/>

        <label>Conselho
          <input name="council" defaultValue={p.council??""} disabled={!manager}/>
          {!manager&&<input type="hidden" name="council" value={p.council??""}/>}
        </label>

        <label>Registro profissional
          <input name="registrationNumber" defaultValue={p.registrationNumber??""} disabled={!manager}/>
          {!manager&&<input type="hidden" name="registrationNumber" value={p.registrationNumber??""}/>}
        </label>

        <label>Duração da consulta (min)
          <input name="appointmentDuration" type="number" defaultValue={p.appointmentDuration} min={10} max={240} step={5} required/>
        </label>

        <div className="span-2 schedule-highlight">
          <ProfessionalScheduleFields availabilities={p.availabilities}/>
        </div>

        <PendingSubmitButton idle="Salvar profissional e agenda" pending="Salvando profissional e agenda..." className="btn btn-primary span-2"/>
      </form>
    </section>
  </div>;
}
