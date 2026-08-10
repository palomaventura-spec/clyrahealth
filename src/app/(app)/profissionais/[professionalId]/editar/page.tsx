import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateProfessionalAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfessionalClinicalFields } from "@/components/ProfessionalClinicalFields";
import { ProfessionalScheduleFields } from "@/components/ProfessionalScheduleFields";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ professionalId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { professionalId } = await params;
  const query = await searchParams;
  const { user, companyId } = await requireCompany();

  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, companyId },
    include: {
      availabilities: {
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }]
      },
      specialty: true
    }
  });

  if (!professional) notFound();

  const canManage = ["OWNER", "ADMIN"].includes(user.role);
  const isSelf =
    user.role === "PROFESSIONAL" &&
    user.professional?.id === professional.id;

  if (!canManage && !isSelf) redirect("/profissionais");

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/profissionais" className="back-link">
            ← Voltar
          </Link>
          <span className="eyebrow">Profissional</span>
          <h1>{professional.name}</h1>
          <p>
            {isSelf
              ? "Personalize a duração, os dias e os horários da sua agenda."
              : "Edite os dados, a especialidade e a agenda individual deste profissional."}
          </p>
        </div>
      </div>

      {query.sucesso && (
        <div className="alert alert-success">
          ✓ Profissional e agenda atualizados com sucesso.
        </div>
      )}

      <section className="card section-card">
        <form action={updateProfessionalAction} className="form-grid professional-form">
          <input type="hidden" name="id" value={professional.id} />

          <label>
            Nome
            <input
              name="name"
              defaultValue={professional.name}
              required
              disabled={isSelf}
            />
            {isSelf && (
              <input type="hidden" name="name" value={professional.name} />
            )}
          </label>

          <label>
            Telefone
            <input
              name="phone"
              defaultValue={professional.phone ?? ""}
              disabled={isSelf}
            />
            {isSelf && (
              <input
                type="hidden"
                name="phone"
                value={professional.phone ?? ""}
              />
            )}
          </label>

          <ProfessionalClinicalFields
            defaultType={professional.type}
            defaultSpecialty={professional.specialty?.name ?? ""}
            disabled={isSelf}
          />

          {isSelf && (
            <input
              type="hidden"
              name="preserveSpecialtyId"
              value={professional.specialtyId ?? ""}
            />
          )}

          <label>
            Conselho
            <input
              name="council"
              defaultValue={professional.council ?? ""}
              disabled={isSelf}
            />
            {isSelf && (
              <input
                type="hidden"
                name="council"
                value={professional.council ?? ""}
              />
            )}
          </label>

          <label>
            Registro
            <input
              name="registrationNumber"
              defaultValue={professional.registrationNumber ?? ""}
              disabled={isSelf}
            />
            {isSelf && (
              <input
                type="hidden"
                name="registrationNumber"
                value={professional.registrationNumber ?? ""}
              />
            )}
          </label>

          <label>
            Duração da consulta (min)
            <input
              name="appointmentDuration"
              type="number"
              defaultValue={professional.appointmentDuration}
              min={10}
              max={240}
              step={5}
              required
            />
          </label>

          <div className="span-2 schedule-highlight">
            <ProfessionalScheduleFields
              availabilities={professional.availabilities}
            />
          </div>

          <PendingSubmitButton
            idle="Salvar profissional e agenda"
            pending="Salvando agenda..."
            className="btn btn-primary span-2"
          />
        </form>
      </section>
    </div>
  );
}
