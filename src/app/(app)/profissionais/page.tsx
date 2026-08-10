import Link from "next/link";
import { createProfessionalAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { canManage, requireCompany } from "@/lib/auth";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfessionalScheduleFields } from "@/components/ProfessionalScheduleFields";
import { ProfessionalClinicalFields, PROFESSIONAL_TYPES } from "@/components/ProfessionalClinicalFields";

const typeLabels = Object.fromEntries(PROFESSIONAL_TYPES) as Record<string,string>;
const weekdays=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export default async function ProfessionalsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams; const {user,companyId}=await requireCompany();
  const professionals=await prisma.professional.findMany({where:{companyId},include:{specialty:true,availabilities:true},orderBy:{name:"asc"}});
  const manage=canManage(user.role);
  return <div>
    {query.convite&&query.email&&<div className="alert alert-success invitation-box"><strong>✓ Profissional criado com sucesso.</strong><p>Login: {query.email}</p><p>Envie este link para o profissional criar a senha:</p><code>{`${process.env.NEXT_PUBLIC_APP_URL??""}/redefinir-senha?token=${query.convite}`}</code></div>}
    {query.erro==="email"&&<div className="alert alert-error">Este e-mail já está vinculado a um usuário.</div>}
    <div className="page-header"><div><span className="eyebrow">Equipe clínica</span><h1>Profissionais</h1><p>Cadastre cada profissional com profissão, especialidade e agenda próprias.</p></div></div>
    {manage&&<section className="card section-card professional-create-section"><h2>Novo profissional</h2>
      <form action={createProfessionalAction} className="form-grid professional-form">
        <label>Nome<input name="name" required/></label>
        <label>E-mail de acesso<input name="email" type="email" required/></label>
        <ProfessionalClinicalFields/>
        <label>Conselho<input name="council" placeholder="CRM, CRO, CREFITO..."/></label><label>Registro<input name="registrationNumber"/></label>
        <label>Duração da consulta (min)<input name="appointmentDuration" type="number" defaultValue={30} min={10} step={5}/></label>
        <label>Telefone<input name="phone"/></label>
        <div className="span-2 schedule-highlight"><ProfessionalScheduleFields/></div>
        <PendingSubmitButton idle="Cadastrar profissional" pending="Cadastrando profissional..." className="btn btn-primary span-2"/>
      </form>
    </section>}
    <div className="cards-grid">
      {professionals.map(p=><div className="card professional-card" key={p.id}>
        <div className="avatar">{p.name.slice(0,2).toUpperCase()}</div><div><h3>{p.name}</h3><p>{typeLabels[p.type]} · {p.specialty?.name??"Sem especialidade"}</p><small>{p.council??""} {p.registrationNumber??""}</small>{p.publicSlug&&<a className="professional-public-link" href={`/agendar/${user.company?.slug}?profissional=${p.publicSlug}`} target="_blank">Link público →</a>}</div>
        <div className="availability-list">{p.availabilities.sort((a,b)=>a.weekday-b.weekday||a.startTime.localeCompare(b.startTime)).map(a=><span key={a.id}>{weekdays[a.weekday]} {a.startTime}–{a.endTime}</span>)}{p.availabilities.length===0&&<small>Disponibilidade ainda não configurada.</small>}</div>
        {(manage||(user.role==="PROFESSIONAL"&&user.professional?.id===p.id))&&<Link className="btn btn-small btn-secondary" href={`/profissionais/${p.id}/editar`}>{user.role==="PROFESSIONAL"?"Editar minha agenda":"Editar profissional e agenda"}</Link>}
      </div>)}
    </div>
  </div>;
}
