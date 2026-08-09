# ClyraHealth v1.0.0 — Commercial Release

Plataforma SaaS para consultórios, clínicas e operações de saúde. O mesmo produto atende desde um profissional único até equipes maiores; os planos variam por escala e recursos premium.

## Módulos
Agenda, pacientes, portal do paciente, profissionais, atendimento clínico, documentos, comunicação, WhatsApp premium, IA premium, equipe, auditoria, planos e Super Admin.

## Perfis demo
- Owner: `admin@demo.com` / `12345678`
- Recepção: `recepcao@demo.com` / `12345678`
- Dra. Ana: `ana@demo.com` / `12345678`
- Dr. Lucas: `lucas@demo.com` / `12345678`
- Carla: `carla@demo.com` / `12345678`
- Super Admin: `ceo@clyrahealth.local` / `12345678`

## Desenvolvimento local
Copie `.env.example` para `.env` e mantenha `DATABASE_URL="file:./dev.db"`.

```bash
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

### Comunicação/IA sem custo
```env
WHATSAPP_PROVIDER="mock"
AI_PROVIDER="mock"
```

## Antes de produção
O SQLite desta distribuição é apenas para desenvolvimento/homologação local. Para dados reais, migre o datasource Prisma para PostgreSQL gerenciado e execute revisão de segurança/LGPD. Consulte `docs/LAUNCH_CHECKLIST.md`.
