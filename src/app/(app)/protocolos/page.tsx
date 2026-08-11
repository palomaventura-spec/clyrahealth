import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { builtinProtocols, protocolMatchesSpecialties } from "@/modules/protocols/builtins";
import { createProtocolAction,deleteProtocolAction } from "@/modules/protocols/actions";

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams;
 const {user,companyId}=await requireCompany();

 const [custom, professionals] = await Promise.all([
   prisma.protocolTemplate.findMany({where:{companyId,active:true},orderBy:{name:"asc"}}),
   prisma.professional.findMany({
     where:{companyId,active:true},
     include:{specialty:true},
     orderBy:{name:"asc"}
   })
 ]);

 const ownProfessional = user.professional?.id
   ? professionals.find(p=>p.id===user.professional?.id)
   : undefined;

 const relevantSpecialties =
   user.role==="PROFESSIONAL"
     ? [ownProfessional?.specialty?.name]
     : professionals.map(p=>p.specialty?.name);

 const visibleBuiltins = builtinProtocols.filter(protocol =>
   protocolMatchesSpecialties(protocol,relevantSpecialties)
 );

 const normalizedRelevant = relevantSpecialties
   .filter((v):v is string=>Boolean(v))
   .map(v=>v.toLocaleLowerCase("pt-BR"));

 const visibleCustom = user.role==="PROFESSIONAL"
   ? custom.filter(protocol =>
       !protocol.specialty ||
       normalizedRelevant.some(s =>
         s.includes(protocol.specialty!.toLocaleLowerCase("pt-BR")) ||
         protocol.specialty!.toLocaleLowerCase("pt-BR").includes(s)
       )
     )
   : custom;

 const specialtySummary = relevantSpecialties.filter((v):v is string=>Boolean(v));

 return <div>
  <div className="page-header"><div><span className="eyebrow">Clínica</span><h1>Protocolos de atendimento</h1><p>Os modelos são exibidos conforme as especialidades ativas {user.role==="PROFESSIONAL"?"do seu perfil profissional":"da clínica"}. Modelos gerais continuam disponíveis para todos.</p></div></div>

  {specialtySummary.length>0&&<div className="protocol-specialty-summary"><strong>Especialidades consideradas:</strong> {[...new Set(specialtySummary)].join(" · ")}</div>}
  {q.sucesso&&<div className="alert alert-success">✓ Protocolo criado.</div>}

  <section className="card section-card">
    <div className="section-title"><div><h2>{user.role==="PROFESSIONAL"?"Modelos recomendados para você":"Modelos ClyraHealth"}</h2><p>Templates compatíveis com as especialidades cadastradas.</p></div></div>
    <div className="cards-grid">
      {visibleBuiltins.map(p=><article className="professional-card card" key={p.id}><span className="eyebrow">{p.specialty??"Geral"}</span><h3>{p.name}</h3><p>{p.description}</p></article>)}
      {!visibleBuiltins.length&&<div className="empty-state">Ainda não há modelos ClyraHealth específicos para estas especialidades. Os protocolos personalizados continuam disponíveis.</div>}
    </div>
  </section>

  <section className="card section-card"><h2>Protocolos da clínica</h2><div className="cards-grid">
    {visibleCustom.map(p=><article className="professional-card card" key={p.id}><span className="eyebrow">{p.specialty??"Personalizado"}</span><h3>{p.name}</h3><p>{p.description??"Modelo personalizado."}</p>{["OWNER","ADMIN"].includes(user.role)&&<form action={deleteProtocolAction}><input type="hidden" name="id" value={p.id}/><button className="btn btn-small btn-secondary">Excluir</button></form>}</article>)}
    {!visibleCustom.length&&<div className="empty-state">Nenhum protocolo personalizado compatível criado ainda.</div>}
  </div></section>

  <section className="card section-card"><h2>Criar protocolo personalizado</h2><form action={createProtocolAction} className="form-grid">
   <label>Nome<input name="name" required placeholder="Ex.: Primeira consulta pediátrica"/></label>
   <label>Especialidade<select name="specialty" defaultValue={user.role==="PROFESSIONAL"?(ownProfessional?.specialty?.name??""):""}><option value="">Geral / todas</option>{[...new Set(professionals.map(p=>p.specialty?.name).filter((v):v is string=>Boolean(v)))].map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="span-2">Descrição<input name="description"/></label>
   <label className="span-2">Queixa principal / estrutura<textarea name="complaint" rows={2}/></label><label className="span-2">Anamnese<textarea name="anamnesis" rows={5}/></label>
   <label className="span-2">Exame / avaliação objetiva<textarea name="examination" rows={4}/></label><label className="span-2">Avaliação clínica<textarea name="assessment" rows={3}/></label>
   <label className="span-2">Evolução<textarea name="evolution" rows={3}/></label><label className="span-2">Conduta<textarea name="conduct" rows={4}/></label><label className="span-2">Retorno<textarea name="returnNotes" rows={2}/></label>
   <button className="btn btn-primary span-2">Salvar protocolo</button>
  </form></section>
 </div>;
}