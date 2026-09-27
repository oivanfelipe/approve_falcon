# Plano de Implementação

> O app já está construído. Este documento registra a sequência real (pelo histórico de commits) e serve de referência para a ordem a seguir em qualquer novo incremento — ex.: um novo tipo de origem de criativo, um novo canal de notificação, etc.

## Sequência de construção (histórico real)
1. **Bootstrap a partir de um template** ("ApproveFlow") já com o fluxo base de link do Google Drive como criativo — entrou primeiro porque é o núcleo do produto (entrega + revisão via link).
2. **Remoção de billing/marketing e rebrand como ferramenta interna** — decisão de escopo antes de continuar investindo em UI: tirar tudo que só faria sentido em um SaaS público (planos, páginas de marketing, multi-tenant self-service).
3. **Identidade visual Falcon (preto/branco/vermelho) no dashboard** — aplicada primeiro na área interna, onde o time passa mais tempo.
4. **Identidade visual Falcon em todo o app** — depois estendida à página pública de revisão e demais telas, garantindo consistência ponta a ponta antes de mexer em infraestrutura de dados.
5. **Conexão com projeto Supabase dedicado, schema `falcon` isolado** — feita por último porque depende do produto e da UI já estarem estáveis; migrar/isolar schema de banco é mais arriscado fazer no meio de mudanças de produto.

## Sequência recomendada para novos incrementos
Ao adicionar uma funcionalidade nova, seguir esta ordem para não invalidar trabalho já feito:
1. Atualizar o **PRD** (`01-prd.md`) se a funcionalidade muda o escopo da v1
2. Validar impacto técnico no **TRD** (`02-trd.md`) — nova integração externa, nova restrição
3. Atualizar o **AppFlow** (`03-appflow.md`) — nova tela ou novo estado em tela existente
4. Ajustar o **Design Brief** (`04-design-brief.md`) só se a nova tela exigir um padrão visual ainda não coberto
5. Alterar o **Esquema de Backend** (`05-backend-schema.md` + migration Prisma) por último, só depois de UI e fluxo fechados — evita reescrever migration por causa de mudança de fluxo

## Marcos de validação
- Depois de qualquer mudança em `prisma/schema.prisma`: rodar `npx prisma migrate dev` localmente e conferir `npx tsc --noEmit` antes de subir — o build de produção já roda `prisma migrate deploy` automaticamente, então uma migration quebrada trava o deploy.
- Depois de qualquer mudança na página de revisão pública (`/review/[token]` ou `/[slug]/review/[token]`): testar manualmente com um link protegido por senha e um sem senha, com `allowDownload` ligado e desligado.
- Depois de mudança em `lib/google-drive.ts`: testar com link de arquivo, pasta, Doc, Sheet e Slide — os formatos têm comportamento de embed diferente.

## Riscos e dependências
- **Dependência do compartilhamento do Google Drive:** o app não usa API/OAuth do Drive, só parsing de link + iframe público. Qualquer mudança de política do Google sobre embeds públicos quebra a prévia sem que o app tenha como corrigir sozinho.
- **Ausência de ambiente de staging documentado** (ver pendência em `02-trd.md`) — mudanças de schema vão direto para produção via `prisma migrate deploy` no build da Vercel; um erro de migration é descoberto em produção.
- **Critério de sucesso não definido** (ver pendência em `01-prd.md`) — sem isso, fica difícil priorizar objetivamente o que entra no próximo incremento.
