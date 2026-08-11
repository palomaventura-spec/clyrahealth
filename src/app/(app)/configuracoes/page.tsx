import { updateCompanyBrandingAction } from "@/app/actions";
import { ClinicBrandingFields } from "@/components/ClinicBrandingFields";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { requireCompany } from "@/lib/auth";

export default async function SettingsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const q=await searchParams;
  const { user } = await requireCompany();
  const company = user.company!;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/agendar/${company.slug}`;

  return (
    <div>
      <div className="page-header"><div><span className="eyebrow">Conta</span><h1>Configurações</h1><p>Dados, identidade visual e link de agendamento da clínica.</p></div></div>

      {q.salvo&&<div className="alert alert-success">✓ Configurações da clínica atualizadas com sucesso.</div>}

      <section className="card section-card">
        <div className="section-heading"><div><h2>Identidade da clínica</h2><p>Personalize como sua clínica aparece para pacientes e nos documentos.</p></div></div>
        <form action={updateCompanyBrandingAction} className="form-grid">
          <ClinicBrandingFields defaultLogoUrl={company.logoUrl} defaultAccentColor={company.accentColor}/>
          <label>Nome público<input name="publicName" defaultValue={company.publicName??company.name}/></label>
          <label>Telefone<input name="phone" defaultValue={company.phone??""}/></label>
          <label>E-mail<input name="email" type="email" defaultValue={company.email??""}/></label>
          <label className="span-2">Endereço<input name="address" defaultValue={company.address??""}/></label>
          <label>Cidade<input name="city" defaultValue={company.city??""}/></label>
          <label>Estado<input name="state" maxLength={2} defaultValue={company.state??""}/></label>
          <PendingSubmitButton idle="Salvar configurações" pending="Salvando..." className="btn btn-primary span-2"/>
        </form>
      </section>

      <div className="two-columns">
        <section className="card section-card">
          <h2>{company.publicName??company.name}</h2>
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
