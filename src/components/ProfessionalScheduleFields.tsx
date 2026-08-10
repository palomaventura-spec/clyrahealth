const DAYS = [
  [1,"Segunda"],[2,"Terça"],[3,"Quarta"],[4,"Quinta"],[5,"Sexta"],[6,"Sábado"],[0,"Domingo"]
] as const;

type Availability = { weekday:number; startTime:string; endTime:string };

export function ProfessionalScheduleFields({ availabilities = [] }: { availabilities?: Availability[] }) {
  const periods = (weekday:number) => availabilities.filter(a => a.weekday === weekday).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  return <fieldset className="schedule-fieldset">
    <legend>Agenda do profissional</legend>
    <p className="muted">Defina os dias e até dois períodos de atendimento por dia. Você poderá editar depois.</p>
    <div className="weekly-schedule">
      {DAYS.map(([weekday,label]) => {
        const existing = periods(weekday);
        const first = existing[0]; const second = existing[1];
        return <div className="schedule-day" key={weekday}>
          <label className="schedule-day-toggle"><input type="checkbox" name={`availability_${weekday}_enabled`} defaultChecked={existing.length > 0}/><strong>{label}</strong></label>
          <div className="schedule-periods">
            <div><span>1º período</span><input type="time" name={`availability_${weekday}_start1`} defaultValue={first?.startTime ?? "09:00"}/><span>até</span><input type="time" name={`availability_${weekday}_end1`} defaultValue={first?.endTime ?? "12:00"}/></div>
            <div><span>2º período (opcional)</span><input type="time" name={`availability_${weekday}_start2`} defaultValue={second?.startTime ?? ""}/><span>até</span><input type="time" name={`availability_${weekday}_end2`} defaultValue={second?.endTime ?? ""}/></div>
          </div>
        </div>;
      })}
    </div>
  </fieldset>;
}
