import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { updateAppointmentFinancialAction, markAppointmentPaidAction } from "@/modules/finance/actions";

const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const dateTime=(d:Date)=>new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(d);

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams;
 const {user,companyId}=await requireCompany();
 if(!["OWNER","ADMIN","PROFESSIONAL"].includes(user.role)){
   const {redirect}=await import("next/navigation"); redirect("/dashboard");
 }

 const now=new Date();
 const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
 const nextMonth=new Date(now.getFullYear(),now.getMonth()+1,1);
 const professionalScope=user.role==="PROFESSIONAL"&&user.professional?.id?{professionalId:user.professional.id}:{};

 const appointments=await prisma.appointment.findMany({
   where:{companyId,...professionalScope,startsAt:{gte:monthStart,lt:nextMonth},status:{not:"CANCELLED"}},
   include:{patient:true,professional:true},
   orderBy:{startsAt:"desc"}
 });

 const expected=appointments.reduce((sum,a)=>sum+a.finalAmountCents,0);
 const received=appointments.filter(a=>a.paymentStatus==="PAID").reduce((sum,a)=>sum+a.finalAmountCents,0);
 const pending=appointments.filter(a=>a.paymentStatus!=="PAID").reduce((sum,a)=>sum+a.finalAmountCents,0);
 const completed=appointments.filter(a=>a.status==="COMPLETED");
 const ticket=completed.length?Math.round(completed.reduce((s,a)=>s+a.finalAmountCents,0)/completed.length):0;
 const privateCount=appointments.filter(a=>a.careType==="PRIVATE").length;
 const insuranceCount=appointments.filter(a=>a.careType==="INSURANCE").length;

 const byProfessional=user.role==="PROFESSIONAL"?[]:Object.values(appointments.reduce((acc:any,a)=>{
   const key=a.professionalId;
   acc[key]??={name:a.professional.name,count:0,received:0,expected:0};
   acc[key].count++;
   acc[key].expected+=a.finalAmountCents;
   if(a.paymentStatus==="PAID") acc[key].received+=a.finalAmountCents;
   return acc;
 },{}));

 return <div>
  <div className="page-header"><div><span className="eyebrow">Gestão</span><h1>{user.role==="PROFESSIONAL"?"Meu financeiro":"Financeiro da clínica"}</h1><p>Valores de consultas, convênios, descontos e recebimentos do mês atual.</p></div></div>
  {q.sucesso&&<div className="alert alert-success">✓ Dados financeiros atualizados.</div>}

  <div className="stats-grid">
   <div className="card stat-card"><span>Previsto no mês</span><strong>{money(expected)}</strong></div>
   <div className="card stat-card"><span>Recebido</span><strong>{money(received)}</strong></div>
   <div className="card stat-card"><span>Pendente</span><strong>{money(pending)}</strong></div>
   <div className="card stat-card"><span>Ticket médio</span><strong>{money(ticket)}</strong></div>
  </div>

  <section className="card section-card"><div className="finance-split"><div><span>Particular</span><strong>{privateCount}</strong></div><div><span>Convênio</span><strong>{insuranceCount}</strong></div><div><span>Consultas no mês</span><strong>{appointments.length}</strong></div><div><span>Finalizadas</span><strong>{completed.length}</strong></div></div></section>

  {byProfessional.length>0&&<section className="card section-card"><h2>Por profissional</h2><div className="table-wrap"><table><thead><tr><th>Profissional</th><th>Consultas</th><th>Previsto</th><th>Recebido</th></tr></thead><tbody>{byProfessional.map((p:any)=><tr key={p.name}><td>{p.name}</td><td>{p.count}</td><td>{money(p.expected)}</td><td>{money(p.received)}</td></tr>)}</tbody></table></div></section>}

  <section className="card section-card"><h2>Consultas e pagamentos</h2><div className="table-wrap"><table><thead><tr><th>Data</th><th>Paciente</th><th>Profissional</th><th>Tipo</th><th>Valor</th><th>Pagamento</th><th>Ação</th></tr></thead><tbody>
   {appointments.map(a=><tr key={a.id}>
    <td>{dateTime(a.startsAt)}</td><td>{a.patient.name}</td><td>{a.professional.name}</td><td>{a.careType==="INSURANCE"?"Convênio":"Particular"}</td><td>{money(a.finalAmountCents)}</td><td>{a.paymentStatus==="PAID"?"Recebido":a.paymentStatus==="PARTIAL"?"Parcial":"Pendente"}</td>
    <td><details className="finance-details"><summary className="btn btn-small btn-secondary">Editar</summary><form action={updateAppointmentFinancialAction} className="finance-edit-form">
      <input type="hidden" name="id" value={a.id}/>
      <label>Atendimento<select name="careType" defaultValue={a.careType}><option value="PRIVATE">Particular</option><option value="INSURANCE">Convênio</option></select></label>
      <label>Valor bruto<input name="grossAmount" defaultValue={(a.grossAmountCents/100).toFixed(2).replace(".",",")}/></label>
      <label>Desconto<input name="discount" defaultValue={(a.discountCents/100).toFixed(2).replace(".",",")}/></label>
      <label>Status<select name="paymentStatus" defaultValue={a.paymentStatus}><option value="PENDING">Pendente</option><option value="PARTIAL">Parcial</option><option value="PAID">Recebido</option><option value="REFUNDED">Estornado</option></select></label>
      <label>Forma<select name="paymentMethod" defaultValue={a.paymentMethod??""}><option value="">Não informada</option><option value="PIX">PIX</option><option value="CASH">Dinheiro</option><option value="CREDIT_CARD">Cartão crédito</option><option value="DEBIT_CARD">Cartão débito</option><option value="TRANSFER">Transferência</option><option value="INSURANCE">Convênio</option><option value="OTHER">Outra</option></select></label>
      <button className="btn btn-primary">Salvar</button>
     </form></details>
     {a.paymentStatus!=="PAID"&&<form action={markAppointmentPaidAction} className="inline-form"><input type="hidden" name="id" value={a.id}/><input type="hidden" name="paymentMethod" value="PIX"/><button className="btn btn-small btn-primary">Recebido</button></form>}
    </td>
   </tr>)}
   {!appointments.length&&<tr><td colSpan={7}>Nenhuma consulta neste mês.</td></tr>}
  </tbody></table></div></section>
 </div>;
}