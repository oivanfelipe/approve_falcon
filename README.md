<div align="center">
  <img src="public/logo.png" alt="Approve Falcon" width="56" />
  <h1>Approve Falcon</h1>
  <p><strong>Aprovação de criativos sem a bagunça, com suporte nativo a links do Google Drive.</strong></p>
  <p>Ferramenta de uso interno.</p>
</div>

---

## O que é

Approve Falcon é uma ferramenta interna para enviar criativos para clientes e receber aprovações ou pedidos de alteração — sem precisar de e-mail, WhatsApp ou planilha. O cliente acessa um link seguro, visualiza o criativo, comenta e aprova (ou solicita alterações) com um clique.

Além do upload direto de arquivo, é possível **colar o link de um criativo do Google Drive** (arquivo, pasta, Google Docs/Sheets/Slides) e gerar o mesmo link de revisão para o cliente — sem precisar baixar e reenviar o arquivo para o storage.

## Funcionalidades

- **Criativos via Google Drive** — cole o link de compartilhamento do Drive (arquivo, pasta, Doc, Sheet ou Slide) e o cliente visualiza a prévia embutida na página de revisão, sem duplicar o arquivo em outro storage
- **Links de revisão seguros** — cada versão entregue gera um link único com token, sem necessidade de login para o cliente
- **Proteção por senha** — links opcionalmente protegidos por senha
- **Download controlado** — quem envia decide se o cliente pode baixar/abrir o arquivo original
- **Comentários com pins** — clientes podem clicar em imagens (upload direto) para deixar comentários posicionais; criativos do Drive recebem comentários gerais via chat
- **Reações rápidas** — "Ficou ótimo!", "Precisa de ajustes", "Não está pronto"
- **Histórico de versões** — todas as versões de um projeto ficam acessíveis no link
- **Tempo real** — dashboard atualiza automaticamente via Supabase Realtime ao receber aprovações/comentários
- **Notificações por e-mail** — e-mails de aprovação e pedido de alteração em PT ou EN (detectado pelo navegador)
- **Upload de convidados** — clientes podem enviar arquivos de volta sem criar conta
- **Identidade por usuário** — cada pessoa pode personalizar nome exibido, logo, cores e slug do link público na página de revisão do cliente

Sem billing/planos e sem páginas públicas de marketing — este é um projeto enxuto para uso interno, sem elementos que fariam sentido apenas em um SaaS multi-tenant público.

## Stack

| Camada         | Tecnologia                         |
| -------------- | ---------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19 |
| Linguagem      | TypeScript                         |
| Estilo         | Tailwind CSS v4                    |
| Banco de dados | PostgreSQL via Supabase            |
| ORM            | Prisma 7                           |
| Autenticação   | NextAuth v5 (credentials)          |
| Storage        | Supabase Storage                   |
| E-mail         | Resend                             |
| Deploy         | Vercel                             |

## Estrutura do projeto

```
app/
  (auth)/                     → Login
  (dashboard)/                → Dashboard (projetos, configurações)
  api/                        → API routes (auth, review, guest)
  review/[token]/             → Página de revisão pública para o cliente
  guest-review/[token]/       → Revisão para uploads de convidados
features/
  auth/
    actions/auth.ts           → registerUser()
  dashboard/
    components/Sidebar.tsx    → Navegação do dashboard
  deliveries/
    actions/deliveries.ts     → getUploadUrl(), createDelivery()
    components/               → NewDeliveryModal (arquivo ou link do Drive), UploadZone
  guest-review/
    components/               → GuestReviewShell, GuestUploader
  projects/
    actions/projects.ts       → createProject(), updateProject(), deleteProject()
    components/               → ProjectCard, NewProjectModal
  review/
    components/               → ReviewClientShell, ApprovalPanel, CommentSystem, DriveEmbed…
components/
  ui/                         → Design system (Button, Input, Modal, Badge, Card, Tabs…)
lib/
  google-drive.ts             → parseDriveLink(), isGoogleDriveUrl() — parsing de links do Drive
  prisma/client.ts            → Singleton do Prisma
  supabase/server.ts          → uploadFile(), getSignedUrl()
  supabase/browser.ts         → Cliente Supabase (browser)
  tokens.ts                   → Geração de tokens criptográficos
  email.ts                    → Templates de e-mail PT/EN via Resend
  utils.ts                    → cn(), formatSize()
prisma/
  schema.prisma               → Modelos: User, Project, Delivery, Comment, FreelancerSettings…
```

Mais detalhes em [`docs/onboarding.md`](docs/onboarding.md) e [`docs/architecture.md`](docs/architecture.md).

## Rodar localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL (ou conta no Supabase)
- Conta Resend (para e-mails, opcional em dev)

### Configuração

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher as variáveis de ambiente
cp .env.example .env.local

# 3. Rodar as migrations do banco
npx prisma migrate dev

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente necessárias

```env
# Banco
DATABASE_URL=
DIRECT_URL=

# Auth
AUTH_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET=deliveries

# Resend
RESEND_API_KEY=
RESEND_FROM=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # ESLint
npx tsc --noEmit   # Type check
```

## Link do Google Drive como criativo

Ao criar uma nova versão de entrega, escolha a aba **"Link do Google Drive"** e cole a URL de compartilhamento (arquivo, pasta, Doc, Sheet ou Slide). Para a prévia carregar no lado do cliente, o item precisa estar compartilhado como **"Qualquer pessoa com o link" → Visualizador**.
