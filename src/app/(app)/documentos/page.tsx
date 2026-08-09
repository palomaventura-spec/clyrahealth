import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { documentLabels } from "@/modules/documents/types";
import { formatDateTime } from "@/lib/format";
export default async function Page(){
 const {user,companyId}=await requireCompany(); if(!["OWNER","PROFESSIONAL"].includes(user.role)) redirect("/dashboard");
 const docs=await prisma.clinicalDocument.findMany({where:{companyId,...(user.role==="PROFESSIONAL"?{professionalId:user.professional?.id||"__none__"}:{})},include:{patient:true},orderBy:{issuedAt:"desc"},take:100});
 return <div><div className="page-header"><div><span className="eyebrow">Documentos</span><h1>Documentos emitidos</h1><p>Receitas simples, pedidos, atestados e declarações.</p></div></div><section className="card section-card"><div className="table-wrap"><table><thead><tr><th>Data</th><th>Paciente</th><th>Tipo</th><th>Título</th><th></th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td>{formatDateTime(d.issuedAt)}</td><td>{d.patient.name}</td><td>{documentLabels[d.type]}</td><td>{d.title}</td><td><Link href={`/documentos/${d.id}`} className="btn btn-small btn-secondary">Abrir</Link></td></tr>)}{docs.length===0&&<tr><td colSpan={5}>Nenhum documento emitido.</td></tr>}</tbody></table></div></section></div>;
}
