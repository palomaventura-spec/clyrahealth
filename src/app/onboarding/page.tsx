import { completeOnboardingAction } from "@/app/actions";
import { requireCompany } from "@/lib/auth";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ClinicBrandingFields } from "@/components/ClinicBrandingFields";

export default async function OnboardingPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;
  const {user}=await requireCompany();
  const company=user.company!;

  return <main className="auth-page"><div className="auth-card card wide">
    <div className="brand">Clyra<span>Health</span></div>
    {q.cadastro==="sucesso"&&<div className="alert alert-success success-confirm"><strong>✓ Ambiente criado com sucesso!</strong><span>Agora complete os dados básicos e a identidade da clínica.</span></div>}
    <div className="eyebrow">Configuração inicial</div>
    <h1>Olá, {user.name}!</h1>
    <p>Complete os dados da clínica. A logo poderá aparecer no acesso da equipe, agendamento público e documentos clínicos.</p>

    <form action={completeOnboardingAction} className="form-grid">
      <ClinicBrandingFields defaultLogoUrl={company.logoUrl} defaultAccentColor={company.accentColor}/>
      <label>Telefone<input name="phone" defaultValue={company.phone??""}/></label>
      <label>E-mail da clínica<input name="email" type="email" defaultValue={company.email??""}/></label>
      <label className="span-2">Endereço<input name="address" defaultValue={company.address??""}/></label>
      <label>Cidade<input name="city" defaultValue={company.city??""}/></label>
      <label>Estado<input name="state" maxLength={2} defaultValue={company.state??""}/></label>
      <PendingSubmitButton idle="Concluir e abrir painel" pending="Salvando..." className="btn btn-primary span-2"/>
    </form>
  </div></main>;
}
