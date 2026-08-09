import { PrismaClient, AppointmentStatus, PlanFeatureKey, ProfessionalType, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma=new PrismaClient();
async function main(){
  await prisma.auditLog.deleteMany(); await prisma.passwordResetToken.deleteMany();
  await prisma.conversationMessage.deleteMany(); await prisma.conversation.deleteMany(); await prisma.notification.deleteMany(); await prisma.automationRule.deleteMany(); await prisma.planFeature.deleteMany();
  await prisma.clinicalDocument.deleteMany(); await prisma.clinicalNote.deleteMany(); await prisma.consultation.deleteMany(); await prisma.medicalRecord.deleteMany();
  await prisma.patientSession.deleteMany(); await prisma.session.deleteMany(); await prisma.scheduleBlock.deleteMany(); await prisma.appointment.deleteMany(); await prisma.availability.deleteMany();
  await prisma.professional.deleteMany(); await prisma.patient.deleteMany(); await prisma.specialty.deleteMany(); await prisma.user.deleteMany(); await prisma.unit.deleteMany(); await prisma.subscription.deleteMany(); await prisma.company.deleteMany();
  const passwordHash=await bcrypt.hash("12345678",10);
  await prisma.user.create({data:{name:"CEO ClyraHealth",email:"ceo@clyrahealth.local",passwordHash,role:UserRole.SUPER_ADMIN}});
  const company=await prisma.company.create({data:{name:"Clínica Demo ClyraHealth",slug:"clinica-demo",email:"contato@clinicademo.com",phone:"(21) 99999-9999",city:"Rio de Janeiro",state:"RJ",onboardingCompleted:true,subscription:{create:{plan:"PRO_AI",status:SubscriptionStatus.TRIAL,trialEnds:new Date(Date.now()+14*86400000)}},units:{create:{name:"Unidade Principal",city:"Rio de Janeiro",state:"RJ"}}}});
  await prisma.planFeature.createMany({data:[PlanFeatureKey.WHATSAPP,PlanFeatureKey.AI_RECEPTION,PlanFeatureKey.AI_ASSISTANT,PlanFeatureKey.ADVANCED_AUTOMATIONS].map(feature=>({companyId:company.id,feature,enabled:true}))});
  await prisma.user.create({data:{name:"Ana Administradora",email:"admin@demo.com",passwordHash,role:UserRole.OWNER,companyId:company.id}});
  await prisma.user.create({data:{name:"Maria Secretária",email:"recepcao@demo.com",passwordHash,role:UserRole.RECEPTIONIST,companyId:company.id}});
  const cardio=await prisma.specialty.create({data:{name:"Cardiologia",companyId:company.id}}); const odonto=await prisma.specialty.create({data:{name:"Odontologia",companyId:company.id}}); const fisio=await prisma.specialty.create({data:{name:"Fisioterapia",companyId:company.id}});
  async function professional(data:{name:string,email:string,type:ProfessionalType,council:string,reg:string,specialtyId:string,duration:number,slug:string}){const u=await prisma.user.create({data:{name:data.name,email:data.email,passwordHash,role:UserRole.PROFESSIONAL,companyId:company.id}});return prisma.professional.create({data:{name:data.name,email:data.email,type:data.type,council:data.council,registrationNumber:data.reg,specialtyId:data.specialtyId,appointmentDuration:data.duration,publicSlug:data.slug,companyId:company.id,userId:u.id,availabilities:{create:[1,2,3,4,5].map(weekday=>({weekday,startTime:"09:00",endTime:"17:00"}))}}});}
  const prof1=await professional({name:"Dra. Ana Martins",email:"ana@demo.com",type:ProfessionalType.DOCTOR,council:"CRM",reg:"123456-RJ",specialtyId:cardio.id,duration:30,slug:"dra-ana-martins"});
  const prof2=await professional({name:"Dr. Lucas Ferreira",email:"lucas@demo.com",type:ProfessionalType.DENTIST,council:"CRO",reg:"98765-RJ",specialtyId:odonto.id,duration:45,slug:"dr-lucas-ferreira"});
  const prof3=await professional({name:"Carla Souza",email:"carla@demo.com",type:ProfessionalType.PHYSIOTHERAPIST,council:"CREFITO",reg:"54321-F",specialtyId:fisio.id,duration:50,slug:"carla-souza"});
  const p1=await prisma.patient.create({data:{name:"Mariana Alves",document:"12345678901",birthDate:new Date("1990-05-15T12:00:00"),email:"mariana@example.com",phone:"5521977771111",companyId:company.id}});
  const p2=await prisma.patient.create({data:{name:"Carlos Mendes",document:"98765432100",birthDate:new Date("1985-09-20T12:00:00"),email:"carlos@example.com",phone:"5521977772222",companyId:company.id}});
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);tomorrow.setHours(10,0,0,0);
  await prisma.appointment.createMany({data:[{companyId:company.id,professionalId:prof1.id,patientId:p1.id,startsAt:tomorrow,endsAt:new Date(tomorrow.getTime()+30*60000),status:AppointmentStatus.CONFIRMED,reason:"Consulta de acompanhamento"},{companyId:company.id,professionalId:prof2.id,patientId:p2.id,startsAt:new Date(tomorrow.getTime()+2*3600000),endsAt:new Date(tomorrow.getTime()+2*3600000+45*60000),status:AppointmentStatus.SCHEDULED,reason:"Avaliação odontológica"}]});
  console.log("ClyraHealth v1.0 seed concluído");
  console.log("Owner: admin@demo.com / 12345678"); console.log("Recepção: recepcao@demo.com / 12345678");
  console.log("Dra Ana: ana@demo.com / 12345678"); console.log("Dr Lucas: lucas@demo.com / 12345678"); console.log("Carla: carla@demo.com / 12345678"); console.log("Super Admin: ceo@clyrahealth.local / 12345678");
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
