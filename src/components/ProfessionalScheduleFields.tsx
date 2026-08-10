"use client";

import { useMemo, useState } from "react";

const DAYS=[
  [1,"Segunda-feira"],[2,"Terça-feira"],[3,"Quarta-feira"],
  [4,"Quinta-feira"],[5,"Sexta-feira"],[6,"Sábado"],[0,"Domingo"]
] as const;

type Availability={weekday:number;startTime:string;endTime:string};
type DayState={enabled:boolean;start1:string;end1:string;start2:string;end2:string};

function initialState(availabilities:Availability[]) {
  const state:Record<number,DayState>={};
  for(const [weekday] of DAYS){
    const p=availabilities.filter(a=>a.weekday===weekday).sort((a,b)=>a.startTime.localeCompare(b.startTime));
    state[weekday]={
      enabled:p.length>0,
      start1:p[0]?.startTime??"09:00",
      end1:p[0]?.endTime??"12:00",
      start2:p[1]?.startTime??"",
      end2:p[1]?.endTime??""
    };
  }
  return state;
}

export function ProfessionalScheduleFields({availabilities=[]}:{availabilities?:Availability[]}) {
  const initial=useMemo(()=>initialState(availabilities),[availabilities]);
  const [days,setDays]=useState<Record<number,DayState>>(initial);

  function patch(weekday:number,data:Partial<DayState>){
    setDays(current=>({...current,[weekday]:{...current[weekday],...data}}));
  }

  return <fieldset className="schedule-fieldset">
    <legend>Agenda personalizada</legend>
    <div className="schedule-intro">
      <strong>Configure os dias e horários deste profissional.</strong>
      <p>Cada profissional possui sua própria agenda. Ative somente os dias em que atende.</p>
    </div>

    <div className="weekly-schedule">
      {DAYS.map(([weekday,label])=>{
        const d=days[weekday];
        return <div className={`schedule-day ${d.enabled?"schedule-day-active":""}`} key={weekday}>
          <div className="schedule-day-header">
            <label className="schedule-day-toggle">
              <input type="checkbox" name={`availability_${weekday}_enabled`}
                checked={d.enabled} onChange={e=>patch(weekday,{enabled:e.target.checked})}/>
              <strong>{label}</strong>
            </label>
            <span className="schedule-status">{d.enabled?"Atende":"Não atende"}</span>
          </div>

          {d.enabled&&<div className="schedule-periods">
            <div className="schedule-period-row">
              <span>1º período</span>
              <input type="time" name={`availability_${weekday}_start1`} value={d.start1}
                onChange={e=>patch(weekday,{start1:e.target.value})} required/>
              <span>até</span>
              <input type="time" name={`availability_${weekday}_end1`} value={d.end1}
                onChange={e=>patch(weekday,{end1:e.target.value})} required/>
            </div>

            <div className="schedule-period-row">
              <span>2º período</span>
              <input type="time" name={`availability_${weekday}_start2`} value={d.start2}
                onChange={e=>patch(weekday,{start2:e.target.value})}/>
              <span>até</span>
              <input type="time" name={`availability_${weekday}_end2`} value={d.end2}
                onChange={e=>patch(weekday,{end2:e.target.value})}/>
            </div>
            <small className="field-help">Ex.: 08:00–12:00 e 14:00–18:00.</small>
          </div>}
        </div>;
      })}
    </div>
  </fieldset>;
}
