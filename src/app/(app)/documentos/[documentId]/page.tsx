import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";
import { documentLabels } from "@/modules/documents/types";
import { deleteClinicalDocumentAction } from "@/modules/documents/actions";

export default async function Page({params}:{params:Promise<{documentId:string}>}) {
  const {documentId}=await params;
  const {user,companyId}=await requireCompany();
  if(!["OWNER","PROFESSIONAL"].includes(user.role)) redirect("/dashboard");

  const d=await prisma.clinicalDocument.findFirst({
    where:{
      id:documentId,
      companyId,
      ...(user.role==="PROFESSIONAL"?{professionalId:user.professional?.id||"__none__"}:{})
    },
    include:{company:true,patient:true,professional:{include:{specialty:true}},appointment:true}
  });
  if(!d) notFound();

  const date=new Intl.DateTimeFormat("pt-BR",{dateStyle:"long"}).format(d.issuedAt);
  const clinicName=d.company.publicName??d.company.name;

  return <div className="document-screen">
    <div className="document-toolbar no-print">
      <Link href={`/atendimentos/${d.appointmentId}`} className="btn btn-secondary">Voltar ao atendimento</Link>
      <PrintButton/>
      <form action={deleteClinicalDocumentAction}><input type="hidden" name="documentId" value={d.id}/><button className="btn btn-secondary">Excluir</button></form>
    </div>

    <article className="clinical-document-paper" style={{"--clinic-accent":d.company.accentColor??"#2563eb"} as React.CSSProperties}>
      <header className="clinical-document-header">
        <div>
          {d.company.logoUrl
            ? <img className="clinical-document-logo" src={d.company.logoUrl} alt={`Logo ${clinicName}`}/>
            : <div className="brand">Clyra<span>Health</span></div>}
          <strong>{clinicName}</strong>
          <small>{[d.company.address,d.company.city,d.company.state].filter(Boolean).join(" · ")}</small>
          <small>{[d.company.phone,d.company.email].filter(Boolean).join(" · ")}</small>
        </div>
        <div className="document-number">Documento<br/><strong>#{d.id.slice(-8).toUpperCase()}</strong></div>
      </header>

      <div className="document-heading"><span>{documentLabels[d.type]}</span><h1>{d.title}</h1></div>
      <dl className="document-patient"><div><dt>Paciente</dt><dd>{d.patient.name}</dd></div><div><dt>Data</dt><dd>{date}</dd></div></dl>
      <section className="document-body"><p>{d.body}</p>{d.instructions&&<><h3>Orientações</h3><p>{d.instructions}</p></>}{d.notes&&<><h3>Observações</h3><p>{d.notes}</p></>}</section>

      <footer className="clinical-document-footer">
        <div className="signature-line"></div>
        <small>Profissional emitente</small>
        <strong>{d.professional.name}</strong>
        <span>{d.professional.specialty?.name??"Profissional da saúde"}</span>
        <span>{[d.professional.council,d.professional.registrationNumber].filter(Boolean).join(" ")}</span>
      </footer>
    </article>
  </div>;
}
