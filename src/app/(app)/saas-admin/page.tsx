import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/StatCard";
import { SaasStatusBadge } from "@/components/SaasStatusBadge";

function daysRemaining(date?: Date | null) {
  if (!date) return null;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

function fmt(date?: Date | null) {
  return date ? new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(date) : "Nunca";
}

export default async function SaasAdminPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [companies, usersCount, professionalsCount, appointmentsCount, newCompanies] = await Promise.all([
    prisma.company.findMany({
      include: {
        subscription: true,
        users: {
          where: { role: "OWNER" },
          select: { name: true, email: true },
          take: 1
        },
        auditLogs: {
          where: { action: "LOGIN" },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
          take: 1
        },
        _count: {
          select: {
            users: true,
            professionals: true,
            patients: true,
            appointments: true,
            conversations: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.professional.count(),
    prisma.appointment.count(),
    prisma.company.count({ where: { createdAt: { gte: sevenDaysAgo } } })
  ]);

  const now = new Date();
  const trialCount = companies.filter(c => c.subscription?.status === "TRIAL" && (!c.subscription.trialEnds || c.subscription.trialEnds >= now)).length;
  const activeCount = companies.filter(c => c.subscription?.status === "ACTIVE" && c.active).length;
  const expiredCount = companies.filter(c => c.subscription?.status === "TRIAL" && !!c.subscription.trialEnds && c.subscription.trialEnds < now).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">ClyraHealth SaaS</span>
          <h1>Painel da plataforma</h1>
          <p>Acompanhamento administrativo do piloto — sem acesso a prontuários ou conteúdo clínico.</p>
        </div>
      </div>

      <div className="stats-grid saas-stats">
        <StatCard label="Clientes" value={companies.length}/>
        <StatCard label="Em trial" value={trialCount}/>
        <StatCard label="Ativos / pagantes" value={activeCount}/>
        <StatCard label="Trials expirados" value={expiredCount}/>
        <StatCard label="Novos em 7 dias" value={newCompanies}/>
        <StatCard label="Usuários" value={usersCount}/>
        <StatCard label="Profissionais" value={professionalsCount}/>
        <StatCard label="Agendamentos" value={appointmentsCount}/>
      </div>

      <section className="card section-card">
        <div className="section-heading">
          <div><h2>Clientes</h2><p>Veja quem cadastrou, começou a usar e quando acessou pela última vez.</p></div>
        </div>
        <div className="table-wrap">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Trial</th>
                <th>Uso</th>
                <th>Último acesso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => {
                const remaining = daysRemaining(c.subscription?.trialEnds);
                const owner = c.users[0];
                return <tr key={c.id}>
                  <td>
                    <strong>{c.publicName ?? c.name}</strong><br/>
                    <small>{c.slug}</small>
                  </td>
                  <td>
                    {owner?.name ?? "—"}<br/>
                    <small>{owner?.email ?? "—"}</small>
                  </td>
                  <td>{c.subscription?.plan === "TRIAL" ? "Não definido" : (c.subscription?.plan ?? "—")}</td>
                  <td><SaasStatusBadge status={c.subscription?.status} active={c.active}/></td>
                  <td>
                    {c.subscription?.status === "TRIAL"
                      ? c.subscription?.trialEnds && c.subscription.trialEnds < now
                        ? <strong className="text-danger">Expirado</strong>
                        : `${remaining ?? "—"} dia(s)`
                      : "—"}
                  </td>
                  <td>
                    <small>
                      {c._count.users} usuários · {c._count.professionals} prof.<br/>
                      {c._count.patients} pacientes · {c._count.appointments} consultas
                    </small>
                  </td>
                  <td>{fmt(c.auditLogs[0]?.createdAt)}</td>
                  <td><Link className="btn btn-secondary btn-small" href={`/saas-admin/${c.id}`}>Ver</Link></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
