import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { patientBookAppointmentAction } from "@/app/actions";
import { getPatientForCompany } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";

export default async function BookingSlotsPage({
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
  if (!patient) redirect(`/agendar/${slug}`);

  const selected =
    company.professionals.find(p => p.id === query.profissional || p.publicSlug === query.profissional) ??
    null;
  const date = query.date ?? "";
  const slots = selected && date ? await getAvailableSlots(company.id, selected.id, date) : [];

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href="/" className="brand">Clyra<span>Health</span></Link>
        <div><strong>{company.name}</strong><small>Olá, {patient.name}</small></div>
      </header>
      <div className="booking-container">
        <div className="stepper"><span className="done">✓</span><i></i><span className="done">✓</span><i></i><span className="active">3</span></div>
        <span className="eyebrow">Escolha seu atendimento</span>
        <h1>Data e horário</h1>
        <p>Mostramos apenas os horários realmente disponíveis na agenda.</p>

        {query.erro === "ocupado" && <div className="alert alert-error">Esse horário não está mais disponível. Escolha outro.</div>}

        <form method="get" className="card booking-form booking-filter">
          <label>Profissional
            <select name="profissional" defaultValue={selected?.id ?? ""} required>
              <option value="">Selecione</option>
              {company.professionals.map(p => <option key={p.id} value={p.id}>{p.name} — {p.specialty?.name ?? p.type}</option>)}
            </select>
          </label>
          <label>Data<input name="date" type="date" defaultValue={date} required /></label>
          <button className="btn btn-secondary">Ver horários</button>
        </form>

        {selected && date && (
          <section className="card section-card">
            <div className="section-title">
              <div><h2>{selected.name}</h2><p>{selected.specialty?.name ?? "Profissional da saúde"} · {selected.appointmentDuration} min</p></div>
            </div>

            {slots.length > 0 ? (
              <div className="slot-grid">
                {slots.map(time => (
                  <form action={patientBookAppointmentAction} key={time}>
                    <input type="hidden" name="slug" value={slug}/>
                    <input type="hidden" name="professionalId" value={selected.id}/>
                    <input type="hidden" name="date" value={date}/>
                    <input type="hidden" name="time" value={time}/>
                    <button className="slot-button">{time}</button>
                  </form>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhum horário livre para esta data.</div>
            )}
          </section>
        )}

        <Link href={`/paciente/${slug}`} className="btn btn-secondary">Ver minhas consultas</Link>
      </div>
    </main>
  );
}
