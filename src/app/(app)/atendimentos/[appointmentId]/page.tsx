import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { addClinicalNoteAction,saveConsultationAction } from "@/modules/attendance/actions";
import { builtinProtocols,getBuiltinProtocol } from "@/modules/protocols/builtins";

export default async function Page({params,searchParams}:{params:Promise<{appointmentId:string}>,searchParams:Promise<Record<string,string|undefined>>}) {
  const {appointmentId}=await params; const query=await searchParams; const {user,companyId}=await requireCompany();
  if(!user.professional?.id) redirect("/atendimentos?erro=permissao");
  const a=await prisma.appointment.findFirst({
    where:{id:appointmentId,companyId,professionalId:user.professional.id},
    include:{patient:true,professional:{include:{specialty:true}},consultation:{include:{notes:{orderBy:{createdAt:"desc"}}}},clinicalDocuments:{orderBy:{issuedAt:"desc"}}}
  });
  if(!a) notFound(); const c=a.consultation;
  const customProtocols=await prisma.protocolTemplate.findMany({where:{companyId,active:true},orderBy:{name:"asc"}});
  const builtin=getBuiltinProtocol(query.protocol);
  const custom=query.customProtocol?customProtocols.find(p=>p.id===query.customProtocol):undefined;
  const template=builtin??custom;
  return <div>
    <div className="page-header"><div><span className="eyebrow">Atendimento clínico</span><h1>{a.patient.name}</h1><p>{a.professional.name} · {a.professional.specialty?.name??"Atendimento"}</p></div><div className="header-actions"><StatusBadge status={a.status}/><Link href="/atendimentos" className="btn btn-secondary">Voltar</Link></div></div>
    {query.erro&&<div className="alert alert-error">Revise os dados do atendimento.</div>}
    {query.sucesso==="rascunho"&&<div className="alert alert-success">✓ Rascunho salvo. Você pode continuar o atendimento depois.</div>}
    <div className="attendance-meta card"><div><span>Consulta</span><strong>{formatDateTime(a.startsAt)}</strong></div><div><span>Motivo</span><strong>{a.reason??"Não informado"}</strong></div><div><span>Status</span><strong>{a.status}</strong></div></div>
    <section className="card section-card"><div className="section-title"><div><h2>Protocolos / modelos</h2><p>Carregue uma estrutura pronta. Revise e adapte todo o conteúdo antes de salvar.</p></div></div><div className="protocol-picker">{builtinProtocols.map(p=><Link key={p.id} href={`/atendimentos/${a.id}?protocol=${p.id}`} className="btn btn-small btn-secondary">{p.name}</Link>)}{customProtocols.map(p=><Link key={p.id} href={`/atendimentos/${a.id}?customProtocol=${p.id}`} className="btn btn-small btn-secondary">{p.name}</Link>)}<Link href="/protocolos" className="btn btn-small btn-primary">Gerenciar protocolos</Link></div>{template&&<div className="alert alert-success">Modelo carregado: <strong>{template.name}</strong>. O conteúdo abaixo ainda não foi salvo.</div>}</section>
    <form action={saveConsultationAction} className="card section-card attendance-form">
      <input type="hidden" name="appointmentId" value={a.id}/>
      <label>Queixa principal<textarea name="complaint" rows={3} defaultValue={c?.complaint??template?.complaint??""}/></label>
      <label>Anamnese<textarea name="anamnesis" rows={6} defaultValue={c?.anamnesis??template?.anamnesis??""}/></label>
      <label>Exame físico / avaliação objetiva<textarea name="examination" rows={5} defaultValue={c?.examination??template?.examination??""}/></label>
      <label>Avaliação clínica / hipótese<textarea name="assessment" rows={4} defaultValue={c?.assessment??template?.assessment??""}/></label>
      <label>Evolução<textarea name="evolution" rows={6} defaultValue={c?.evolution??template?.evolution??""}/></label>
      <label>Conduta<textarea name="conduct" rows={5} defaultValue={c?.conduct??template?.conduct??""}/></label>
      <div className="form-grid"><label>Retorno recomendado<input name="returnDate" type="date" defaultValue={c?.returnDate?c.returnDate.toISOString().slice(0,10):""}/></label><label>Observação do retorno<input name="returnNotes" defaultValue={c?.returnNotes??template?.returnNotes??""}/></label></div>
      <div className="header-actions"><button className="btn btn-secondary" type="submit" name="intent" value="draft">Salvar rascunho</button>{a.status!=="COMPLETED"&&<button className="btn btn-primary" type="submit" name="intent" value="finish">Salvar e finalizar atendimento</button>}</div>
    </form>
    <section className="card section-card"><h2>Anotações clínicas adicionais</h2><form action={addClinicalNoteAction} className="clinical-note-form"><input type="hidden" name="appointmentId" value={a.id}/><textarea name="content" rows={3} required/><button className="btn btn-secondary">Adicionar anotação</button></form><div className="clinical-note-list">{c?.notes.map(n=><article key={n.id}><small>{formatDateTime(n.createdAt)}</small><p>{n.content}</p></article>)}{!c?.notes.length&&<div className="empty-state">Nenhuma anotação adicional.</div>}</div></section>
    <section className="card section-card"><div className="section-title"><div><h2>Documentos do atendimento</h2><p>Emita documentos vinculados a esta consulta.</p></div><Link href={`/atendimentos/${a.id}/documentos/novo`} className="btn btn-primary">Novo documento</Link></div><div className="document-action-grid"><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=PRESCRIPTION`} className="document-action-card"><strong>Receita simples</strong><span>Medicamentos sem receituário especial</span></Link><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=EXAM_REQUEST`} className="document-action-card"><strong>Pedido de exame</strong><span>Solicitações e orientações</span></Link><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=MEDICAL_CERTIFICATE`} className="document-action-card"><strong>Atestado</strong><span>Documento de afastamento</span></Link><Link href={`/atendimentos/${a.id}/documentos/novo?tipo=ATTENDANCE_DECLARATION`} className="document-action-card"><strong>Declaração</strong><span>Comparecimento ao atendimento</span></Link></div><div className="document-list">{a.clinicalDocuments.map(d=><Link key={d.id} href={`/documentos/${d.id}`}><span>{d.title}</span><small>{new Intl.DateTimeFormat("pt-BR").format(d.issuedAt)}</small></Link>)}{a.clinicalDocuments.length===0&&<div className="empty-state">Nenhum documento emitido nesta consulta.</div>}</div></section>
    
  </div>;
}
