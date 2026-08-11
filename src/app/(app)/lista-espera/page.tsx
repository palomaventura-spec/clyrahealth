import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { createWaitlistEntryAction,updateWaitlistStatusAction,deleteWaitlistEntryAction } from "@/modules/waitlist/actions";

const periodLabel=(v:string|null)=>({MORNING:"Manhã",AFTERNOON:"Tarde",EVENING:"Noite",ANY:"Qualquer"}[v??"ANY"]??v??"Qualquer");
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams; const {user,companyId}=await requireCompany();
 const professionalId=user.role==="PROFESSIONAL"?user.professional?.id:undefined;
 const [entries,patients,professionals]=await Promise.all([
  prisma.waitlistEntry.findMany({where:{companyId,status:"WAITING",...(professionalId?{OR:[{professionalId},{professionalId:null}]}:{})},include:{patient:true,professional:true},orderBy:[{priority:"asc"},{createdAt:"asc"}]}),
  prisma.patient.findMany({where:{companyId},orderBy:{name:"asc"}}),
  prisma.professional.findMany({where:{companyId,active:true},orderBy:{name:"asc"}})
 ]);
 return <div>
  <div className="page-header"><div><span className="eyebrow">Agenda</span><h1>Lista de espera e encaixes</h1><p>Organize pacientes que desejam antecipar ou encontrar um horário compatível.</p></div></div>
  {q.sucesso&&<div className="alert alert-success">✓ Paciente incluído na lista de espera.</div>}
  <section className="card section-card"><h2>Novo paciente na lista</h2><form action={createWaitlistEntryAction} className="form-grid">
   <label>Paciente<select name="patientId" required><option value="">Selecione</option>{patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   {user.role==="PROFESSIONAL"&&user.professional?<><input type="hidden" name="professionalId" value={user.professional.id}/><label>Profissional<input value={user.professional.name} disabled/></label></>:<label>Profissional preferido<select name="professionalId"><option value="">Qualquer profissional</option>{professionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
   <label>Especialidade<input name="specialty" placeholder="Opcional"/></label><label>Dias preferidos<input name="preferredDays" placeholder="Ex.: segunda, quarta e sexta"/></label>
   <label>Turno<select name="preferredPeriod" defaultValue="ANY"><option value="ANY">Qualquer</option><option value="MORNING">Manhã</option><option value="AFTERNOON">Tarde</option><option value="EVENING">Noite</option></select></label>
   <label>Prioridade<select name="priority" defaultValue="NORMAL"><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="LOW">Baixa</option></select></label>
   <label className="span-2">Observação administrativa<textarea name="notes" rows={2}/></label><button className="btn btn-primary span-2">Adicionar à lista</button>
  </form></section>
  <section className="card section-card"><h2>Aguardando encaixe</h2><div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Preferência</th><th>Turno</th><th>Prioridade</th><th>Ações</th></tr></thead><tbody>
   {entries.map(e=><tr key={e.id}><td><strong>{e.patient.name}</strong><br/><small>{e.patient.phone??""}</small></td><td>{e.professional?.name??e.specialty??"Qualquer profissional"}<br/><small>{e.preferredDays??"Qualquer dia"}</small></td><td>{periodLabel(e.preferredPeriod)}</td><td>{e.priority}</td><td><div className="table-actions"><form action={updateWaitlistStatusAction}><input type="hidden" name="id" value={e.id}/><input type="hidden" name="status" value="CONTACTED"/><button className="btn btn-small btn-secondary">Marcar contato</button></form><form action={updateWaitlistStatusAction}><input type="hidden" name="id" value={e.id}/><input type="hidden" name="status" value="SCHEDULED"/><button className="btn btn-small btn-primary">Resolvido</button></form>{["OWNER","ADMIN","RECEPTIONIST"].includes(user.role)&&<form action={deleteWaitlistEntryAction}><input type="hidden" name="id" value={e.id}/><button className="btn btn-small btn-secondary">Remover</button></form>}</div></td></tr>)}
   {!entries.length&&<tr><td colSpan={5}>Nenhum paciente aguardando encaixe.</td></tr>}
  </tbody></table></div></section>
 </div>;
}