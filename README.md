<div align="center">
  <img src="public/logo.png" alt="Approve Falcon" width="56" />
  <h1>Approve Falcon</h1>
  <p><strong>Aprovação de criativos sem a bagunça, com suporte nativo a links do Google Drive.</strong></p>
  <p>Base de código adaptada a partir do projeto <a href="https://github.com/joaosilva-web/approveflow">ApproveFlow</a>.</p>
</div>

---

## O que é

Approve Falcon é uma ferramenta para times/agências enviarem criativos para clientes e receberem aprovações ou pedidos de alteração — sem precisar de e-mail, WhatsApp ou planilha. O cliente acessa um link seguro, visualiza o criativo, comenta e aprova (ou solicita alterações) com um clique.

Além do upload direto de arquivo, é possível **colar o link de um criativo do Google Drive** (arquivo, pasta, Google Docs/Sheets/Slides) e gerar o mesmo link de revisão para o cliente — sem precisar baixar e reenviar o arquivo para o storage.

## Funcionalidades

- **Criativos via Google Drive** — cole o link de compartilhamento do Drive (arquivo, pasta, Doc, Sheet ou Slide) e o cliente visualiza a prévia embutida na página de revisão, sem duplicar o arquivo em outro storage
- **Links de revisão seguros** — cada versão entregue gera um link único com token, sem necessidade de login para o cliente
- **Proteção por senha** — links opcionalmente protegidos por senha
- **Download controlado** — freelancer decide se o cliente pode baixar/abrir o arquivo original
- **Comentários com pins** — clientes podem clicar em imagens (upload direto) para deixar comentários posicionais; criativos do Drive recebem comentários gerais via chat
- **Reações rápidas** — "Ficou ótimo!", "Precisa de ajustes", "Não está pronto"
- **Histórico de versões** — todas as versões de um projeto ficam acessíveis no link
- **Tempo real** — dashboard atualiza automaticamente via Supabase Realtime ao receber aprovações/comentários
- **Notificações por e-mail** — e-mails de aprovação e pedido de alteração em PT ou EN (detectado pelo navegador)
- **Upload de convidados** — clientes podem enviar arquivos de volta sem criar conta
- **Planos e cobrança** — integração com Stripe (Free / Pro)

> Este repositório usa a base de código do ApproveFlow como ponto de partida. Textos de marca ("ApproveFlow"), landing pages e templates de e-mail ainda citam o nome original em vários pontos — ajuste-os conforme for consolidando a identidade do Approve Falcon.

## Stack

| Camada         | Tecnologia                         |
| -------------- | ---------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19 |
| Linguagem      | TypeScript                         |
| Estilo         | Tailwind CSS v4                    |
| Banco de dados | PostgreSQL via Supabase            |
| ORM            | Prisma 7                           |
| Autenticação   | NextAuth v5 (credentials + OAuth)  |
| Storage        | Supabase Storage                   |
| E-mail         | Resend                             |
| Pagamentos     | Stripe                             |
| Deploy         | Vercel                             |

## Estrutura do projeto

```
app/
  (auth)/                     → Login
  (dashboard)/                → Dashboard do freelancer (projetos, billing)
  (marketing)/                → Landing page + páginas SEO
  api/                        → API routes (auth, billing, review, guest)
  review/[token]/             → Página de revisão pública para o cliente
  guest-review/[token]/       → Revisão para uploads de convidados
features/
  auth/
    actions/auth.ts           → registerUser()
  billing/
    plans.ts                  → Definição dos planos (fonte da verdade)
    limits.ts                 → canCreateProject(), canUploadVersion()…
    subscription.ts           → getSubscriptionInfo()
    providers/stripe.ts       → Cliente Stripe
  dashboard/
    components/Sidebar.tsx    → Navegação do dashboard
  deliveries/
    actions/deliveries.ts     → getUploadUrl(), createDelivery()
    components/               → NewDeliveryModal, UploadZone
  guest-review/
    components/               → GuestReviewShell, GuestUploader
  marketing/
    context/lang-context.tsx  → Toggle PT/EN
    components/               → LandingPage, Hero, Features, Pricing, CTA…
  projects/
    actions/projects.ts       → createProject(), updateProject(), deleteProject()
    components/               → ProjectCard, NewProjectModal
  review/
    components/               → ReviewClientShell, ApprovalPanel, CommentSystem, DriveEmbed…
components/
  ui/                         → Design system (Button, Input, Modal, Badge, Card…)
  layout/                     → Header, Footer
lib/
  google-drive.ts             → parseDriveLink(), isGoogleDriveUrl() — parsing de links do Drive
  prisma/client.ts            → Singleton do Prisma
  supabase/server.ts          → uploadFile(), getSignedUrl()
  supabase/browser.ts         → Cliente Supabase (browser)
  tokens.ts                   → Geração de tokens criptográficos
  email.ts                    → Templates de e-mail PT/EN via Resend
  utils.ts                    → cn() — merge de classes Tailwind
prisma/
  schema.prisma               → Modelos: User, Project, Delivery, Comment, Subscription…
```

## Rodar localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL (ou conta no Supabase)
- Conta Stripe (para billing)
- Conta Resend (para e-mails)

### Configuração

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher as variáveis de ambiente
cp .env.example .env.local

# 3. Rodar as migrations do banco
npx prisma migrate dev

# 4. Popular o banco com os planos
npm run db:seed

# 5. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente necessárias

```env
# Banco
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET=deliveries

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM=
```

## Planos

|                     | Free | Pro        |
| ------------------- | ---- | ---------- |
| Projetos            | 3    | Ilimitados |
| Versões por projeto | 3    | Ilimitadas |
| Storage             | 5 GB | 50 GB      |

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # ESLint
npm run db:seed    # Popular banco com planos
npx tsc --noEmit   # Type check
```

---

<p align="center">Feito com carinho para freelancers 💜</p>
