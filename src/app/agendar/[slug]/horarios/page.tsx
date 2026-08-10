import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { patientBookAppointmentAction } from "@/app/actions";
import { getPatientForCompany } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";
import { PublicBookingSlots } from "@/components/PublicBookingSlots";
import { BookingSearchForm } from "@/components/BookingSearchForm";
export default async function BookingSlotsPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {slug}=await params; const query=await searchParams;
  const company=await prisma.company.findUnique({where:{slug},include:{professionals:{where:{active:true},include:{specialty:true},orderBy:{name:"asc"}}}}); if(!company) notFound();
  const patient=await getPatientForCompany(slug); if(!patient) redirect(`/agendar/${slug}`);
  const selected=company.professionals.find(p=>p.id===query.profissional||p.publicSlug===query.profissional)??null; const date=query.date??"";
  const slots=selected&&date?await getAvailableSlots(company.id,selected.id,date):[];
  return <main className="booking-page"><header className="booking-header"><Link href="/" className="brand">Clyra<span>Health</span></Link><div><strong>{company.name}</strong><small>Olá, {patient.name}</small></div></header>
    <div className="booking-container"><div className="stepper"><span className="done">✓</span><i></i><span className="done">✓</span><i></i><span className="active">3</span></div><span className="eyebrow">Escolha seu atendimento</span><h1>Data e horário</h1><p>Mostramos apenas os horários realmente disponíveis na agenda de cada profissional.</p>
      {query.erro==="ocupado"&&<div className="alert alert-error">Esse horário não está mais disponível. Escolha outro.</div>}
      <BookingSearchForm slug={slug} selectedId={selected?.id??""} date={date} professionals={company.professionals.map(p=>({id:p.id,name:p.name,label:p.specialty?.name??p.type}))}/>
      {selected&&date&&<section className="card section-card"><div className="section-title"><div><h2>{selected.name}</h2><p>{selected.specialty?.name??"Profissional da saúde"} · {selected.appointmentDuration} min</p></div></div>
        {slots.length>0?<PublicBookingSlots slots={slots.map(time=>({value:time,label:time}))} professionalName={selected.name} dateLabel={date} action={patientBookAppointmentAction} hiddenFields={{slug,professionalId:selected.id,date}}/>:<div className="empty-state"><strong>Nenhum horário livre para esta data.</strong><p>Tente outra data acima. A disponibilidade é definida individualmente para cada profissional.</p></div>}
      </section>}
      <Link href={`/paciente/${slug}`} className="btn btn-secondary">Ver minhas consultas</Link>
    </div></main>;
}
