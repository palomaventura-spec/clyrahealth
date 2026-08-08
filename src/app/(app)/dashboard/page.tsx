import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";

export default async function DashboardPage() {
  const { user, companyId } = await requireCompany();

  if (!user.company?.onboardingCompleted) {
    const { redirect } = await import("next/navigation");
    redirect("/onboarding");
  }

  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date();
  end.setHours(23,59,59,999);

  const [professionals, patients, todayAppointments, upcoming] = await Promise.all([
    prisma.professional.count({ where: { companyId, active: true } }),
    prisma.patient.count({ where: { companyId } }),
    prisma.appointment.count({ where: { companyId, startsAt: { gte: start, lte: end }, status: { not: "CANCELLED" } } }),
    prisma.appointment.findMany({
      where: { companyId, startsAt: { gte: new Date() }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { patient: true, professional: { include: { specialty: true } } }
    })
  ]);

  return (
    <div>
      <div className="page-header">
        <div><span className="eyebrow">Visão geral</span><h1>Olá, {user.name}</h1><p>Acompanhe a operação da sua clínica.</p></div>
        <a className="btn btn-primary" href="/agenda">Nova consulta</a>
      </div>
      <div className="stats-grid">
        <StatCard label="Consultas hoje" value={todayAppointments} detail="agenda do dia" />
        <StatCard label="Profissionais" value={professionals} detail="ativos" />
        <StatCard label="Pacientes" value={patients} detail="cadastrados" />
        <StatCard label="Link público" value="Ativo" detail={`/${user.company?.slug}`} />
      </div>

      <section className="card section-card">
        <div className="section-title"><div><h2>Próximos atendimentos</h2><p>Consultas futuras da clínica.</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Paciente</th><th>Profissional</th><th>Especialidade</th><th>Status</th></tr></thead>
            <tbody>
              {upcoming.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.startsAt)}</td>
                  <td>{a.patient.name}</td>
                  <td>{a.professional.name}</td>
                  <td>{a.professional.specialty?.name ?? "—"}</td>
                  <td><StatusBadge status={a.status}/></td>
                </tr>
              ))}
              {upcoming.length === 0 && <tr><td colSpan={5}>Nenhuma consulta futura.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
