import Link from "next/link";
import { CalendarCheck, Users, Building2, Sparkles, ShieldCheck, Stethoscope } from "lucide-react";

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <Link href="/" className="brand">Clyra<span>Health</span></Link>
        <div className="header-actions">
          <Link href="/login" className="btn btn-secondary">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">Começar teste</Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={16}/> Gestão inteligente para saúde</div>
          <h1>Agenda, equipe e pacientes em um só lugar.</h1>
          <p>
            Um SaaS multiempresa para médicos, dentistas, fisioterapeutas, psicólogos,
            nutricionistas e clínicas multidisciplinares.
          </p>
          <div className="hero-actions">
            <Link href="/cadastro" className="btn btn-primary btn-lg">Criar minha clínica</Link>
            <Link href="/agendar/clinica-demo" className="btn btn-secondary btn-lg">Ver agendamento público</Link>
          </div>
          <small>Teste local sem cobrança. Integrações externas ficam preparadas para a próxima etapa.</small>
        </div>
        <div className="hero-panel card">
          <div className="mini-title">Hoje na clínica</div>
          <div className="hero-kpis">
            <div><strong>12</strong><span>consultas</span></div>
            <div><strong>87%</strong><span>ocupação</span></div>
            <div><strong>4</strong><span>profissionais</span></div>
          </div>
          <div className="appointment-preview">
            <span>09:00</span><div><strong>Mariana Alves</strong><small>Dra. Ana Martins · Cardiologia</small></div>
          </div>
          <div className="appointment-preview">
            <span>10:30</span><div><strong>Carlos Mendes</strong><small>Dr. Lucas · Odontologia</small></div>
          </div>
          <div className="appointment-preview">
            <span>13:00</span><div><strong>Fernanda Lima</strong><small>Carla Souza · Fisioterapia</small></div>
          </div>
        </div>
      </section>

      <section className="features-grid">
        <div className="card feature"><CalendarCheck/><h3>Agenda centralizada</h3><p>Consultas, bloqueios e disponibilidade por profissional.</p></div>
        <div className="card feature"><Stethoscope/><h3>Multidisciplinar</h3><p>CRM, CRO, CREFITO e outros conselhos no mesmo sistema.</p></div>
        <div className="card feature"><Users/><h3>Pacientes</h3><p>Cadastro e histórico de agendamentos por clínica.</p></div>
        <div className="card feature"><Building2/><h3>Multiempresa</h3><p>Cada clínica opera em ambiente lógico isolado.</p></div>
        <div className="card feature"><ShieldCheck/><h3>Perfis e permissões</h3><p>Owner, admin, recepção e profissional.</p></div>
        <div className="card feature"><Sparkles/><h3>Pronto para IA</h3><p>Arquitetura preparada para automação e WhatsApp.</p></div>
      </section>
    </main>
  );
}
