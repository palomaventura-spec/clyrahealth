import Link from "next/link";

import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { createTrialCompanyAction } from "@/modules/onboarding/actions";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;

  return (
    <main className="public-shell">
      <section className="public-card">
        <span className="eyebrow">ClyraHealth</span>
        <h1>Teste grátis por 7 dias</h1>
        <p>Crie sua conta sem cartão.</p>

        {query.erro === "email" && (
          <div className="alert alert-error">
            <strong>Este e-mail já possui uma conta.</strong>
            <p>Se você acabou de cadastrar, seu ambiente provavelmente já foi criado.</p>
            <Link className="btn btn-secondary btn-small" href="/login">
              Entrar na minha conta
            </Link>
          </div>
        )}

        {query.erro === "dados" && (
          <div className="alert alert-error">
            Revise os dados. A senha deve ter pelo menos 8 caracteres.
          </div>
        )}

        <form action={createTrialCompanyAction} className="stack-form">
          <label>
            Tipo
            <select name="organizationKind" defaultValue="CLINIC">
              <option value="SOLO">Profissional autônomo</option>
              <option value="CLINIC">Clínica</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>

          <label>
            Nome da operação
            <input name="organizationName" required />
          </label>

          <label>
            Responsável
            <input name="ownerName" required />
          </label>

          <label>
            E-mail
            <input name="email" type="email" required />
          </label>

          <label>
            Senha
            <input name="password" type="password" minLength={8} required />
          </label>

          <PendingSubmitButton
            idle="Criar ambiente"
            pending="Criando seu ambiente..."
            className="btn btn-primary btn-full"
          />
        </form>

        <p className="public-footnote">
          Já possui conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
