import Link from "next/link";
import { loginAction } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <div className="auth-card card">
        <Link href="/" className="brand">Clyra<span>Health</span></Link>
        <h1>Entrar</h1>
        <p>Acesse o painel da sua clínica.</p>
        {params.erro && <div className="alert alert-error">E-mail ou senha inválidos.</div>}
        <form action={loginAction} className="form-stack">
          <label>E-mail<input name="email" type="email" required /></label>
          <label>Senha<input name="password" type="password" required /></label>
          <button className="btn btn-primary" type="submit">Entrar</button>
        </form>
        <a href="/esqueci-senha" className="auth-link">Esqueci minha senha</a>
        <div className="demo-box">
          <strong>Conta demo</strong>
          <span>admin@demo.com</span>
          <span>Senha: 12345678</span>
        </div>
        <p className="muted">Ainda não possui conta? <Link href="/cadastro">Criar clínica</Link></p>
      </div>
    </main>
  );
}
