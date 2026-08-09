import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export default async function Page({params}:{params:Promise<{patientId:string}>}) {
  const {patientId}=await params; const {user,companyId}=await requireCompany();
  const p=await prisma.patient.findFirst({where:{id:patientId,companyId,...(user.role==="PROFESSIONAL"&&user.professional?.id?{appointments:{some:{professionalId:user.professional.id}}}:{})},include:{appointments:{include:{professional:{include:{specialty:true}},consultation:true},orderBy:{startsAt:"desc"}}}});
  if(!p) notFound(); const clinicalAccess=user.role==="PROFESSIONAL";
  return <div><div className="page-header"><div><span className="eyebrow">Paciente</span><h1>{p.name}</h1><p>{p.email??"Sem e-mail"} · {p.phone??"Sem telefone"}</p></div><Link href="/pacientes" className="btn btn-secondary">Voltar</Link></div>
  <section className="card section-card"><h2>Histórico de consultas</h2><div className="table-wrap"><table><thead><tr><th>Data</th><th>Profissional</th><th>Especialidade</th><th>Status</th><th></th></tr></thead><tbody>{p.appointments.map(a=><tr key={a.id}><td>{formatDateTime(a.startsAt)}</td><td>{a.professional.name}</td><td>{a.professional.specialty?.name??"—"}</td><td><StatusBadge status={a.status}/></td><td>{clinicalAccess&&a.professionalId===user.professional?.id&&a.consultation&&<Link href={`/atendimentos/${a.id}`} className="btn btn-small btn-secondary">Ver atendimento</Link>}</td></tr>)}</tbody></table></div></section>
  {!clinicalAccess&&<div className="alert">O histórico administrativo é visível, mas o conteúdo clínico é restrito ao profissional responsável.</div>}</div>;
}
