import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/StatCard";

export default async function SaasAdminPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const [companies, usersCount, professionalsCount, appointmentsCount] = await Promise.all([
    prisma.company.findMany({
      include: {
        subscription: true,
        _count: { select: { users: true, professionals: true, patients: true, appointments: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.professional.count(),
    prisma.appointment.count()
  ]);

  return (
    <div>
      <div className="page-header"><div><span className="eyebrow">ClyraHealth SaaS</span><h1>Painel da plataforma</h1><p>Visão administrativa dos clientes — sem prontuários clínicos.</p></div></div>
      <div className="stats-grid">
        <StatCard label="Clientes" value={companies.length}/>
        <StatCard label="Usuários" value={usersCount}/>
        <StatCard label="Profissionais" value={professionalsCount}/>
        <StatCard label="Agendamentos" value={appointmentsCount}/>
      </div>
      <section className="card section-card">
        <div className="table-wrap"><table>
          <thead><tr><th>Cliente</th><th>Plano</th><th>Usuários</th><th>Profissionais</th><th>Pacientes</th><th>Consultas</th></tr></thead>
          <tbody>{companies.map(c => <tr key={c.id}>
            <td><strong>{c.name}</strong><br/><small>{c.slug}</small></td>
            <td>{c.subscription?.plan ?? "—"} · {c.subscription?.status ?? "—"}</td>
            <td>{c._count.users}</td>
            <td>{c._count.professionals}</td>
            <td>{c._count.patients}</td>
            <td>{c._count.appointments}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>
  );
}
