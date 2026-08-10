import { completeOnboardingAction } from "@/app/actions";
import { requireCompany } from "@/lib/auth";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
export default async function OnboardingPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams; const {user}=await requireCompany();
  return <main className="auth-page"><div className="auth-card card wide">
    <div className="brand">Clyra<span>Health</span></div>
    {q.cadastro==="sucesso"&&<div className="alert alert-success success-confirm"><strong>✓ Ambiente criado com sucesso!</strong><span>Agora complete os dados básicos da clínica.</span></div>}
    <div className="eyebrow">Configuração inicial</div><h1>Olá, {user.name}!</h1><p>Complete os dados básicos. Depois você poderá cadastrar profissionais e configurar a agenda de cada um.</p>
    <form action={completeOnboardingAction} className="form-grid">
      <label>Telefone<input name="phone"/></label><label>E-mail da clínica<input name="email" type="email"/></label>
      <label className="span-2">Endereço<input name="address"/></label><label>Cidade<input name="city"/></label><label>Estado<input name="state" maxLength={2}/></label>
      <PendingSubmitButton idle="Concluir e abrir painel" pending="Salvando..." className="btn btn-primary span-2"/>
    </form>
  </div></main>;
}
