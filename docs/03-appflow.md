# AppFlow — Fluxo e Navegação do App

> Gerado a partir das rotas em `app/` e dos componentes em `features/*/components/`.

## Mapa de telas
- **`/login`** — autenticação do usuário interno (e-mail/senha)
- **`/dashboard`** — lista de projetos do usuário logado, atualizada em tempo real
- **`/dashboard/projects/[id]`** — detalhe do projeto: lista de entregas, criação de novas versões
- **`/dashboard/settings`** — configurações de identidade do usuário (nome exibido, logo, cores, slug do link público)
- **`/review/[token]`** — página pública de revisão sem branding customizado (link "cru")
- **`/[slug]/review/[token]`** — mesma página de revisão, mas com a identidade visual do usuário dono do projeto (nome, logo, cores via `FreelancerSettings`)
- **`/guest-review/[token]`** — página para quem recebeu um link de upload de convidado (sem conta)
- **404 (`not-found.tsx`)** — página de erro para rota inexistente, com atalho para `/dashboard`
- **`/`** — sem tela própria; redireciona direto para `/dashboard`

## Jornada principal (usuário interno enviando criativo)
1. Usuário chega em **`/login`** → autentica com e-mail/senha → vai para **`/dashboard`**
2. Em **`/dashboard`** → clica em "Novo projeto" → preenche nome, cliente e (opcional) e-mail/descrição → projeto aparece na lista
3. Abre o projeto em **`/dashboard/projects/[id]`** → clica em "Nova entrega" → escolhe a aba **"Enviar arquivo"** (upload direto) ou **"Link do Google Drive"** (cola URL de compartilhamento) → confirma → entrega é criada com um token de revisão único
4. Copia o link de revisão (com o slug de branding, se configurado em `/dashboard/settings`) e envia ao cliente por fora do app (e-mail, WhatsApp etc.)
5. Cliente abre o link → se protegido por senha, passa pelo **PasswordGate** → visualiza o criativo (preview de arquivo ou `DriveEmbed`) → deixa comentários (pins na imagem ou chat geral) e/ou clica em **Aprovar** ou **Solicitar Alterações**
6. Usuário interno vê a atualização **em tempo real** no dashboard/detalhe do projeto e recebe **e-mail** de notificação (PT ou EN, conforme navegador do cliente)
7. Se o cliente pediu alterações, o usuário cria uma **nova versão** da entrega; o cliente acessa o mesmo link e pode alternar entre versões pelo **VersionSwitcher**

## Jornadas alternativas
- **Upload de convidado:** alguém sem conta recebe um link de **`/guest-review/[token]`**, envia um arquivo pelo `GuestUploader` sem se cadastrar. O envio fica registrado como `GuestUpload` com um `claimToken`; um usuário interno pode depois "reivindicar" esse upload e associá-lo a um projeto seu.
- **Cliente sem senha correta:** ao errar a senha no `PasswordGate`, permanece na tela de revisão sem acesso ao conteúdo até acertar.
- **Link do Drive mal configurado:** se o item do Drive não estiver compartilhado como "Qualquer pessoa com o link → Visualizador", a prévia (`DriveEmbed`) não carrega para o cliente — o README já orienta o usuário interno a checar isso antes de enviar.

## Estados especiais
- **Projeto sem entregas:** estado vazio na tela de detalhe do projeto (nenhuma versão enviada ainda).
- **Upload em andamento:** `UploadZone` mostra progresso durante o envio de arquivo grande.
- **Link expirado:** entregas e guest uploads têm `expiresAt` — ao vencer, a página de revisão deve tratar como link inválido/expirado em vez de mostrar o criativo.
- **Comentário resolvido:** comentários têm `resolvedAt`; a UI deve diferenciar visualmente pendente vs. resolvido (pins/threads).
