import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { addClinicalNoteAction,finishConsultationAction,saveConsultationAction } from "@/modules/attendance/actions";

export default async function Page({params,searchParams}:{params:Promise<{appointmentId:string}>,searchParams:Promise<Record<string,string|undefined>>}) {
  const {appointmentId}=await params; const query=await searchParams; const {user,companyId}=await requireCompany();
  if(!["OWNER","PROFESSIONAL"].includes(user.role)) redirect("/atendimentos?erro=permissao");
  const a=await prisma.appointment.findFirst({
    where:{id:appointmentId,companyId,...(user.role==="PROFESSIONAL"?{professionalId:user.professional?.id||"__none__"}:{})},
    include:{patient:true,professional:{include:{specialty:true}},consultation:{include:{notes:{orderBy:{createdAt:"desc"}}}},clinicalDocuments:{orderBy:{issuedAt:"desc"}}}
  });
  if(!a) notFound(); const c=a.consultation;
  return <div>
    <div className="page-header"><div><span className="eyebrow">Atendimento clínico</span><h1>{a.patient.name}</h1><p>{a.professional.name} · {a.professional.specialty?.name??"Atendimento"}</p></div><div className="header-actions"><StatusBadge status={a.status}/><Link href="/atendimentos" className="btn btn-secondary">Voltar</Link></div></div>
    {query.erro&&<div className="alert alert-error">Revise os dados do atendimento.</div>}
    <div className="attendance-meta card"><div><span>Consulta</span><strong>{formatDateTime(a.startsAt)}</strong></div><div><span>Motivo</span><strong>{a.reason??"Não informado"}</strong></div><div><span>Status</span><strong>{a.status}</strong></div></div>
    <form action={saveConsultationAction} className="card section-card attendance-form">
      <input type="hidden" name="appointmentId" value={a.id}/>
      <label>Queixa principal<textarea name="complaint" rows={4} defaultValue={c?.complaint??""}/></label>
      <label>Evolução / anotações<textarea name="evolution" rows={7} defaultValue={c?.evolution??""}/></label>
      <label>Conduta<textarea name="conduct" rows={5} defaultValue={c?.conduct??""}/></label>
      <div className="form-grid"><label>Retorno recomendado<input name="returnDate" type="date" defaultValue={c?.returnDate?c.returnDate.toISOString().slice(0,10):""}/></label><label>Observação do retorno<input name="returnNotes" defaultValue={c?.returnNotes??""}/></label></div>
      <button className="btn btn-primary">Salvar atendimento</button>
    </form>
    <section className="card section-card"><h2>Anotações clínicas adicionais</h2><form action={addClinicalNoteAction} className="clinical-note-form"><input type="hidden" name="appointmentId" value={a.id}/><textarea name="content" rows={3} required/><button className="btn btn-secondary">Adicionar anotação</button></form><div className="clinical-note-list">{c?.notes.map(n=><article key={n.id}><small>{formatDateTime(n.createdAt)}</small><p>{n.content}</p></article>)}{!c?.notes.length&&<div className="empty-state">Nenhuma anotação adicional.</div>}</div></section>
    <section className="card section-card"><div className="section-title"><div><h2>Documentos do atendimento</h2><p>Emita documentos vinculados a esta consulta.</p></div><Link href={`/atendimentos/${a.id}/documentos/novo`} className="btn btn-primary">Novo documento</Link></div><div className="document-action-grid"><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=PRESCRIPTION`} className="document-action-card"><strong>Receita simples</strong><span>Medicamentos sem receituário especial</span></Link><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=EXAM_REQUEST`} className="document-action-card"><strong>Pedido de exame</strong><span>Solicitações e orientações</span></Link><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=MEDICAL_CERTIFICATE`} className="document-action-card"><strong>Atestado</strong><span>Documento de afastamento</span></Link><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=ATTENDANCE_DECLARATION`} className="document-action-card"><strong>Declaração</strong><span>Comparecimento ao atendimento</span></Link></div><div className="document-list">{a.clinicalDocuments.map(d=><Link key={d.id} href={`/documentos/${d.id}`}><span>{d.title}</span><small>{new Intl.DateTimeFormat("pt-BR").format(d.issuedAt)}</small></Link>)}{a.clinicalDocuments.length===0&&<div className="empty-state">Nenhum documento emitido nesta consulta.</div>}</div></section>
    {a.status!=="COMPLETED"&&<section className="card section-card finish-card"><div><h2>Finalizar consulta</h2><p>O atendimento passará para concluído e entrará no histórico.</p></div><form action={finishConsultationAction}><input type="hidden" name="appointmentId" value={a.id}/><button className="btn btn-primary">Finalizar atendimento</button></form></section>}
  </div>;
}
