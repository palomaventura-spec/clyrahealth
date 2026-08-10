import Link from "next/link";
import { createTrialCompanyAction } from "@/modules/onboarding/actions";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const q = await searchParams;
  return <main className="public-shell">
    <section className="public-card">
      <span className="eyebrow">ClyraHealth</span>
      <h1>Teste grátis por 7 dias</h1>
      <p>Crie sua conta sem cartão.</p>
      {q.erro === "email" && <div className="alert alert-error">Este e-mail já possui uma conta.</div>}
      <form action={createTrialCompanyAction} className="stack-form">
        <label>Tipo<select name="organizationKind" defaultValue="CLINIC">
          <option value="SOLO">Profissional autônomo</option>
          <option value="CLINIC">Clínica</option>
          <option value="HOSPITAL">Hospital</option>
          <option value="OTHER">Outro</option>
        </select></label>
        <label>Nome da operação<input name="organizationName" required/></label>
        <label>Responsável<input name="ownerName" required/></label>
        <label>E-mail<input name="email" type="email" required/></label>
        <label>Senha<input name="password" type="password" minLength={8} required/></label>
        <button className="btn btn-primary btn-full">Começar 7 dias grátis</button>
      </form>
      <p className="public-footnote">Já possui conta? <Link href="/login">Entrar</Link></p>
    </section>
  </main>;
}
