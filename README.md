# ClyraHealth MVP

MVP funcional de um SaaS multiempresa para clínicas, consultórios e profissionais da saúde.

## Funcionalidades incluídas

- Landing page do produto
- Cadastro autônomo de nova clínica/consultório
- Login com sessão HTTP-only
- Onboarding da empresa
- Multiempresa por `companyId`
- Perfis: Owner, Admin, Recepção, Profissional e Super Admin
- Cadastro de especialidades
- Cadastro de médicos, dentistas, fisioterapeutas e outros profissionais
- Conselhos e registro profissional (CRM, CRO, CREFITO etc.)
- Disponibilidade por profissional
- Cadastro de pacientes
- Agenda e agendamentos
- Detecção de conflito de horário
- Status: agendada, confirmada, concluída, cancelada e falta
- Área do profissional limitada à própria agenda quando houver vínculo
- Gestão de equipe
- Página pública de agendamento por clínica
- Painel administrativo da clínica
- Painel Super Admin do SaaS
- Assinatura/trial modelada no banco
- Layout responsivo
- Estrutura pronta para WhatsApp, e-mail, pagamentos e IA

## Como executar

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o arquivo `.env`

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Ou copie `.env.example` manualmente e renomeie para `.env`.

### 3. Criar o banco

```bash
npx prisma generate
npm run db:push
npm run db:seed
```

### 4. Iniciar

```bash
npm run dev
```

Abra:

http://localhost:3000

## Contas de teste

### Administrador da clínica
- E-mail: `admin@demo.com`
- Senha: `12345678`

### Profissional
- E-mail: `profissional@demo.com`
- Senha: `12345678`

### Super Admin do SaaS
- E-mail: `ceo@clyrahealth.local`
- Senha: `12345678`

### Agendamento público da clínica demo
- `/agendar/clinica-demo`

## Banco

Para o teste local foi usado **SQLite** para eliminar a necessidade de criar conta ou serviço externo.

A modelagem foi feita de modo compatível com a migração para PostgreSQL. Antes da publicação comercial, altere o datasource do Prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

e configure uma `DATABASE_URL` do Neon, Supabase ou outro PostgreSQL.

## Importante antes de uso com pacientes reais

Este MVP é uma base de produto e **não deve armazenar prontuários ou dados clínicos sensíveis em produção sem uma revisão específica de segurança, privacidade, LGPD, auditoria, backups e controle de acesso**.

Para comercialização, recomenda-se ainda:
- PostgreSQL gerenciado
- logs de auditoria
- recuperação de senha por e-mail
- rate limiting
- 2FA para administradores
- política de retenção e exclusão de dados
- backups e recuperação
- revisão de contratos/termos e LGPD
- monitoramento de erros
- integração real de pagamentos
- integração oficial de WhatsApp

## Próximas integrações previstas

- WhatsApp Business API
- Resend/SendGrid
- Stripe/Mercado Pago
- Assistente IA para agendamento
- lista de espera
- notificações automáticas
- cobrança recorrente
- relatórios financeiros


## Calendário profissional

A agenda usa FullCalendar e inclui:

- visão mensal;
- visão semanal;
- visão diária;
- indicador do horário atual;
- eventos com cores por status;
- drag-and-drop para reagendar;
- redimensionamento da consulta para alterar a duração;
- detecção de conflito de horário no backend.

Após atualizar esta versão, execute novamente:

```bash
npm install
npm run dev
```
"# clyrahealth" 
