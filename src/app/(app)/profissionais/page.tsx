import { createAvailabilityAction, createProfessionalAction, createSpecialtyAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { canManage, requireCompany } from "@/lib/auth";

const typeLabels: Record<string,string> = {
  DOCTOR: "Médico(a)",
  DENTIST: "Dentista",
  PHYSIOTHERAPIST: "Fisioterapeuta",
  PSYCHOLOGIST: "Psicólogo(a)",
  NUTRITIONIST: "Nutricionista",
  SPEECH_THERAPIST: "Fonoaudiólogo(a)",
  OTHER: "Outro"
};

const weekdays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default async function ProfessionalsPage() {
  const { user, companyId } = await requireCompany();
  const [professionals, specialties] = await Promise.all([
    prisma.professional.findMany({
      where: { companyId },
      include: { specialty: true, availabilities: true },
      orderBy: { name: "asc" }
    }),
    prisma.specialty.findMany({ where: { companyId }, orderBy: { name: "asc" } })
  ]);

  const manage = canManage(user.role);

  return (
    <div>
      <div className="page-header">
        <div><span className="eyebrow">Equipe clínica</span><h1>Profissionais</h1><p>Médicos, dentistas, fisioterapeutas e demais profissionais.</p></div>
      </div>

      {manage && (
        <div className="two-columns">
          <section className="card section-card">
            <h2>Nova especialidade</h2>
            <form action={createSpecialtyAction} className="inline-form">
              <input name="name" placeholder="Ex.: Cardiologia" required />
              <button className="btn btn-secondary">Adicionar</button>
            </form>
          </section>
          <section className="card section-card">
            <h2>Novo profissional</h2>
            <form action={createProfessionalAction} className="form-grid">
              <label>Nome<input name="name" required /></label>
              <label>Profissão
                <select name="type" defaultValue="DOCTOR">
                  {Object.entries(typeLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>Especialidade
                <select name="specialtyId"><option value="">Sem especialidade</option>{specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </label>
              <label>Conselho<input name="council" placeholder="CRM, CRO, CREFITO..." /></label>
              <label>Registro<input name="registrationNumber" /></label>
              <label>Duração (min)<input name="appointmentDuration" type="number" defaultValue={30} min={10} /></label>
              <label>E-mail<input name="email" type="email" /></label>
              <label>Telefone<input name="phone" /></label>
              <button className="btn btn-primary span-2">Cadastrar profissional</button>
            </form>
          </section>
        </div>
      )}

      <div className="cards-grid">
        {professionals.map((p) => (
          <div className="card professional-card" key={p.id}>
            <div className="avatar">{p.name.slice(0,2).toUpperCase()}</div>
            <div>
              <h3>{p.name}</h3>
              <p>{typeLabels[p.type]} · {p.specialty?.name ?? "Sem especialidade"}</p>
              <small>{p.council ?? ""} {p.registrationNumber ?? ""}</small>
            </div>
            <div className="availability-list">
              {p.availabilities.map(a => <span key={a.id}>{weekdays[a.weekday]} {a.startTime}–{a.endTime}</span>)}
              {p.availabilities.length === 0 && <small>Disponibilidade ainda não configurada.</small>}
            </div>
            {manage && (
              <form action={createAvailabilityAction} className="availability-form">
                <input type="hidden" name="professionalId" value={p.id}/>
                <select name="weekday" defaultValue="1">{weekdays.map((w,i) => <option key={i} value={i}>{w}</option>)}</select>
                <input name="startTime" type="time" defaultValue="09:00" required/>
                <input name="endTime" type="time" defaultValue="17:00" required/>
                <button className="btn btn-small btn-secondary">+ horário</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
