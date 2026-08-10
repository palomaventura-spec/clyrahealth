import Link from "next/link";
import {
  Bot, CalendarDays, ClipboardPlus, FileText, LayoutDashboard, LogOut,
  MessageCircle, Settings, ShieldCheck, Stethoscope, UserCog, Users
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { companyHasFeature } from "@/modules/billing/services/features";
import { trialDaysRemaining } from "@/modules/billing/services/trial";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    return <div className="app-shell">
      <aside className="sidebar">
        <Link href="/saas-admin" className="brand">Clyra<span>Health</span></Link>
        <div className="sidebar-meta"><strong>Administração SaaS</strong></div>
        <nav><Link href="/saas-admin"><ShieldCheck size={18}/> Clientes</Link></nav>
        <form action={logoutAction} className="sidebar-bottom"><button type="submit" className="nav-button"><LogOut size={18}/> Sair</button></form>
      </aside>
      <main className="content">{children}</main>
    </div>;
  }

  const companyId = user.companyId!;
  const [hasWhatsapp, hasAI] = await Promise.all([
    companyHasFeature(companyId, "WHATSAPP"),
    companyHasFeature(companyId, "AI_RECEPTION")
  ]);
  const clinicalMenu = user.role === "OWNER" || user.role === "PROFESSIONAL";
  const subscription = user.company?.subscription;
  const trialWarning = subscription?.status === "TRIAL" && subscription.trialEnds
    ? trialDaysRemaining(subscription.trialEnds) : null;

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/dashboard" className="brand">Clyra<span>Health</span></Link>
      <div className="sidebar-meta"><strong>{user.company?.name ?? "ClyraHealth"}</strong><small>{user.name} · {user.role}</small></div>
      <nav>
        <Link href="/dashboard"><LayoutDashboard size={18}/> Dashboard</Link>
        <Link href="/agenda"><CalendarDays size={18}/> Agenda</Link>
        <Link href="/atendimentos"><ClipboardPlus size={18}/> Atendimentos</Link>
        {clinicalMenu && <Link href="/documentos"><FileText size={18}/> Documentos</Link>}
        <Link href="/profissionais"><Stethoscope size={18}/> Profissionais</Link>
        <Link href="/pacientes"><Users size={18}/> Pacientes</Link>
        {["OWNER","ADMIN"].includes(user.role) && <Link href="/equipe"><UserCog size={18}/> Equipe</Link>}
        {["OWNER","ADMIN"].includes(user.role) && <Link href="/comunicacao"><MessageCircle size={18}/> Comunicação{hasWhatsapp ? "" : " · Premium"}</Link>}
        {user.role === "OWNER" && <Link href="/ia"><Bot size={18}/> IA{hasAI ? "" : " · Premium"}</Link>}
        {user.role === "OWNER" && <Link href="/assinatura"><ShieldCheck size={18}/> Assinatura</Link>}
        {user.role === "OWNER" && <Link href="/planos"><ShieldCheck size={18}/> Plano</Link>}
        {user.role === "OWNER" && <Link href="/auditoria"><ShieldCheck size={18}/> Auditoria</Link>}
        {["OWNER","ADMIN"].includes(user.role) && <Link href="/configuracoes"><Settings size={18}/> Configurações</Link>}
      </nav>
      <form action={logoutAction} className="sidebar-bottom"><button type="submit" className="nav-button"><LogOut size={18}/> Sair</button></form>
    </aside>
    <main className="content">
      {trialWarning !== null && trialWarning <= 5 && <div className={`trial-banner ${trialWarning <= 1 ? "trial-banner-danger" : ""}`}>
        {trialWarning > 0 ? `Seu teste gratuito termina em ${trialWarning} dia(s).` : "Seu período de teste terminou."}
        {user.role === "OWNER" && <> <Link href="/assinatura">Ver assinatura</Link></>}
      </div>}
      {children}
    </main>
  </div>;
}
