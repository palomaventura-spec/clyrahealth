import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SaasStatusBadge } from "@/components/SaasStatusBadge";
import { extendTrialAction, toggleCompanyActiveAction } from "../actions";

function fmt(date?: Date | null) {
  return date ? new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(date) : "—";
}

function daysRemaining(date?: Date | null) {
  if (!date) return null;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default async function CompanyAdminPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const { companyId } = await params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscription: true,
      billingSettings: true,
      users: {
        select: {
          id: true, name: true, email: true, role: true, active: true, createdAt: true,
          auditLogs: {
            where: { action: "LOGIN" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true }
          }
        },
        orderBy: { createdAt: "asc" }
      },
      _count: {
        select: {
          users: true,
          professionals: true,
          patients: true,
          appointments: true,
          conversations: true,
          notifications: true
        }
      }
    }
  });

  if (!company) notFound();

  const owner = company.users.find(u => u.role === "OWNER");
  const lastAccess = company.users
    .map(u => u.auditLogs[0]?.createdAt)
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0];

  const remaining = daysRemaining(company.subscription?.trialEnds);

  return <div>
    <div className="page-header">
      <div>
        <Link className="back-link" href="/saas-admin">← Voltar aos clientes</Link>
        <span className="eyebrow">Cliente SaaS</span>
        <h1>{company.publicName ?? company.name}</h1>
        <p>{company.slug}</p>
      </div>
      <SaasStatusBadge status={company.subscription?.status} active={company.active}/>
    </div>

    <div className="admin-detail-grid">
      <section className="card section-card">
        <h2>Cadastro</h2>
        <dl className="detail-list">
          <div><dt>Responsável</dt><dd>{owner?.name ?? "—"}</dd></div>
          <div><dt>E-mail do responsável</dt><dd>{owner?.email ?? "—"}</dd></div>
          <div><dt>E-mail da clínica</dt><dd>{company.email ?? "—"}</dd></div>
          <div><dt>Telefone</dt><dd>{company.phone ?? "—"}</dd></div>
          <div><dt>Tipo</dt><dd>{company.organizationKind}</dd></div>
          <div><dt>Cadastrado em</dt><dd>{fmt(company.createdAt)}</dd></div>
          <div><dt>Último acesso</dt><dd>{fmt(lastAccess)}</dd></div>
          <div><dt>Login</dt><dd><code>/acesso/{company.slug}</code></dd></div>
          <div><dt>Agendamento público</dt><dd><code>/agendar/{company.slug}</code></dd></div>
        </dl>
      </section>

      <section className="card section-card">
        <h2>Assinatura / Trial</h2>
        <dl className="detail-list">
          <div><dt>Plano</dt><dd>{company.subscription?.plan === "TRIAL" ? "Não definido" : (company.subscription?.plan ?? "—")}</dd></div>
          <div><dt>Status</dt><dd>{company.subscription?.status ?? "—"}</dd></div>
          <div><dt>Início do trial</dt><dd>{fmt(company.subscription?.trialStartedAt)}</dd></div>
          <div><dt>Fim do trial</dt><dd>{fmt(company.subscription?.trialEnds)}</dd></div>
          <div><dt>Restante</dt><dd>{company.subscription?.status === "TRIAL" ? `${remaining ?? "—"} dia(s)` : "—"}</dd></div>
          <div><dt>Gateway</dt><dd>{company.billingSettings?.provider ?? "NONE"}</dd></div>
        </dl>

        <form action={extendTrialAction} className="inline-admin-form">
          <input type="hidden" name="companyId" value={company.id}/>
          <label>Estender trial
            <select name="days" defaultValue="7">
              <option value="3">+3 dias</option>
              <option value="7">+7 dias</option>
              <option value="14">+14 dias</option>
              <option value="30">+30 dias</option>
            </select>
          </label>
          <button className="btn btn-secondary">Aplicar</button>
        </form>
      </section>
    </div>

    <div className="usage-grid">
      <div className="usage-card"><strong>{company._count.users}</strong><span>Usuários</span></div>
      <div className="usage-card"><strong>{company._count.professionals}</strong><span>Profissionais</span></div>
      <div className="usage-card"><strong>{company._count.patients}</strong><span>Pacientes</span></div>
      <div className="usage-card"><strong>{company._count.appointments}</strong><span>Consultas</span></div>
      <div className="usage-card"><strong>{company._count.conversations}</strong><span>Conversas</span></div>
      <div className="usage-card"><strong>{company._count.notifications}</strong><span>Notificações</span></div>
    </div>

    <section className="card section-card">
      <div className="section-heading">
        <div>
          <h2>Usuários administrativos</h2>
          <p>Somente dados de acesso e perfil. O painel CEO não exibe conteúdo clínico.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Último login</th></tr></thead>
          <tbody>
            {company.users.map(u => <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.active ? "Ativo" : "Inativo"}</td>
              <td>{fmt(u.auditLogs[0]?.createdAt)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    <section className="card section-card danger-zone">
      <h2>Controle de acesso</h2>
      <p>
        {company.active
          ? "Bloquear impede novos acessos e encerra as sessões atuais. Os dados permanecem preservados."
          : "Este cliente está bloqueado. Desbloquear restaura o acesso sem alterar os dados."}
      </p>
      <form action={toggleCompanyActiveAction}>
        <input type="hidden" name="companyId" value={company.id}/>
        <button className={`btn ${company.active ? "btn-danger" : "btn-primary"}`}>
          {company.active ? "Bloquear cliente" : "Desbloquear cliente"}
        </button>
      </form>
    </section>
  </div>;
}
