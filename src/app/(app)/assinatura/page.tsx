import { requireCompany } from "@/lib/auth";
import { trialDaysRemaining } from "@/modules/billing/services/trial";

const plans = [
  ["Solo","R$ 99/mês","Para profissional individual."],
  ["Clinic","R$ 199/mês","Para clínicas e equipes."],
  ["Pro AI","R$ 349/mês","Clinic + WhatsApp + IA."]
];

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const query = await searchParams;
  const { user } = await requireCompany();
  const s = user.company?.subscription;
  const days = trialDaysRemaining(s?.trialEnds);

  return <div>
    {query.trial === "expirado" && <div className="alert alert-error">Seu período de teste terminou. Seus dados continuam preservados. Ative um plano para continuar.</div>}
    <div className="page-header"><div><span className="eyebrow">Assinatura</span><h1>Plano ClyraHealth</h1>
      <p>{s?.status==="TRIAL" ? `Seu teste gratuito tem ${days} dia(s) restante(s).` : "Gerencie seu plano."}</p></div></div>
    <div className="plan-grid">{plans.map(([name,price,desc]) => <section className="card section-card" key={name}>
      <h2>{name}</h2><strong className="plan-price">{price}</strong><p>{desc}</p>
      <button className="btn btn-primary" disabled>Assinar — disponível após ativar gateway</button>
    </section>)}</div>
    <div className="alert">Estrutura pronta para Asaas. Nenhuma cobrança real é criada enquanto BILLING_PROVIDER=none.</div>
  </div>;
}
