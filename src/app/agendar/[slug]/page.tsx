import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { identifyPatientAction } from "@/app/actions";
import { getPatientForCompany } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";

export default async function PublicBookingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      professionals: {
        where: { active: true },
        include: { specialty: true },
        orderBy: { name: "asc" }
      }
    }
  });
  if (!company) notFound();

  const patient = await getPatientForCompany(slug);
  if (patient) {
    const suffix = query.profissional ? `?profissional=${encodeURIComponent(query.profissional)}` : "";
    redirect(`/agendar/${slug}/horarios${suffix}`);
  }

  const selectedProfessional = query.profissional
    ? company.professionals.find(p => p.publicSlug === query.profissional || p.id === query.profissional)
    : null;

  return (
    <main className="booking-page">
      <header className="booking-header" style={{"--primary":company.accentColor??"#2563eb"} as React.CSSProperties}>
        <Link href="/" className="booking-brand-link">
          {company.logoUrl
            ? <img className="booking-logo" src={company.logoUrl} alt={`Logo ${company.publicName??company.name}`}/>
            : <span className="brand">Clyra<span>Health</span></span>}
        </Link>
        <div><strong>{company.publicName??company.name}</strong><small>{[company.city, company.state].filter(Boolean).join(" / ")}</small></div>
      </header>

      <div className="booking-container booking-narrow">
        <div className="stepper"><span className="active">1</span><i></i><span>2</span><i></i><span>3</span></div>
        <section>
          <span className="eyebrow">Agendamento online</span>
          <h1>{selectedProfessional ? `Agende com ${selectedProfessional.name}` : "Vamos identificar você"}</h1>
          <p>Se você já é paciente desta clínica, informe CPF e data de nascimento. Se ainda não for, o cadastro será feito no próximo passo.</p>
        </section>

        {query.erro && <div className="alert alert-error">Não conseguimos validar os dados. Tente novamente.</div>}

        {selectedProfessional && (
          <div className="card selected-professional">
            <div className="avatar">{selectedProfessional.name.slice(0,2).toUpperCase()}</div>
            <div><strong>{selectedProfessional.name}</strong><small>{selectedProfessional.specialty?.name ?? "Profissional da saúde"}</small></div>
          </div>
        )}

        <form action={identifyPatientAction} className="card booking-form">
          <input type="hidden" name="slug" value={slug} />
          <label>CPF<input name="document" inputMode="numeric" placeholder="Somente números" required /></label>
          <label>Data de nascimento<input name="birthDate" type="date" required /></label>
          <button className="btn btn-primary btn-lg">Continuar</button>
        </form>

        <div className="booking-help">
          <strong>Primeira consulta?</strong>
          <p>Preencha os dados acima. Se o cadastro não existir, o ClyraHealth abrirá automaticamente o formulário de novo paciente.</p>
        </div>
      </div>
    </main>
  );
}
