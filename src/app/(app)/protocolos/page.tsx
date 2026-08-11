import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { builtinProtocols } from "@/modules/protocols/builtins";
import { createProtocolAction,deleteProtocolAction } from "@/modules/protocols/actions";

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams; const {user,companyId}=await requireCompany();
 const custom=await prisma.protocolTemplate.findMany({where:{companyId,active:true},orderBy:{name:"asc"}});
 return <div>
  <div className="page-header"><div><span className="eyebrow">Clínica</span><h1>Protocolos de atendimento</h1><p>Use modelos prontos ou crie rotinas próprias da clínica. O protocolo é um template de organização e não substitui a avaliação profissional.</p></div></div>
  {q.sucesso&&<div className="alert alert-success">✓ Protocolo criado.</div>}
  <section className="card section-card"><h2>Modelos ClyraHealth</h2><div className="cards-grid">{builtinProtocols.map(p=><article className="professional-card card" key={p.id}><span className="eyebrow">{p.specialty??"Geral"}</span><h3>{p.name}</h3><p>{p.description}</p></article>)}</div></section>
  <section className="card section-card"><h2>Protocolos da clínica</h2><div className="cards-grid">{custom.map(p=><article className="professional-card card" key={p.id}><span className="eyebrow">{p.specialty??"Personalizado"}</span><h3>{p.name}</h3><p>{p.description??"Modelo personalizado."}</p>{["OWNER","ADMIN"].includes(user.role)&&<form action={deleteProtocolAction}><input type="hidden" name="id" value={p.id}/><button className="btn btn-small btn-secondary">Excluir</button></form>}</article>)}{!custom.length&&<div className="empty-state">Nenhum protocolo personalizado criado ainda.</div>}</div></section>
  <section className="card section-card"><h2>Criar protocolo personalizado</h2><form action={createProtocolAction} className="form-grid">
   <label>Nome<input name="name" required placeholder="Ex.: Primeira consulta pediátrica"/></label><label>Especialidade<input name="specialty" placeholder="Ex.: Pediatria"/></label>
   <label className="span-2">Descrição<input name="description"/></label>
   <label className="span-2">Queixa principal / estrutura<textarea name="complaint" rows={2}/></label><label className="span-2">Anamnese<textarea name="anamnesis" rows={5}/></label>
   <label className="span-2">Exame / avaliação objetiva<textarea name="examination" rows={4}/></label><label className="span-2">Avaliação clínica<textarea name="assessment" rows={3}/></label>
   <label className="span-2">Evolução<textarea name="evolution" rows={3}/></label><label className="span-2">Conduta<textarea name="conduct" rows={4}/></label><label className="span-2">Retorno<textarea name="returnNotes" rows={2}/></label>
   <button className="btn btn-primary span-2">Salvar protocolo</button>
  </form></section>
 </div>;
}