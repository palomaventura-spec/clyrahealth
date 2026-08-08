import Link from "next/link";
import { notFound } from "next/navigation";
import { publicBookingAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export default async function PublicBookingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      professionals: {
        where: { active: true },
        include: { specialty: true, availabilities: true },
        orderBy: { name: "asc" }
      }
    }
  });

  if (!company) notFound();

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href="/" className="brand">Clyra<span>Health</span></Link>
        <div><strong>{company.name}</strong><small>{[company.city, company.state].filter(Boolean).join(" / ")}</small></div>
      </header>
      <div className="booking-container">
        <section>
          <span className="eyebrow">Agendamento online</span>
          <h1>Agende seu atendimento</h1>
          <p>Escolha o profissional, a data e o horário desejado.</p>
          {query.sucesso && <div className="alert alert-success">Agendamento realizado! A clínica poderá confirmar o atendimento.</div>}
          {query.erro === "ocupado" && <div className="alert alert-error">Este horário acabou de ser ocupado. Escolha outro.</div>}
        </section>
        <form action={publicBookingAction} className="card booking-form">
          <input type="hidden" name="slug" value={slug}/>
          <label>Profissional
            <select name="professionalId" required>
              <option value="">Selecione</option>
              {company.professionals.map(p => <option key={p.id} value={p.id}>{p.name} — {p.specialty?.name ?? p.type}</option>)}
            </select>
          </label>
          <div className="form-grid">
            <label>Data<input name="date" type="date" required/></label>
            <label>Horário<input name="time" type="time" required/></label>
          </div>
          <label>Seu nome<input name="patientName" required/></label>
          <div className="form-grid">
            <label>E-mail<input name="email" type="email"/></label>
            <label>Telefone<input name="phone"/></label>
          </div>
          <label>Motivo do atendimento<input name="reason"/></label>
          <button className="btn btn-primary btn-lg">Confirmar solicitação</button>
        </form>
        <section className="professionals-public">
          <h2>Profissionais</h2>
          <div className="cards-grid">
            {company.professionals.map(p => <div className="card professional-card" key={p.id}>
              <div className="avatar">{p.name.slice(0,2).toUpperCase()}</div>
              <h3>{p.name}</h3>
              <p>{p.specialty?.name ?? "Profissional da saúde"}</p>
              <small>{p.council} {p.registrationNumber}</small>
            </div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
