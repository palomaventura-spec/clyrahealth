import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { createClinicalDocumentAction } from "@/modules/documents/actions";
import { documentLabels, ClinicalDocumentTypeValue } from "@/modules/documents/types";

const config: Record<ClinicalDocumentTypeValue, { title:string; bodyLabel:string; bodyPlaceholder:string; instructionsLabel:string; instructionsPlaceholder:string }> = {
  PRESCRIPTION: { title:"Receita simples", bodyLabel:"Medicamento(s)", bodyPlaceholder:"Ex.: Paracetamol 500 mg", instructionsLabel:"Posologia / orientações", instructionsPlaceholder:"Ex.: Tomar 1 comprimido a cada 8 horas por 3 dias." },
  EXAM_REQUEST: { title:"Pedido de exame", bodyLabel:"Exames solicitados", bodyPlaceholder:"Ex.: Hemograma completo\nGlicemia de jejum\nTSH", instructionsLabel:"Justificativa / indicação clínica", instructionsPlaceholder:"Opcional" },
  MEDICAL_CERTIFICATE: { title:"Atestado", bodyLabel:"Texto do atestado", bodyPlaceholder:"Atesto, para os devidos fins, que o(a) paciente necessita...", instructionsLabel:"Período / orientações", instructionsPlaceholder:"Ex.: Afastamento por 2 dias." },
  ATTENDANCE_DECLARATION: { title:"Declaração de comparecimento", bodyLabel:"Texto da declaração", bodyPlaceholder:"Declaro que o(a) paciente compareceu a atendimento nesta data.", instructionsLabel:"Horário / observações", instructionsPlaceholder:"Ex.: Das 14h às 15h." }
};

export default async function Page({ params, searchParams }:{ params:Promise<{appointmentId:string}>, searchParams:Promise<Record<string,string|undefined>> }) {
  const { appointmentId } = await params; const q = await searchParams; const { user, companyId } = await requireCompany();
  if (!["OWNER","PROFESSIONAL"].includes(user.role)) redirect("/atendimentos?erro=permissao");
  const appointment = await prisma.appointment.findFirst({ where:{id:appointmentId,companyId,...(user.role==="PROFESSIONAL"?{professionalId:user.professional?.id||"__none__"}:{})}, include:{patient:true,professional:{include:{specialty:true}}} });
  if(!appointment) notFound();
  const raw=(q.tipo || "PRESCRIPTION") as ClinicalDocumentTypeValue; const type:ClinicalDocumentTypeValue = raw in config ? raw : "PRESCRIPTION"; const c=config[type];
  return <div>
    <div className="page-header"><div><span className="eyebrow">Documento clínico</span><h1>{c.title}</h1><p>{appointment.patient.name} · {appointment.professional.name}</p></div><Link href={`/atendimentos/${appointment.id}`} className="btn btn-secondary">Voltar</Link></div>
    {q.erro&&<div className="alert alert-error">Revise os campos obrigatórios.</div>}
    <div className="document-type-tabs">
      {Object.entries(documentLabels).map(([key,label])=><Link key={key} className={`document-type-tab ${key===type?"active":""}`} href={`/atendimentos/${appointment.id}/documentos/novo?tipo=${key}`}>{label}</Link>)}
    </div>
    <form action={createClinicalDocumentAction} className="card section-card document-form">
      <input type="hidden" name="appointmentId" value={appointment.id}/><input type="hidden" name="type" value={type}/>
      <label>Título<input name="title" defaultValue={c.title} required/></label>
      <label>{c.bodyLabel}<textarea name="body" rows={8} placeholder={c.bodyPlaceholder} required/></label>
      <label>{c.instructionsLabel}<textarea name="instructions" rows={5} placeholder={c.instructionsPlaceholder}/></label>
      <label>Observações internas/opcionais<textarea name="notes" rows={3}/></label>
      <div className="document-warning">O ClyraHealth v0.3.0 destina esta receita a prescrições simples. Não use este fluxo para medicamentos que exijam receituário especial ou retenção conforme a regulamentação aplicável.</div>
      <button className="btn btn-primary">Emitir documento</button>
    </form>
  </div>;
}
