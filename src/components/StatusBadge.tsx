const labels: Record<string,string>={SCHEDULED:"Agendada",CONFIRMED:"Confirmada",ARRIVED:"Paciente chegou",IN_PROGRESS:"Em atendimento",COMPLETED:"Concluída",CANCELLED:"Cancelada",NO_SHOW:"Falta"};
export function StatusBadge({status}:{status:string}){return <span className={`badge badge-${status.toLowerCase()}`}>{labels[status]??status}</span>}
