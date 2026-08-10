# ClyraHealth v1.0.2 — Regra Definitiva

## Atualização do projeto atual

IMPORTANTE: se seu Neon já contém clínicas/pacientes de teste, NÃO execute `npm run db:seed`.

Use:

```bash
npm install --ignore-scripts
npx prisma generate
npx prisma db push
npm run dev
```

Depois:

```bash
git add .
git commit -m "release: clyrahealth v1.0.2"
git push origin main
```

## Vercel

Mantenha:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="https://SEU-PROJETO.vercel.app"
WHATSAPP_PROVIDER="mock"
AI_PROVIDER="mock"
BILLING_PROVIDER="none"
TRIAL_DAYS="7"
```

## Fluxo de profissionais

Owner cadastra profissional -> ClyraHealth cria User + Professional -> mostra link de ativação -> profissional define a própria senha -> login pela página da clínica.

## Fluxo de equipe

Owner/Admin cria ADMIN ou RECEPÇÃO -> ClyraHealth mostra link de ativação -> usuário define senha própria.

## Não rodar seed em produção
O seed é apenas para ambiente demo/desenvolvimento e pode apagar dados existentes.


## v1.0.3 — Painel CEO

Após substituir os arquivos:

```bash
npm install --ignore-scripts
npx prisma generate
npx prisma db push
npm run dev
```

**Não execute `npm run db:seed` no Neon atual.**

A v1.0.3 adiciona `Company.active`, portanto `npx prisma db push` é necessário.
