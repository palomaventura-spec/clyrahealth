import Link from "next/link";
import { registerCompanyAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

export default async function RegisterPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  return <main className="auth-page"><div className="auth-card card wide">
    <Link href="/" className="brand">Clyra<span>Health</span></Link>
    <h1>Crie sua clínica</h1><p>O ambiente da sua empresa será criado automaticamente.</p>
    {params.erro==="email"&&<div className="alert alert-error"><strong>Este e-mail já possui uma conta.</strong><br/><Link href="/login">Entrar para continuar →</Link></div>}
    {params.erro==="dados"&&<div className="alert alert-error">Revise os dados. A senha deve ter ao menos 8 caracteres.</div>}
    <form action={registerCompanyAction} className="form-grid">
      <label>Nome da clínica/consultório<input name="companyName" required/></label>
      <label>Seu nome<input name="name" required/></label><label>E-mail<input name="email" type="email" required/></label>
      <label>Senha<input name="password" type="password" minLength={8} required/></label>
      <PendingSubmitButton idle="Criar ambiente" pending="Criando seu ambiente..." className="btn btn-primary span-2"/>
    </form>
    <p className="muted">Já possui conta? <Link href="/login">Entrar</Link></p>
  </div></main>;
}
