import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";

export default async function Page(){
  const {user,companyId}=await requireCompany();
  if(!user.company?.onboardingCompleted){const {redirect}=await import("next/navigation");redirect("/onboarding")}

  const professionalScope =
    user.role==="PROFESSIONAL" && user.professional?.id
      ? {professionalId:user.professional.id}
      : {};

  const start=new Date(); start.setHours(0,0,0,0);
  const end=new Date(); end.setHours(23,59,59,999);

  const count=(status:any)=>prisma.appointment.count({
    where:{companyId,...professionalScope,startsAt:{gte:start,lte:end},status}
  });

  const financeVisible=["OWNER","ADMIN","PROFESSIONAL"].includes(user.role);
  const monthStart=new Date(start.getFullYear(),start.getMonth(),1);
  const nextMonth=new Date(start.getFullYear(),start.getMonth()+1,1);

  const [professionals,patients,today,confirmed,arrived,inProgress,completed,cancelled,noShow,upcoming,financialAppointments]=await Promise.all([
    user.role==="PROFESSIONAL"
      ? Promise.resolve(1)
      : prisma.professional.count({where:{companyId,active:true}}),
    user.role==="PROFESSIONAL"
      ? prisma.patient.count({where:{companyId,appointments:{some:{professionalId:user.professional?.id||"__none__"}}}})
      : prisma.patient.count({where:{companyId}}),
    prisma.appointment.count({where:{companyId,...professionalScope,startsAt:{gte:start,lte:end},status:{not:"CANCELLED"}}}),
    count("CONFIRMED"),count("ARRIVED"),count("IN_PROGRESS"),count("COMPLETED"),count("CANCELLED"),count("NO_SHOW"),
    prisma.appointment.findMany({
      where:{companyId,...professionalScope,startsAt:{gte:new Date()},status:{not:"CANCELLED"}},
      orderBy:{startsAt:"asc"},
      take:6,
      include:{patient:true,professional:{include:{specialty:true}}}
    }),
    financeVisible
      ? prisma.appointment.findMany({
          where:{companyId,...professionalScope,startsAt:{gte:monthStart,lt:nextMonth},status:{not:"CANCELLED"}},
          select:{finalAmountCents:true,paymentStatus:true,careType:true}
        })
      : Promise.resolve([])
  ]);

  const monthExpected=financialAppointments.reduce((s,a)=>s+a.finalAmountCents,0);
  const monthReceived=financialAppointments.filter(a=>a.paymentStatus==="PAID").reduce((s,a)=>s+a.finalAmountCents,0);
  const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);

  return <div>
    <div className="page-header">
      <div><span className="eyebrow">Visão geral</span><h1>Olá, {user.name}</h1><p>{user.role==="PROFESSIONAL"?"Acompanhe sua agenda e seus atendimentos.":"Acompanhe a operação da clínica."}</p></div>
      <a className="btn btn-primary" href="/agenda">Nova consulta</a>
    </div>
    <div className="stats-grid">
      <StatCard label="Consultas hoje" value={today}/>
      <StatCard label="Confirmadas" value={confirmed}/>
      <StatCard label="Aguardando" value={arrived}/>
      <StatCard label="Em atendimento" value={inProgress}/>
      <StatCard label="Finalizadas" value={completed}/>
      <StatCard label="Canceladas" value={cancelled}/>
      <StatCard label="Faltas" value={noShow}/>
      <StatCard label="Pacientes" value={patients} detail={user.role==="PROFESSIONAL"?"vinculados aos seus atendimentos":`${professionals} profissionais ativos`}/>
    </div>
    {financeVisible&&<section className="card section-card"><div className="section-title"><div><h2>{user.role==="PROFESSIONAL"?"Meu resumo financeiro":"Resumo financeiro do mês"}</h2><p>Valores administrativos das consultas.</p></div><a href="/financeiro" className="btn btn-secondary">Ver financeiro</a></div><div className="finance-split"><div><span>Previsto</span><strong>{money(monthExpected)}</strong></div><div><span>Recebido</span><strong>{money(monthReceived)}</strong></div><div><span>Pendente</span><strong>{money(Math.max(0,monthExpected-monthReceived))}</strong></div></div></section>}
    <section className="card section-card">
      <h2>Próximos atendimentos</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Data</th><th>Paciente</th><th>Profissional</th><th>Especialidade</th><th>Status</th></tr></thead>
        <tbody>{upcoming.map(a=><tr key={a.id}>
          <td>{formatDateTime(a.startsAt)}</td><td>{a.patient.name}</td><td>{a.professional.name}</td>
          <td>{a.professional.specialty?.name??"—"}</td><td><StatusBadge status={a.status}/></td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}
