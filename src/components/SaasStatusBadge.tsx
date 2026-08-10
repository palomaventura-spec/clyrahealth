export function SaasStatusBadge({
  status,
  active = true
}: {
  status?: string | null;
  active?: boolean;
}) {
  const label = !active ? "BLOQUEADO" : (status ?? "SEM PLANO");
  const normalized = label.toLowerCase().replace("_", "-");
  return <span className={`saas-status saas-status-${normalized}`}>{label}</span>;
}
