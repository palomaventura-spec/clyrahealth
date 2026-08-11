import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { markPatientArrivedAction,startConsultationAction } from "@/modules/attendance/actions";

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params=await searchParams; const {user,companyId}=await requireCompany();
  const start=new Date(); start.setHours(0,0,0,0); const end=new Date(); end.setHours(23,59,59,999);
  const professionalFilter=user.professional?.id?user.professional.id:undefined;
  const appointments=await prisma.appointment.findMany({
    where:{companyId,startsAt:{gte:start,lte:end},...(professionalFilter?{professionalId:professionalFilter}:{})},
    include:{patient:true,professional:{include:{specialty:true}},consultation:true},orderBy:{startsAt:"asc"}
  });
  return <div>
    <div className="page-header"><div><span className="eyebrow">Operação clínica</span><h1>Atendimentos de hoje</h1><p>Controle chegada e andamento das consultas.</p></div></div>
    {params.erro==="permissao"&&<div className="alert alert-error">Apenas o profissional responsável acessa o conteúdo clínico.</div>}
    {params.sucesso==="finalizado"&&<div className="alert alert-success">Atendimento finalizado.</div>}
    <section className="card section-card"><div className="table-wrap"><table>
      <thead><tr><th>Horário</th><th>Paciente</th><th>Profissional</th><th>Status</th><th>Operação</th></tr></thead>
      <tbody>{appointments.map(a=><tr key={a.id}>
        <td>{formatDateTime(a.startsAt)}</td><td><strong>{a.patient.name}</strong><br/><small>{a.reason??""}</small></td>
        <td>{a.professional.name}<br/><small>{a.professional.specialty?.name??""}</small></td><td><StatusBadge status={a.status}/></td>
        <td><div className="table-actions">
          {["SCHEDULED","CONFIRMED"].includes(a.status)&&user.role!=="PROFESSIONAL"&&<form action={markPatientArrivedAction}><input type="hidden" name="appointmentId" value={a.id}/><button className="btn btn-small btn-secondary">Paciente chegou</button></form>}
          {user.professional?.id===a.professionalId&&["SCHEDULED","CONFIRMED","ARRIVED"].includes(a.status)&&<form action={startConsultationAction}><input type="hidden" name="appointmentId" value={a.id}/><button className="btn btn-small btn-primary">Iniciar atendimento</button></form>}
          {user.professional?.id===a.professionalId&&a.status==="IN_PROGRESS"&&<Link href={`/atendimentos/${a.id}`} className="btn btn-small btn-primary">Continuar</Link>}
          {user.professional?.id===a.professionalId&&a.status==="COMPLETED"&&<Link href={`/atendimentos/${a.id}`} className="btn btn-small btn-secondary">Revisar</Link>}
        </div></td>
      </tr>)}{appointments.length===0&&<tr><td colSpan={5}>Nenhuma consulta para hoje.</td></tr>}</tbody>
    </table></div></section>
  </div>;
}
