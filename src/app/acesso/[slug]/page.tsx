import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loginAction } from "@/app/actions";

export default async function Page({ params, searchParams }: {
  params: Promise<{slug:string}>;
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const { slug } = await params;
  const q = await searchParams;
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) notFound();

  const clinicName=company.publicName??company.name;

  return <main className="tenant-login-shell" style={{"--primary":company.accentColor??"#2563eb"} as React.CSSProperties}>
    <section className="tenant-login-card">
      {company.logoUrl
        ? <img className="tenant-logo" src={company.logoUrl} alt={`Logo ${clinicName}`}/>
        : <span className="eyebrow">ClyraHealth</span>}
      <h1>{clinicName}</h1>
      <p>{company.loginHeadline ?? "Acesse sua conta."}</p>
      {q.cadastro === "sucesso" && <div className="alert alert-success">Conta criada. Seu teste gratuito começou.</div>}
      {q.erro === "credenciais" && <div className="alert alert-error">E-mail ou senha inválidos para esta clínica.</div>}
      {q.erro === "bloqueado" && <div className="alert alert-error">O acesso desta conta está temporariamente bloqueado. Entre em contato com a ClyraHealth.</div>}
      {q.erro === "assinatura" && <div className="alert alert-error">O período de acesso desta conta terminou. Peça ao responsável da clínica para regularizar a assinatura.</div>}
      <form action={loginAction} className="stack-form">
        <input type="hidden" name="companySlug" value={slug}/>
        <label>E-mail<input type="email" name="email" required/></label>
        <label>Senha<input type="password" name="password" required/></label>
        <button className="btn btn-primary btn-full">Entrar</button>
      </form>
      <div className="tenant-links">
        <Link href="/esqueci-senha">Esqueci minha senha</Link>
        <Link href={`/agendar/${slug}`}>Agendamento de pacientes</Link>
      </div>
    </section>
  </main>;
}
