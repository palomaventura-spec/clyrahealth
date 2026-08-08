import { requireCompany } from "@/lib/auth";

export default async function SettingsPage() {
  const { user } = await requireCompany();
  const company = user.company!;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/agendar/${company.slug}`;
  return (
    <div>
      <div className="page-header"><div><span className="eyebrow">Conta</span><h1>Configurações</h1><p>Dados do ambiente e link de agendamento.</p></div></div>
      <div className="two-columns">
        <section className="card section-card">
          <h2>{company.name}</h2>
          <dl className="details">
            <div><dt>E-mail</dt><dd>{company.email ?? "—"}</dd></div>
            <div><dt>Telefone</dt><dd>{company.phone ?? "—"}</dd></div>
            <div><dt>Local</dt><dd>{[company.city, company.state].filter(Boolean).join(" / ") || "—"}</dd></div>
            <div><dt>Slug</dt><dd>{company.slug}</dd></div>
          </dl>
        </section>
        <section className="card section-card">
          <h2>Agendamento público</h2>
          <p>Compartilhe este endereço com seus pacientes.</p>
          <code className="code-box">{publicUrl}</code>
          <a className="btn btn-primary" href={`/agendar/${company.slug}`} target="_blank">Abrir página</a>
        </section>
      </div>
      <section className="card section-card">
        <h2>Integrações preparadas</h2>
        <div className="integration-grid">
          <div><strong>WhatsApp</strong><span>Próxima etapa</span></div>
          <div><strong>E-mail</strong><span>Próxima etapa</span></div>
          <div><strong>Pagamentos</strong><span>Próxima etapa</span></div>
          <div><strong>Assistente IA</strong><span>Próxima etapa</span></div>
        </div>
      </section>
    </div>
  );
}
