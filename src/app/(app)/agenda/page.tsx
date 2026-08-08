import { createAppointmentAction, updateAppointmentStatusAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { CalendarBoard } from "@/components/CalendarBoard";
import { formatDateTime } from "@/lib/format";

export default async function AgendaPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { user, companyId } = await requireCompany();

  const professionalFilter =
    user.role === "PROFESSIONAL" && user.professional?.id
      ? user.professional.id
      : undefined;

  const [professionals, patients, appointments] = await Promise.all([
    prisma.professional.findMany({
      where: { companyId, active: true },
      orderBy: { name: "asc" }
    }),
    prisma.patient.findMany({
      where: { companyId },
      orderBy: { name: "asc" }
    }),
    prisma.appointment.findMany({
      where: {
        companyId,
        ...(professionalFilter ? { professionalId: professionalFilter } : {})
      },
      include: {
        patient: true,
        professional: true
      },
      orderBy: { startsAt: "asc" },
      take: 300
    })
  ]);

  const calendarEvents = appointments.map((a) => ({
    id: a.id,
    title: `${a.patient.name} · ${a.professional.name}`,
    start: a.startsAt.toISOString(),
    end: a.endsAt.toISOString(),
    status: a.status,
    professional: a.professional.name,
    patient: a.patient.name,
    reason: a.reason
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Operação</span>
          <h1>Agenda</h1>
          <p>
            Visualize a clínica por mês, semana ou dia. Arraste uma consulta para
            alterar o horário.
          </p>
        </div>
      </div>

      {params.erro === "horario" && (
        <div className="alert alert-error">
          Já existe uma consulta nesse horário para o profissional.
        </div>
      )}

      <section className="card section-card calendar-card">
        <CalendarBoard
          events={calendarEvents}
          editable={user.role !== "PROFESSIONAL" || Boolean(user.professional?.id)}
        />
      </section>

      {user.role !== "PROFESSIONAL" && (
        <section className="card section-card">
          <h2>Novo agendamento</h2>
          <form action={createAppointmentAction} className="form-grid">
            <label>
              Profissional
              <select name="professionalId" required>
                <option value="">Selecione</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Paciente
              <select name="patientId" required>
                <option value="">Selecione</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Data
              <input name="date" type="date" required />
            </label>

            <label>
              Horário
              <input name="time" type="time" required />
            </label>

            <label className="span-2">
              Motivo
              <input name="reason" />
            </label>

            <button className="btn btn-primary span-2">Agendar</button>
          </form>
        </section>
      )}

      <section className="card section-card">
        <div className="section-title">
          <div>
            <h2>Lista de consultas</h2>
            <p>Use esta área para atualizar o status do atendimento.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Profissional</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.startsAt)}</td>
                  <td>
                    {a.patient.name}
                    <br />
                    <small>{a.reason ?? ""}</small>
                  </td>
                  <td>{a.professional.name}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    <form
                      action={updateAppointmentStatusAction}
                      className="status-form"
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status}>
                        <option value="SCHEDULED">Agendada</option>
                        <option value="CONFIRMED">Confirmada</option>
                        <option value="COMPLETED">Concluída</option>
                        <option value="CANCELLED">Cancelada</option>
                        <option value="NO_SHOW">Falta</option>
                      </select>
                      <button className="btn btn-small btn-secondary">
                        Salvar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5}>Nenhuma consulta cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
