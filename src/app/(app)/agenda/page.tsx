import Link from "next/link";
import {
  createAppointmentAction,
  createScheduleBlockAction,
  deleteScheduleBlockAction,
  updateAppointmentStatusAction
} from "@/app/actions";
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

  const [professionals, patients, appointments, blocks] = await Promise.all([
    prisma.professional.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" } }),
    prisma.patient.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      where: { companyId, ...(professionalFilter ? { professionalId: professionalFilter } : {}) },
      include: { patient: true, professional: true },
      orderBy: { startsAt: "asc" },
      take: 300
    }),
    prisma.scheduleBlock.findMany({
      where: { companyId, ...(professionalFilter ? { professionalId: professionalFilter } : {}) },
      include: { professional: true },
      orderBy: { startsAt: "asc" },
      take: 150
    })
  ]);

  const calendarEvents = appointments.map((a) => ({
    id: a.id,
    start: a.startsAt.toISOString(),
    end: a.endsAt.toISOString(),
    status: a.status,
    professional: a.professional.name,
    patient: a.patient.name,
    reason: a.reason
  }));

  const calendarBlocks = blocks.map((b) => ({
    id: b.id,
    start: b.startsAt.toISOString(),
    end: b.endsAt.toISOString(),
    title: b.title,
    professional: b.professional.name
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Operação</span>
          <h1>Agenda</h1>
          <p>Consultas, reagendamentos, bloqueios e disponibilidade da clínica.</p>
        </div>
        <div className="header-actions"><Link href="/lista-espera" className="btn btn-secondary">Lista de espera / encaixes</Link></div>
      </div>

      {params.erro === "horario" && (
        <div className="alert alert-error">Já existe uma consulta nesse horário para o profissional.</div>
      )}

      <section className="card section-card calendar-card">
        <CalendarBoard events={calendarEvents} blocks={calendarBlocks} editable />
      </section>

      <div className={user.role === "PROFESSIONAL" ? "one-column" : "two-columns"}>
        <section className="card section-card">
          <h2>{user.role === "PROFESSIONAL" ? "Novo agendamento na minha agenda" : "Novo agendamento interno"}</h2>
          <form action={createAppointmentAction} className="form-grid">
            {user.role === "PROFESSIONAL" && user.professional ? (
              <>
                <input type="hidden" name="professionalId" value={user.professional.id} />
                <label>Profissional<input value={user.professional.name} disabled /></label>
              </>
            ) : (
              <label>Profissional
                <select name="professionalId" required>
                  <option value="">Selecione</option>
                  {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            <label>Paciente
              <select name="patientId" required>
                <option value="">Selecione</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>Data<input name="date" type="date" required /></label>
            <label>Horário<input name="time" type="time" required /></label>
            <label>Tipo de atendimento
              <select name="reason" defaultValue="ROTINA">
                <option value="PRIMEIRA_CONSULTA">Primeira consulta</option><option value="RETORNO">Retorno</option><option value="ROTINA">Rotina</option><option value="URGENCIA">Urgência</option><option value="PROCEDIMENTO">Procedimento</option><option value="OUTRO">Outro</option>
              </select><small className="field-help">Informação administrativa. A queixa principal fica restrita ao prontuário clínico.</small>
            </label>
            <label>Forma de atendimento<select name="careType" defaultValue="PRIVATE"><option value="PRIVATE">Particular</option><option value="INSURANCE">Plano de saúde / convênio</option></select></label>
            <label>Valor (R$)<input name="amount" inputMode="decimal" placeholder="Usa o valor padrão do profissional"/></label>
            <label>Desconto (R$)<input name="discount" inputMode="decimal" placeholder="0,00"/></label>
            <button className="btn btn-primary span-2">Agendar</button>
          </form>
        </section>

        <section className="card section-card">
          <h2>Bloquear agenda</h2>
          <form action={createScheduleBlockAction} className="form-grid">
            {user.role === "PROFESSIONAL" && user.professional ? (
              <>
                <input type="hidden" name="professionalId" value={user.professional.id} />
                <label>Profissional<input value={user.professional.name} disabled /></label>
              </>
            ) : (
              <label>Profissional
                <select name="professionalId" required>
                  <option value="">Selecione</option>
                  {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            <label>Motivo<input name="title" placeholder="Almoço, reunião, férias..." /></label>
            <label>Data<input name="date" type="date" required /></label>
            <label>Início<input name="startTime" type="time" required /></label>
            <label>Fim<input name="endTime" type="time" required /></label>
            <button className="btn btn-secondary span-2">Criar bloqueio</button>
          </form>
        </section>
      </div>

      <section className="card section-card">
        <h2>Lista de consultas</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Paciente</th><th>Profissional</th><th>Atendimento</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.startsAt)}</td>
                  <td>{a.patient.name}<br/><small>{a.reason ?? ""}</small></td>
                  <td>{a.professional.name}</td>
                  <td>{a.careType==="INSURANCE"?"Plano de saúde":"Particular"}</td>
                  <td>{new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(a.finalAmountCents/100)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <form action={updateAppointmentStatusAction} className="status-form">
                      <input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status}>
                        <option value="SCHEDULED">Agendada</option>
                        <option value="CONFIRMED">Confirmada</option>
                        <option value="ARRIVED">Paciente chegou</option>
                        <option value="IN_PROGRESS">Em atendimento</option>
                        <option value="COMPLETED">Concluída</option>
                        <option value="CANCELLED">Cancelada</option>
                        <option value="NO_SHOW">Falta</option>
                      </select>
                      <button className="btn btn-small btn-secondary">Salvar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {blocks.length > 0 && (
        <section className="card section-card">
          <h2>Bloqueios cadastrados</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Período</th><th>Profissional</th><th>Motivo</th><th></th></tr></thead>
              <tbody>
                {blocks.map(b => (
                  <tr key={b.id}>
                    <td>{formatDateTime(b.startsAt)} → {formatDateTime(b.endsAt)}</td>
                    <td>{b.professional.name}</td>
                    <td>{b.title}</td>
                    <td>
                      <form action={deleteScheduleBlockAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="btn btn-small btn-secondary">Remover</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
