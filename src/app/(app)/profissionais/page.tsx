import Link from "next/link";
import { createProfessionalAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfessionalClinicalFields } from "@/components/ProfessionalClinicalFields";
import { ProfessionalScheduleFields } from "@/components/ProfessionalScheduleFields";
import { canManage, requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const typeLabels:Record<string,string>={
  DOCTOR:"Médico(a)",DENTIST:"Dentista",PHYSIOTHERAPIST:"Fisioterapeuta",
  PSYCHOLOGIST:"Psicólogo(a)",NUTRITIONIST:"Nutricionista",
  SPEECH_THERAPIST:"Fonoaudiólogo(a)",OTHER:"Outro"
};
const weekdays=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default async function ProfessionalsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;
  const {user,companyId}=await requireCompany();
  const professionalOnly=user.role==="PROFESSIONAL";
  const professionals=await prisma.professional.findMany({
    where:professionalOnly
      ? {companyId,id:user.professional?.id||"__none__"}
      : {companyId},
    include:{specialty:true,availabilities:true,user:{select:{email:true,mustChangePassword:true}}},
    orderBy:{name:"asc"}
  });
  const manage=canManage(user.role);

  return <div>
    {query.convite&&query.email&&<div className="alert alert-success invitation-box">
      <strong>✓ Profissional criado com sucesso.</strong>
      <p>Login: {query.email}</p>
      <p>Envie este link para o profissional criar a senha:</p>
      <code>{`${process.env.NEXT_PUBLIC_APP_URL??""}/redefinir-senha?token=${query.convite}`}</code>
    </div>}

    {query.sucesso==="vinculado"&&<div className="alert alert-success">✓ Seu usuário de gestor foi vinculado ao perfil profissional. Você continuará usando o mesmo login.</div>}
    {query.erro==="email"&&<div className="alert alert-error">Este e-mail já está vinculado a um usuário.</div>}
    {query.erro==="email-outra-clinica"&&<div className="alert alert-error">Este e-mail pertence a outra clínica e não pode ser vinculado.</div>}
    {query.erro==="ja-profissional"&&<div className="alert alert-error">Este usuário já possui um perfil profissional.</div>}
    {query.erro==="email-equipe"&&<div className="alert alert-error">Este e-mail já pertence a outro membro da equipe. Nesta versão, o vínculo automático é permitido ao proprietário da clínica.</div>}

    <div className="page-header"><div>
      <span className="eyebrow">{professionalOnly?"Perfil profissional":"Equipe clínica"}</span>
      <h1>{professionalOnly?"Meu perfil profissional":"Profissionais"}</h1>
      <p>{professionalOnly
        ? "Consulte seus dados profissionais e personalize sua própria agenda."
        : "Cada profissional possui profissão, especialidade e agenda próprias."}</p>
    </div></div>

    {manage&&<section className="card section-card professional-create-section">
      <div className="section-heading"><div>
        <h2>Novo profissional</h2>
        <p>Escolha a profissão e depois configure os dias e horários de atendimento.</p>
      </div></div>

      <form action={createProfessionalAction} className="form-grid professional-form">
        <label>Nome<input name="name" required/></label>
        <label>E-mail de acesso<input name="email" type="email" required/></label>

        <ProfessionalClinicalFields/>

        <label>Conselho<input name="council" placeholder="CRM, CRO, CREFITO..."/></label>
        <label>Registro profissional<input name="registrationNumber"/></label>
        <label>Duração da consulta (min)<input name="appointmentDuration" type="number" defaultValue={30} min={10} max={240} step={5} required/></label>
        <label>Telefone<input name="phone"/></label>

        <div className="span-2 schedule-highlight">
          <ProfessionalScheduleFields/>
        </div>

        <PendingSubmitButton idle="Cadastrar profissional e agenda" pending="Salvando profissional e agenda..." className="btn btn-primary span-2"/>
      </form>
    </section>}

    {professionalOnly&&professionals.length===0&&<div className="card section-card empty-state">Seu usuário ainda não está vinculado a um perfil profissional. Peça ao gestor da clínica para concluir o vínculo.</div>}

    <div className="cards-grid">
      {professionals.map(p=>{
        const slots=[...p.availabilities].sort((a,b)=>a.weekday-b.weekday||a.startTime.localeCompare(b.startTime));
        return <div className="card professional-card" key={p.id}>
          <div className="avatar">{p.name.slice(0,2).toUpperCase()}</div>
          <div>
            <h3>{p.name}</h3>
            <p>{typeLabels[p.type]??p.type} · {p.specialty?.name??"Sem especialidade"}</p>
            <small>{p.council??""} {p.registrationNumber??""}</small>
          </div>
          <div className="availability-list">
            {slots.map(a=><span key={a.id}>{weekdays[a.weekday]} {a.startTime}–{a.endTime}</span>)}
            {slots.length===0&&<small className="text-danger">Agenda ainda não configurada.</small>}
          </div>
          {(manage||(user.role==="PROFESSIONAL"&&user.professional?.id===p.id))&&
            <Link className="btn btn-small btn-secondary" href={`/profissionais/${p.id}/editar`}>
              {user.role==="PROFESSIONAL"?"Editar minha agenda":"Editar profissional e agenda"}
            </Link>}
        </div>;
      })}
    </div>
  </div>;
}
