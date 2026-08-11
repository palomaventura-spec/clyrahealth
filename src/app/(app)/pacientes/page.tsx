import Link from "next/link";
import { createPatientAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

export default async function PatientsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const query=await searchParams; const { companyId } = await requireCompany();
  const patients = await prisma.patient.findMany({where:{companyId},include:{_count:{select:{appointments:true}}},orderBy:{name:"asc"}});
  return <div>
    <div className="page-header"><div><span className="eyebrow">Base de atendimento</span><h1>Pacientes</h1><p>Cadastro administrativo e dados necessários para o atendimento.</p></div></div>
    {query.sucesso&&<div className="alert alert-success">✓ Paciente cadastrado com sucesso.</div>}
    <section className="card section-card"><h2>Novo paciente</h2><form action={createPatientAction} className="form-grid">
      <label>Nome<input name="name" required/></label><label>Data de nascimento<input name="birthDate" type="date"/></label>
      <label>CPF/Documento<input name="document"/></label><label>Sexo<select name="sex"><option value="">Não informado</option><option value="F">Feminino</option><option value="M">Masculino</option><option value="OTHER">Outro</option></select></label>
      <label>E-mail<input name="email" type="email"/></label><label>Telefone<input name="phone"/></label>
      <label>CEP<input name="zipCode"/></label><label>Logradouro<input name="street"/></label><label>Número<input name="addressNumber"/></label><label>Complemento<input name="complement"/></label><label>Bairro<input name="neighborhood"/></label><label>Cidade<input name="city"/></label><label>UF<input name="state" maxLength={2}/></label>
      <label>Responsável<input name="guardianName"/></label><label>Telefone do responsável<input name="guardianPhone"/></label>
      <label>Atendimento<select name="careType" defaultValue="PRIVATE"><option value="PRIVATE">Particular</option><option value="INSURANCE">Plano de saúde / convênio</option></select></label>
      <label>Operadora / plano de saúde<input name="insurance"/></label><label>Plano / categoria<input name="insurancePlan"/></label><label>Carteirinha<input name="insuranceCard"/></label><label>Validade da carteirinha<input name="insuranceValidity" type="date"/></label>
      <label className="span-2">Observações administrativas<input name="notes"/></label>
      <PendingSubmitButton idle="Cadastrar paciente" pending="Cadastrando paciente..." className="btn btn-primary span-2"/>
    </form></section>
    <section className="card section-card"><div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Nascimento</th><th>Contato</th><th>Atendimento</th><th>Consultas</th></tr></thead><tbody>
      {patients.map(p=><tr key={p.id}><td><Link href={`/pacientes/${p.id}`}><strong>{p.name}</strong></Link></td><td>{p.birthDate?new Intl.DateTimeFormat("pt-BR").format(p.birthDate):"—"}</td><td>{p.email??"—"}<br/><small>{p.phone??""}</small></td><td>{p.careType==="INSURANCE"?(p.insurance??"Convênio"):"Particular"}</td><td>{p._count.appointments}</td></tr>)}
      {patients.length===0&&<tr><td colSpan={5}>Nenhum paciente cadastrado.</td></tr>}
    </tbody></table></div></section>
  </div>;
}
