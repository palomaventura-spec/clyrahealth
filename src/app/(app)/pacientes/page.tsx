import Link from "next/link";
import { createPatientAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";

export default async function PatientsPage() {
  const { companyId } = await requireCompany();
  const patients = await prisma.patient.findMany({
    where: { companyId },
    include: { _count: { select: { appointments: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <div className="page-header"><div><span className="eyebrow">Base de atendimento</span><h1>Pacientes</h1><p>Cadastre e consulte os pacientes da clínica.</p></div></div>
      <section className="card section-card">
        <h2>Novo paciente</h2>
        <form action={createPatientAction} className="form-grid">
          <label>Nome<input name="name" required /></label>
          <label>CPF/Documento<input name="document" /></label>
          <label>E-mail<input name="email" type="email" /></label>
          <label>Telefone<input name="phone" /></label>
          <label>Convênio<input name="insurance" /></label>
          <label>Observações<input name="notes" /></label>
          <button className="btn btn-primary span-2">Cadastrar paciente</button>
        </form>
      </section>
      <section className="card section-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Paciente</th><th>Contato</th><th>Documento</th><th>Convênio</th><th>Consultas</th></tr></thead>
            <tbody>
              {patients.map(p => <tr key={p.id}>
                <td><Link href={`/pacientes/${p.id}`}><strong>{p.name}</strong></Link></td>
                <td>{p.email ?? "—"}<br/><small>{p.phone ?? ""}</small></td>
                <td>{p.document ?? "—"}</td>
                <td>{p.insurance ?? "—"}</td>
                <td>{p._count.appointments}</td>
              </tr>)}
              {patients.length === 0 && <tr><td colSpan={5}>Nenhum paciente cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
