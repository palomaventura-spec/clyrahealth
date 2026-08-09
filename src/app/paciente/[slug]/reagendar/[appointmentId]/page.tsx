import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { patientRescheduleAppointmentAction } from "@/app/actions";
import { getPatientForCompany } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";
import { formatDateTime } from "@/lib/format";

export default async function ReschedulePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; appointmentId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug, appointmentId } = await params;
  const query = await searchParams;
  const patient = await getPatientForCompany(slug);
  if (!patient) redirect(`/agendar/${slug}`);

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId: patient.id },
    include: { professional: { include: { specialty: true } }, company: true }
  });
  if (!appointment || appointment.company.slug !== slug) notFound();

  const date = query.date ?? "";
  const slots = date
    ? await getAvailableSlots(appointment.companyId, appointment.professionalId, date)
    : [];

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href={`/paciente/${slug}`} className="brand">Clyra<span>Health</span></Link>
        <strong>{appointment.company.name}</strong>
      </header>
      <div className="booking-container booking-narrow">
        <span className="eyebrow">Reagendamento</span>
        <h1>{appointment.professional.name}</h1>
        <p>Atual: {formatDateTime(appointment.startsAt)}</p>

        {query.erro && <div className="alert alert-error">Horário indisponível. Escolha outro.</div>}

        <form method="get" className="card booking-form">
          <label>Nova data<input type="date" name="date" defaultValue={date} required /></label>
          <button className="btn btn-secondary">Ver horários</button>
        </form>

        {date && (
          <section className="card section-card">
            <h2>Horários livres</h2>
            {slots.length > 0 ? (
              <div className="slot-grid">
                {slots.map(time => (
                  <form action={patientRescheduleAppointmentAction} key={time}>
                    <input type="hidden" name="slug" value={slug}/>
                    <input type="hidden" name="appointmentId" value={appointment.id}/>
                    <input type="hidden" name="date" value={date}/>
                    <input type="hidden" name="time" value={time}/>
                    <button className="slot-button">{time}</button>
                  </form>
                ))}
              </div>
            ) : <div className="empty-state">Nenhum horário disponível.</div>}
          </section>
        )}
      </div>
    </main>
  );
}
