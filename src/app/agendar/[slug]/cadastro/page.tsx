import Link from "next/link";
import { notFound } from "next/navigation";
import { registerPublicPatientAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export default async function PatientRegistrationPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) notFound();

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href="/" className="brand">Clyra<span>Health</span></Link>
        <strong>{company.name}</strong>
      </header>
      <div className="booking-container booking-narrow">
        <div className="stepper"><span className="done">✓</span><i></i><span className="active">2</span><i></i><span>3</span></div>
        <span className="eyebrow">Novo paciente</span>
        <h1>Complete seu cadastro</h1>
        <p>Esses dados ficarão vinculados somente a esta clínica.</p>
        {query.erro && <div className="alert alert-error">Preencha os dados obrigatórios.</div>}
        <form action={registerPublicPatientAction} className="card booking-form">
          <input type="hidden" name="slug" value={slug} />
          <label>Nome completo<input name="name" required /></label>
          <div className="form-grid">
            <label>CPF<input name="document" defaultValue={query.document ?? ""} required /></label>
            <label>Nascimento<input name="birthDate" type="date" defaultValue={query.birthDate ?? ""} required /></label>
          </div>
          <div className="form-grid">
            <label>WhatsApp/Telefone<input name="phone" required /></label>
            <label>E-mail<input name="email" type="email" /></label>
          </div>
          <button className="btn btn-primary btn-lg">Salvar e escolher horário</button>
        </form>
      </div>
    </main>
  );
}
