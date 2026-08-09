import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  patientCancelAppointmentAction,
  patientConfirmAppointmentAction,
  patientLogoutAction
} from "@/app/actions";
import { getPatientForCompany } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";

export default async function PatientPortalPage({
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

  const patient = await getPatientForCompany(slug);
  if (!patient) redirect(`/agendar/${slug}`);

  const appointments = await prisma.appointment.findMany({
    where: { companyId: company.id, patientId: patient.id },
    include: { professional: { include: { specialty: true } } },
    orderBy: { startsAt: "desc" }
  });

  const upcoming = appointments.filter(a => a.startsAt > new Date() && a.status !== "CANCELLED");
  const history = appointments.filter(a => a.startsAt <= new Date() || a.status === "CANCELLED");

  return (
    <main className="booking-page patient-portal">
      <header className="booking-header">
        <Link href="/" className="brand">Clyra<span>Health</span></Link>
        <form action={patientLogoutAction}>
          <input type="hidden" name="slug" value={slug}/>
          <button className="btn btn-secondary">Sair</button>
        </form>
      </header>

      <div className="booking-container">
        <div className="page-header">
          <div><span className="eyebrow">Portal do paciente</span><h1>Olá, {patient.name}</h1><p>{company.name}</p></div>
          <Link href={`/agendar/${slug}/horarios`} className="btn btn-primary">Nova consulta</Link>
        </div>

        {query.sucesso === "agendado" && <div className="alert alert-success">Consulta solicitada com sucesso.</div>}
        {query.sucesso === "reagendado" && <div className="alert alert-success">Consulta reagendada. A clínica poderá confirmar novamente.</div>}

        <section className="card section-card">
          <h2>Próximas consultas</h2>
          <div className="patient-appointments">
            {upcoming.map(a => (
              <article className="patient-appointment" key={a.id}>
                <div>
                  <strong>{a.professional.name}</strong>
                  <span>{a.professional.specialty?.name ?? "Atendimento"}</span>
                  <b>{formatDateTime(a.startsAt)}</b>
                  <StatusBadge status={a.status}/>
                </div>
                <div className="patient-actions">
                  {a.status === "SCHEDULED" && (
                    <form action={patientConfirmAppointmentAction}>
                      <input type="hidden" name="slug" value={slug}/>
                      <input type="hidden" name="appointmentId" value={a.id}/>
                      <button className="btn btn-primary">Confirmar</button>
                    </form>
                  )}
                  {["SCHEDULED","CONFIRMED"].includes(a.status) && (
                    <>
                      <Link className="btn btn-secondary" href={`/paciente/${slug}/reagendar/${a.id}`}>Reagendar</Link>
                      <form action={patientCancelAppointmentAction}>
                        <input type="hidden" name="slug" value={slug}/>
                        <input type="hidden" name="appointmentId" value={a.id}/>
                        <button className="btn btn-secondary">Cancelar</button>
                      </form>
                    </>
                  )}
                </div>
              </article>
            ))}
            {upcoming.length === 0 && <div className="empty-state">Você não possui consultas futuras.</div>}
          </div>
        </section>

        <section className="card section-card">
          <h2>Histórico</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Profissional</th><th>Especialidade</th><th>Status</th></tr></thead>
              <tbody>
                {history.map(a => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.startsAt)}</td>
                    <td>{a.professional.name}</td>
                    <td>{a.professional.specialty?.name ?? "—"}</td>
                    <td><StatusBadge status={a.status}/></td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan={4}>Ainda não há histórico.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
