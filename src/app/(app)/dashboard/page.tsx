import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";

const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);

function parsePeriod(period:string|undefined){
  const end=new Date(); end.setHours(23,59,59,999);
  const start=new Date(end);
  if(period==="7") start.setDate(end.getDate()-6);
  else if(period==="30") start.setDate(end.getDate()-29);
  else { start.setDate(1); start.setHours(0,0,0,0); }
  return {start,end};
}

function configuredCapacity(
  professionals:Array<{appointmentDuration:number;availabilities:Array<{weekday:number;startTime:string;endTime:string}>}>,
  start:Date,end:Date
){
  let slots=0;
  const cursor=new Date(start); cursor.setHours(12,0,0,0);
  const last=new Date(end); last.setHours(12,0,0,0);
  while(cursor<=last){
    const weekday=cursor.getDay();
    for(const p of professionals){
      for(const a of p.availabilities.filter(x=>x.weekday===weekday)){
        const [sh,sm]=a.startTime.split(":").map(Number);
        const [eh,em]=a.endTime.split(":").map(Number);
        const minutes=(eh*60+em)-(sh*60+sm);
        if(minutes>0&&p.appointmentDuration>0) slots+=Math.floor(minutes/p.appointmentDuration);
      }
    }
    cursor.setDate(cursor.getDate()+1);
  }
  return slots;
}

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;
  const {user,companyId}=await requireCompany();
  if(!user.company?.onboardingCompleted){const {redirect}=await import("next/navigation");redirect("/onboarding")}

  const period=q.period??"month";
  const {start,end}=parsePeriod(period);
  const requestedProfessionalId=q.professionalId??"";
  const requestedSpecialtyId=q.specialtyId??"";

  const allProfessionals=await prisma.professional.findMany({
    where:{companyId,active:true},
    include:{specialty:true,availabilities:true},
    orderBy:{name:"asc"}
  });
  const specialties=await prisma.specialty.findMany({where:{companyId},orderBy:{name:"asc"}});

  const professionalId=user.role==="PROFESSIONAL"
    ? user.professional?.id||"__none__"
    : requestedProfessionalId||undefined;

  const eligibleProfessionals=allProfessionals.filter(p=>
    (!professionalId||p.id===professionalId)&&
    (!requestedSpecialtyId||p.specialtyId===requestedSpecialtyId)
  );
  const eligibleIds=eligibleProfessionals.map(p=>p.id);

  const where:any={
    companyId,
    startsAt:{gte:start,lte:end},
    ...(eligibleIds.length?{professionalId:{in:eligibleIds}}:{professionalId:"__none__"})
  };

  const appointments=await prisma.appointment.findMany({
    where,
    include:{patient:true,professional:{include:{specialty:true}}},
    orderBy:{startsAt:"desc"}
  });

  const active=appointments.filter(a=>a.status!=="CANCELLED");
  const statusCount=(status:string)=>appointments.filter(a=>a.status===status).length;
  const patientIds=[...new Set(active.map(a=>a.patientId))];
  const prior=patientIds.length?await prisma.appointment.findMany({
    where:{companyId,patientId:{in:patientIds},startsAt:{lt:start}},
    select:{patientId:true}
  }):[];
  const priorSet=new Set(prior.map(x=>x.patientId));
  const newPatients=patientIds.filter(id=>!priorSet.has(id)).length;
  const recurrentPatients=patientIds.length-newPatients;

  const expected=active.reduce((s,a)=>s+a.finalAmountCents,0);
  const received=active.filter(a=>a.paymentStatus==="PAID").reduce((s,a)=>s+a.finalAmountCents,0);
  const pending=Math.max(0,expected-received);
  const completed=active.filter(a=>a.status==="COMPLETED");
  const ticket=completed.length?Math.round(completed.reduce((s,a)=>s+a.finalAmountCents,0)/completed.length):0;
  const noShow=statusCount("NO_SHOW");
  const cancelled=statusCount("CANCELLED");
  const denominator=active.length+cancelled;
  const noShowRate=denominator?Math.round(noShow/denominator*100):0;
  const cancelRate=denominator?Math.round(cancelled/denominator*100):0;
  const capacity=configuredCapacity(eligibleProfessionals,start,end);
  const occupancy=capacity?Math.min(100,Math.round(active.length/capacity*100)):0;

  const byProfessional=Object.values(active.reduce((acc:any,a)=>{
    const key=a.professionalId;
    acc[key]??={name:a.professional.name,specialty:a.professional.specialty?.name??"—",appointments:0,completed:0,received:0,noShow:0};
    acc[key].appointments++;
    if(a.status==="COMPLETED")acc[key].completed++;
    if(a.status==="NO_SHOW")acc[key].noShow++;
    if(a.paymentStatus==="PAID")acc[key].received+=a.finalAmountCents;
    return acc;
  },{}));

  const byCare={
    private:active.filter(a=>a.careType==="PRIVATE").length,
    insurance:active.filter(a=>a.careType==="INSURANCE").length
  };

  const upcoming=await prisma.appointment.findMany({
    where:{companyId,...(user.role==="PROFESSIONAL"?{professionalId:user.professional?.id||"__none__"}:{}),startsAt:{gte:new Date()},status:{not:"CANCELLED"}},
    orderBy:{startsAt:"asc"},take:6,
    include:{patient:true,professional:{include:{specialty:true}}}
  });

  return <div>
    <div className="page-header">
      <div><span className="eyebrow">Gestão avançada</span><h1>Olá, {user.name}</h1><p>{user.role==="PROFESSIONAL"?"Indicadores da sua agenda e dos seus atendimentos.":"Indicadores operacionais e financeiros da clínica."}</p></div>
      <div className="header-actions"><Link className="btn btn-primary" href="/agenda">Nova consulta</Link>{user.receptionFinanceAccess!=="NONE"&&user.role==="RECEPTIONIST"&&<Link className="btn btn-secondary" href="/financeiro">Caixa do dia</Link>}</div>
    </div>

    <section className="card section-card">
      <form className="dashboard-filters" method="get">
        <label>Período<select name="period" defaultValue={period}><option value="month">Mês atual</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select></label>
        {user.role!=="PROFESSIONAL"&&<label>Profissional<select name="professionalId" defaultValue={requestedProfessionalId}><option value="">Todos</option>{allProfessionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
        {user.role!=="PROFESSIONAL"&&<label>Especialidade<select name="specialtyId" defaultValue={requestedSpecialtyId}><option value="">Todas</option>{specialties.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
        <button className="btn btn-primary">Aplicar filtros</button>
      </form>
    </section>

    <div className="stats-grid">
      <StatCard label="Consultas" value={active.length}/>
      <StatCard label="Finalizadas" value={statusCount("COMPLETED")}/>
      <StatCard label="Faltas" value={`${noShowRate}%`} detail={`${noShow} ocorrência(s)`}/>
      <StatCard label="Cancelamentos" value={`${cancelRate}%`} detail={`${cancelled} ocorrência(s)`}/>
      <StatCard label="Ocupação estimada" value={`${occupancy}%`} detail={`${capacity} horários configurados`}/>
      <StatCard label="Pacientes novos" value={newPatients}/>
      <StatCard label="Recorrentes" value={recurrentPatients}/>
      <StatCard label="Ticket médio" value={money(ticket)}/>
    </div>

    {(["OWNER","ADMIN","PROFESSIONAL"].includes(user.role)||(user.role==="RECEPTIONIST"&&user.receptionFinanceAccess==="FULL"))&&<section className="card section-card">
      <div className="section-title"><div><h2>Financeiro do período</h2><p>Particular e planos de saúde.</p></div><Link href="/financeiro" className="btn btn-secondary">Abrir financeiro</Link></div>
      <div className="finance-split"><div><span>Previsto</span><strong>{money(expected)}</strong></div><div><span>Recebido</span><strong>{money(received)}</strong></div><div><span>Pendente</span><strong>{money(pending)}</strong></div><div><span>Particular / Plano</span><strong>{byCare.private} / {byCare.insurance}</strong></div></div>
    </section>}

    {user.role!=="PROFESSIONAL"&&<section className="card section-card">
      <h2>Indicadores por profissional</h2>
      <div className="table-wrap"><table><thead><tr><th>Profissional</th><th>Especialidade</th><th>Consultas</th><th>Finalizadas</th><th>Faltas</th><th>Recebido</th></tr></thead><tbody>
        {byProfessional.map((p:any)=><tr key={p.name}><td>{p.name}</td><td>{p.specialty}</td><td>{p.appointments}</td><td>{p.completed}</td><td>{p.noShow}</td><td>{money(p.received)}</td></tr>)}
        {!byProfessional.length&&<tr><td colSpan={6}>Sem dados no período selecionado.</td></tr>}
      </tbody></table></div>
    </section>}

    <section className="card section-card">
      <h2>Próximos atendimentos</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Data</th><th>Paciente</th><th>Profissional</th><th>Especialidade</th><th>Status</th></tr></thead>
        <tbody>{upcoming.map(a=><tr key={a.id}><td>{formatDateTime(a.startsAt)}</td><td>{a.patient.name}</td><td>{a.professional.name}</td><td>{a.professional.specialty?.name??"—"}</td><td><StatusBadge status={a.status}/></td></tr>)}{!upcoming.length&&<tr><td colSpan={5}>Nenhum atendimento futuro.</td></tr>}</tbody>
      </table></div>
    </section>
  </div>;
}