import { createTeamUserAction } from "@/app/actions";
import { canManage, requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const { user, companyId } = await requireCompany();
  if (!canManage(user.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { companyId },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <div className="page-header"><div><span className="eyebrow">Acessos</span><h1>Equipe</h1><p>Cadastre usuários internos e defina seus perfis.</p></div></div>
      <section className="card section-card">
        <h2>Novo usuário</h2>
        <form action={createTeamUserAction} className="form-grid">
          <label>Nome<input name="name" required /></label>
          <label>E-mail<input name="email" type="email" required /></label>
          <label>Senha inicial<input name="password" type="password" minLength={8} required /></label>
          <label>Perfil
            <select name="role">
              <option value="ADMIN">Administrador</option>
              <option value="RECEPTIONIST">Recepção</option>
              <option value="PROFESSIONAL">Profissional</option>
            </select>
          </label>
          <button className="btn btn-primary span-2">Criar acesso</button>
        </form>
      </section>
      <section className="card section-card">
        <div className="table-wrap"><table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead>
          <tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.active ? "Ativo" : "Inativo"}</td></tr>)}</tbody>
        </table></div>
      </section>
    </div>
  );
}
