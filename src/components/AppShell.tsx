import Link from "next/link";
import { CalendarDays, LayoutDashboard, Stethoscope, Users, UserCog, Settings, LogOut, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/saas-admin" className="brand">Clyra<span>Health</span></Link>
          <div className="sidebar-meta">Administração SaaS</div>
          <nav>
            <Link href="/saas-admin"><ShieldCheck size={18}/> Clientes</Link>
          </nav>
          <form action={logoutAction} className="sidebar-bottom">
            <button className="nav-button"><LogOut size={18}/> Sair</button>
          </form>
        </aside>
        <main className="content">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">Clyra<span>Health</span></Link>
        <div className="sidebar-meta">
          <strong>{user.company?.name}</strong>
          <small>{user.name} · {user.role}</small>
        </div>
        <nav>
          <Link href="/dashboard"><LayoutDashboard size={18}/> Dashboard</Link>
          <Link href="/agenda"><CalendarDays size={18}/> Agenda</Link>
          <Link href="/profissionais"><Stethoscope size={18}/> Profissionais</Link>
          <Link href="/pacientes"><Users size={18}/> Pacientes</Link>
          {["OWNER","ADMIN"].includes(user.role) && <Link href="/equipe"><UserCog size={18}/> Equipe</Link>}
          <Link href="/configuracoes"><Settings size={18}/> Configurações</Link>
        </nav>
        <form action={logoutAction} className="sidebar-bottom">
          <button className="nav-button"><LogOut size={18}/> Sair</button>
        </form>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
