# TRD — Documento de Requisitos Técnicos

> Gerado a partir do `package.json`, `prisma/schema.prisma`, `prisma.config.ts` e `docs/architecture.md` existentes.

## Stack
- **Frontend:** Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS v4
- **Backend:** Server Actions (mutações de páginas autenticadas, em `features/*/actions/`) + API routes (`app/api/`, para endpoints públicos, polling e mutações de cliente não autenticado)
- **Banco de dados:** PostgreSQL via Supabase, isolado em schema dedicado `falcon` (não usa o `public` do projeto Supabase)
- **ORM:** Prisma 7, com `@prisma/adapter-pg` (conexão via `pg`) — URLs de conexão centralizadas em `prisma.config.ts` em vez do `schema.prisma` (mudança do Prisma 7)
- **Autenticação:** NextAuth v5 (beta), provider de credenciais, senha com hash via `bcryptjs`
- **Storage de arquivos:** Supabase Storage, bucket privado `deliveries`, acesso só por signed URL
- **E-mail transacional:** Resend, templates PT/EN detectados pelo navegador do destinatário
- **Hospedagem:** Vercel — `vercel-build` roda `next build && npx prisma migrate deploy` no próprio build, aplicando migrations em produção automaticamente

## Ferramentas e serviços externos
- **Google Drive (sem API/OAuth):** o app só faz *parsing* do link compartilhado (`lib/google-drive.ts` — `parseDriveLink()`, `isGoogleDriveUrl()`) e embute a prévia via iframe público do Drive. Exige que o item esteja compartilhado como "Qualquer pessoa com o link → Visualizador". Escolhido para evitar duplicar o arquivo em outro storage e não exigir conta Google do usuário.
- **Supabase (Postgres + Storage + Realtime):** banco, arquivos e o "tempo real" do dashboard (atualização automática ao receber aprovação/comentário) vêm do mesmo provedor.
- **Resend:** único provedor de e-mail transacional integrado.
- **Vercel:** deploy e build, incluindo aplicação de migrations em produção.

## Restrições técnicas
- Autenticação **apenas por credenciais** (e-mail/senha) nesta versão — sem login social/OAuth.
- O schema Prisma vive isolado em `falcon` dentro do Postgres do Supabase (decisão tomada no commit "Connect Supabase project with a dedicated falcon schema") — não misturar com outros schemas do mesmo projeto Supabase sem discussão.
- Tokens de link de revisão precisam ter alta entropia (mín. 128 bits, ver `docs/architecture.md`), não sequenciais e não devem expor IDs internos do banco.
- Arquivos de entrega nunca são expostos publicamente de forma direta — sempre via signed URL do Supabase Storage com expiração.
- `page.tsx` (Server Components) nunca usam `useState`; interatividade fica isolada em componentes `*PageClient.tsx` — regra de arquitetura do projeto (ver `docs/onboarding.md`), não apenas convenção de estilo.

## Ambientes
Local (dev): `.env.local` + `npx prisma migrate dev` contra um Postgres local ou um projeto Supabase de dev.
Produção: variáveis de ambiente na Vercel + `prisma migrate deploy` automático no build.

**Pendência — confirmar com o usuário:** não há evidência no repositório de um ambiente de staging/homologação separado (ex.: branch de banco Supabase dedicada, projeto Vercel de preview com banco próprio). Se existir, documentar aqui como fica isolado de produção.
