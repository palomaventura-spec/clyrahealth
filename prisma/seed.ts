import { PrismaClient, AppointmentStatus, ProfessionalType, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash("12345678", 10);

  await prisma.user.create({
    data: {
      name: "CEO ClyraHealth",
      email: "ceo@clyrahealth.local",
      passwordHash,
      role: UserRole.SUPER_ADMIN
    }
  });

  const company = await prisma.company.create({
    data: {
      name: "Clínica Demo ClyraHealth",
      slug: "clinica-demo",
      email: "contato@clinicademo.com",
      phone: "(21) 99999-9999",
      city: "Rio de Janeiro",
      state: "RJ",
      onboardingCompleted: true,
      subscription: {
        create: {
          plan: "PRO",
          status: SubscriptionStatus.TRIAL,
          trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      }
    }
  });

  const owner = await prisma.user.create({
    data: {
      name: "Ana Administradora",
      email: "admin@demo.com",
      passwordHash,
      role: UserRole.OWNER,
      companyId: company.id
    }
  });

  const cardio = await prisma.specialty.create({
    data: { name: "Cardiologia", companyId: company.id }
  });
  const odonto = await prisma.specialty.create({
    data: { name: "Odontologia", companyId: company.id }
  });
  const fisio = await prisma.specialty.create({
    data: { name: "Fisioterapia", companyId: company.id }
  });

  const profUser = await prisma.user.create({
    data: {
      name: "Dra. Ana Martins",
      email: "profissional@demo.com",
      passwordHash,
      role: UserRole.PROFESSIONAL,
      companyId: company.id
    }
  });

  const prof1 = await prisma.professional.create({
    data: {
      name: "Dra. Ana Martins",
      email: "ana@clinicademo.com",
      phone: "(21) 98888-1111",
      type: ProfessionalType.DOCTOR,
      council: "CRM",
      registrationNumber: "123456-RJ",
      specialtyId: cardio.id,
      companyId: company.id,
      userId: profUser.id,
      appointmentDuration: 30,
      bio: "Cardiologista com foco em prevenção e acompanhamento clínico.",
      availabilities: {
        create: [
          { weekday: 1, startTime: "09:00", endTime: "17:00" },
          { weekday: 3, startTime: "09:00", endTime: "17:00" },
          { weekday: 5, startTime: "09:00", endTime: "13:00" }
        ]
      }
    }
  });

  const prof2 = await prisma.professional.create({
    data: {
      name: "Dr. Lucas Ferreira",
      email: "lucas@clinicademo.com",
      type: ProfessionalType.DENTIST,
      council: "CRO",
      registrationNumber: "98765-RJ",
      specialtyId: odonto.id,
      companyId: company.id,
      appointmentDuration: 45,
      availabilities: {
        create: [
          { weekday: 2, startTime: "08:00", endTime: "18:00" },
          { weekday: 4, startTime: "08:00", endTime: "18:00" }
        ]
      }
    }
  });

  const prof3 = await prisma.professional.create({
    data: {
      name: "Carla Souza",
      email: "carla@clinicademo.com",
      type: ProfessionalType.PHYSIOTHERAPIST,
      council: "CREFITO",
      registrationNumber: "54321-F",
      specialtyId: fisio.id,
      companyId: company.id,
      appointmentDuration: 50,
      availabilities: {
        create: [
          { weekday: 1, startTime: "07:00", endTime: "14:00" },
          { weekday: 2, startTime: "07:00", endTime: "14:00" },
          { weekday: 4, startTime: "07:00", endTime: "14:00" }
        ]
      }
    }
  });

  const p1 = await prisma.patient.create({
    data: {
      name: "Mariana Alves",
      email: "mariana@example.com",
      phone: "(21) 97777-1111",
      companyId: company.id
    }
  });
  const p2 = await prisma.patient.create({
    data: {
      name: "Carlos Mendes",
      email: "carlos@example.com",
      phone: "(21) 97777-2222",
      companyId: company.id
    }
  });
  const p3 = await prisma.patient.create({
    data: {
      name: "Fernanda Lima",
      email: "fernanda@example.com",
      phone: "(21) 97777-3333",
      companyId: company.id
    }
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        companyId: company.id,
        professionalId: prof1.id,
        patientId: p1.id,
        startsAt: tomorrow,
        endsAt: new Date(tomorrow.getTime() + 30 * 60 * 1000),
        status: AppointmentStatus.CONFIRMED,
        reason: "Consulta de acompanhamento"
      },
      {
        companyId: company.id,
        professionalId: prof2.id,
        patientId: p2.id,
        startsAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        endsAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000),
        status: AppointmentStatus.SCHEDULED,
        reason: "Avaliação odontológica"
      },
      {
        companyId: company.id,
        professionalId: prof3.id,
        patientId: p3.id,
        startsAt: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
        endsAt: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000 + 50 * 60 * 1000),
        status: AppointmentStatus.SCHEDULED,
        reason: "Fisioterapia"
      }
    ]
  });

  console.log("Seed concluído.");
  console.log("Admin clínica: admin@demo.com / 12345678");
  console.log("Profissional: profissional@demo.com / 12345678");
  console.log("Super admin SaaS: ceo@clyrahealth.local / 12345678");
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
