"use client";

import { useMemo, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { moveAppointmentAction } from "@/app/actions";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  professional: string;
  patient: string;
  reason?: string | null;
};

const statusClass: Record<string, string> = {
  SCHEDULED: "calendar-scheduled",
  CONFIRMED: "calendar-confirmed",
  COMPLETED: "calendar-completed",
  CANCELLED: "calendar-cancelled",
  NO_SHOW: "calendar-no-show"
};

export function CalendarBoard({
  events,
  editable = true
}: {
  events: CalendarEvent[];
  editable?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: `${event.patient} · ${event.professional}`,
        start: event.start,
        end: event.end,
        classNames: [statusClass[event.status] ?? "calendar-scheduled"],
        extendedProps: event
      })),
    [events]
  );

  function persistMove(info: any) {
    const start = info.event.start;
    const end = info.event.end;

    if (!start || !end) {
      info.revert();
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await moveAppointmentAction({
        id: info.event.id,
        startsAt: start.toISOString(),
        endsAt: end.toISOString()
      });

      if (!result.ok) {
        info.revert();
        setMessage(result.message ?? "Não foi possível alterar o horário.");
      } else {
        setMessage("Horário atualizado.");
      }
    });
  }

  return (
    <div className="calendar-wrapper">
      {message && (
        <div className={`alert ${message.includes("atualizado") ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}

      {isPending && <div className="calendar-saving">Salvando alteração…</div>}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locale={ptBrLocale}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia"
        }}
        events={calendarEvents}
        editable={editable}
        eventStartEditable={editable}
        eventDurationEditable={editable}
        nowIndicator
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        height="auto"
        expandRows
        stickyHeaderDates
        dayMaxEvents={4}
        eventDrop={persistMove}
        eventResize={persistMove}
        eventContent={(arg) => {
          const event = arg.event.extendedProps as CalendarEvent;
          return (
            <div className="calendar-event-content">
              <strong>{arg.timeText}</strong>
              <span>{event.patient}</span>
              <small>{event.professional}</small>
            </div>
          );
        }}
      />
    </div>
  );
}
