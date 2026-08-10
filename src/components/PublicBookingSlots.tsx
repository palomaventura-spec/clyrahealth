"use client";
import { useMemo, useState, useTransition } from "react";

type Slot = { value: string; label: string };

export function PublicBookingSlots({
  slots, professionalName, dateLabel, action, hiddenFields = {}
}: {
  slots: Slot[];
  professionalName: string;
  dateLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string,string>;
}) {
  const [selected,setSelected] = useState("");
  const [pending,startTransition] = useTransition();
  const selectedLabel = useMemo(() => slots.find(s => s.value === selected)?.label ?? "", [selected,slots]);

  return <div className="public-booking-confirm">
    <div className="slot-grid">
      {slots.map(slot => <button type="button" key={slot.value}
        className={`slot-button ${selected===slot.value ? "slot-selected":""}`}
        onClick={() => setSelected(slot.value)}>
        {slot.label}
      </button>)}
    </div>
    {selected && <div className="booking-summary">
      <h3>Confirme seu agendamento</h3>
      <div><span>Profissional</span><strong>{professionalName}</strong></div>
      <div><span>Data</span><strong>{dateLabel}</strong></div>
      <div><span>Horário</span><strong>{selectedLabel}</strong></div>
      <form action={(fd) => startTransition(() => void action(fd))}>
        {Object.entries(hiddenFields).map(([k,v]) => <input key={k} type="hidden" name={k} value={v}/>)}
        <input type="hidden" name="time" value={selected}/>
        <button className="btn btn-primary btn-full" disabled={pending}>
          {pending ? "Confirmando..." : "Confirmar agendamento"}
        </button>
      </form>
    </div>}
  </div>;
}
