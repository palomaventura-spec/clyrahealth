import { completeOnboardingAction } from "@/app/actions";
import { requireCompany } from "@/lib/auth";

export default async function OnboardingPage() {
  const { user } = await requireCompany();
  return (
    <main className="auth-page">
      <div className="auth-card card wide">
        <div className="brand">Clyra<span>Health</span></div>
        <div className="eyebrow">Configuração inicial</div>
        <h1>Olá, {user.name}!</h1>
        <p>Complete os dados básicos. Profissionais, especialidades e agenda serão configurados dentro do painel.</p>
        <form action={completeOnboardingAction} className="form-grid">
          <label>Telefone<input name="phone" /></label>
          <label>E-mail da clínica<input name="email" type="email" /></label>
          <label className="span-2">Endereço<input name="address" /></label>
          <label>Cidade<input name="city" /></label>
          <label>Estado<input name="state" maxLength={2} /></label>
          <button className="btn btn-primary span-2">Concluir e abrir painel</button>
        </form>
      </div>
    </main>
  );
}
