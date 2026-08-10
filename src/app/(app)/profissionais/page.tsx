import Link from "next/link";

import { createProfessionalAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfessionalClinicalFields } from "@/components/ProfessionalClinicalFields";
import { ProfessionalScheduleFields } from "@/components/ProfessionalScheduleFields";
import { canManage, requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const typeLabels: Record<string, string> = {
  DOCTOR: "Médico(a)",
  DENTIST: "Dentista",
  PHYSIOTHERAPIST: "Fisioterapeuta",
  PSYCHOLOGIST: "Psicólogo(a)",
  NUTRITIONIST: "Nutricionista",
  SPEECH_THERAPIST: "Fonoaudiólogo(a)",
  OTHER: "Outro"
};

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function ProfessionalsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const { user, companyId } = await requireCompany();

  const professionals = await prisma.professional.findMany({
    where: { companyId, active: true },
    include: {
      specialty: true,
      availabilities: true,
      user: {
        select: {
          email: true,
          active: true,
          mustChangePassword: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const manage = canManage(user.role);

  return (
    <div>
      {query.convite && query.email && (
        <div className="alert alert-success invitation-box">
          <strong>✓ Profissional criado com sucesso.</strong>
          <p>Login: {query.email}</p>
          <p>Envie este link para o profissional criar a própria senha:</p>
          <code>
            {`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/redefinir-senha?token=${query.convite}`}
          </code>
        </div>
      )}

      {query.erro === "email" && (
        <div className="alert alert-error">
          Este e-mail já está vinculado a um usuário.
        </div>
      )}

      {query.erro === "dados" && (
        <div className="alert alert-error">
          Revise os dados do profissional e tente novamente.
        </div>
      )}

      <div className="page-header">
        <div>
          <span className="eyebrow">Equipe clínica</span>
          <h1>Profissionais</h1>
          <p>
            Cadastre cada profissional com profissão, especialidade, duração e agenda próprias.
          </p>
        </div>
      </div>

      {manage && (
        <section className="card section-card professional-create-section">
          <div className="section-heading">
            <div>
              <h2>Novo profissional</h2>
              <p>
                A especialidade muda conforme a profissão escolhida e a agenda é individual.
              </p>
            </div>
          </div>

          <form action={createProfessionalAction} className="form-grid professional-form">
            <label>
              Nome
              <input name="name" required placeholder="Dr. João Silva" />
            </label>

            <label>
              E-mail de acesso
              <input name="email" type="email" required placeholder="joao@clinica.com" />
              <small>Este será o login individual do profissional.</small>
            </label>

            <ProfessionalClinicalFields />

            <label>
              Conselho
              <input name="council" placeholder="CRM, CRO, CREFITO..." />
            </label>

            <label>
              Registro profissional
              <input name="registrationNumber" placeholder="123456-RJ" />
            </label>

            <label>
              Duração da consulta (min)
              <input
                name="appointmentDuration"
                type="number"
                defaultValue={30}
                min={10}
                max={240}
                step={5}
                required
              />
              <small>Essa duração determina os horários oferecidos ao paciente.</small>
            </label>

            <label>
              Telefone
              <input name="phone" placeholder="(21) 99999-9999" />
            </label>

            <div className="span-2 schedule-highlight">
              <ProfessionalScheduleFields />
            </div>

            <PendingSubmitButton
              idle="Cadastrar profissional"
              pending="Cadastrando profissional..."
              className="btn btn-primary span-2"
            />
          </form>
        </section>
      )}

      <div className="cards-grid">
        {professionals.map((professional) => {
          const sorted = [...professional.availabilities].sort(
            (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)
          );

          return (
            <div className="card professional-card" key={professional.id}>
              <div className="avatar">
                {professional.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h3>{professional.name}</h3>
                <p>
                  {typeLabels[professional.type] ?? professional.type} ·{" "}
                  {professional.specialty?.name ?? "Sem especialidade"}
                </p>
                <small>
                  {professional.council ?? ""} {professional.registrationNumber ?? ""}
                </small>

                {professional.publicSlug && (
                  <a
                    className="professional-public-link"
                    href={`/agendar/${user.company?.slug}?profissional=${professional.publicSlug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Link público →
                  </a>
                )}
              </div>

              <div className="availability-list">
                {sorted.map((availability) => (
                  <span key={availability.id}>
                    {weekdays[availability.weekday]} {availability.startTime}–{availability.endTime}
                  </span>
                ))}

                {sorted.length === 0 && (
                  <small className="text-danger">
                    Agenda ainda não configurada.
                  </small>
                )}
              </div>

              <div className="professional-access-state">
                {professional.user?.mustChangePassword
                  ? "Convite pendente"
                  : professional.user
                    ? "Acesso ativo"
                    : "Sem login"}
              </div>

              {(manage ||
                (user.role === "PROFESSIONAL" &&
                  user.professional?.id === professional.id)) && (
                <Link
                  className="btn btn-small btn-secondary"
                  href={`/profissionais/${professional.id}/editar`}
                >
                  {user.role === "PROFESSIONAL"
                    ? "Editar minha agenda"
                    : "Editar profissional e agenda"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
