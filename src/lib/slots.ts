import { prisma } from "@/lib/prisma";
import { weekdayInTimeZone, zonedDateTimeToUtc } from "@/lib/timezone";

function hhmmToMinutes(value:string){const [h,m]=value.split(":").map(Number);return h*60+m}
function minutesToHHMM(value:number){return `${Math.floor(value/60).toString().padStart(2,"0")}:${(value%60).toString().padStart(2,"0")}`}

export async function getAvailableSlots(companyId:string,professionalId:string,date:string):Promise<string[]>{
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) return [];

  const professional=await prisma.professional.findFirst({
    where:{id:professionalId,companyId,active:true},
    select:{id:true,appointmentDuration:true}
  });
  if(!professional) return [];

  const timeZone="America/Sao_Paulo";
  const weekday=weekdayInTimeZone(date,timeZone);

  const availabilities=await prisma.availability.findMany({
    where:{professionalId,weekday},
    select:{startTime:true,endTime:true},
    orderBy:{startTime:"asc"}
  });
  if(!availabilities.length) return [];

  const dayStart=zonedDateTimeToUtc(date,"00:00",timeZone);
  const dayEnd=zonedDateTimeToUtc(date,"23:59",timeZone);

  const [appointments,blocks]=await Promise.all([
    prisma.appointment.findMany({
      where:{companyId,professionalId,status:{not:"CANCELLED"},startsAt:{gte:dayStart,lte:dayEnd}},
      select:{startsAt:true,endsAt:true}
    }),
    prisma.scheduleBlock.findMany({
      where:{companyId,professionalId,startsAt:{lte:dayEnd},endsAt:{gte:dayStart}},
      select:{startsAt:true,endsAt:true}
    })
  ]);

  const duration=professional.appointmentDuration;
  if(!Number.isFinite(duration)||duration<=0) return [];

  const result=new Set<string>();
  const now=new Date();

  for(const a of availabilities){
    const start=hhmmToMinutes(a.startTime),end=hhmmToMinutes(a.endTime);
    if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end) continue;

    for(let cursor=start;cursor+duration<=end;cursor+=duration){
      const hhmm=minutesToHHMM(cursor);
      const slotStart=zonedDateTimeToUtc(date,hhmm,timeZone);
      const slotEnd=new Date(slotStart.getTime()+duration*60000);
      if(slotStart<=now) continue;

      const busy=appointments.some(x=>x.startsAt<slotEnd&&x.endsAt>slotStart);
      const blocked=blocks.some(x=>x.startsAt<slotEnd&&x.endsAt>slotStart);
      if(!busy&&!blocked) result.add(hhmm);
    }
  }

  return Array.from(result).sort((a,b)=>a.localeCompare(b));
}
