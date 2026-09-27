# PRD — Documento de Requisitos do Produto

> Documento gerado por engenharia reversa do código existente (Approve Falcon), não antes da construção. Serve como baseline de revisão e como contexto persistente para qualquer agente que for evoluir o app a partir daqui.

## Resumo do app
Approve Falcon é uma ferramenta interna para times/agências enviarem criativos a clientes e coletarem aprovação ou pedido de alterações por um link seguro, sem exigir e-mail, WhatsApp, planilha ou conta do cliente.

## Problema que resolve
Hoje a aprovação de criativos costuma acontecer espalhada em e-mail, WhatsApp ou planilhas: sem histórico de versões centralizado, sem comentários posicionados na peça, sem status visível em tempo real de quem aprovou o quê. Approve Falcon centraliza isso em um único link por versão de entrega, com comentários posicionais e status ao vivo.

## Público-alvo
- **Usuário interno (time/agência)** — cria projetos, envia entregas (arquivo ou link do Google Drive), acompanha aprovações e comentários, personaliza a identidade da própria página de revisão.
- **Cliente final (sem conta)** — acessa o link de revisão, visualiza o criativo, comenta e aprova ou solicita alterações com um clique.
- **Convidado (guest, sem conta)** — envia um arquivo de volta por um link de guest-review, sem precisar criar conta; o envio pode depois ser reivindicado por um usuário interno.

## Funcionalidades da primeira versão
Já implementadas no código atual:

1. **Autenticação por credenciais** (NextAuth v5, e-mail/senha) para usuários internos
2. **Gestão de Projetos** — criar, editar e excluir projetos por cliente (nome, cliente, e-mail, descrição)
3. **Entregas (Deliveries) versionadas** — upload direto de arquivo **ou** link de Google Drive (arquivo, pasta, Doc/Sheet/Slide), cada versão numerada dentro do projeto
4. **Links de revisão seguros** — token único de alta entropia por entrega, sem exigir login do cliente
5. **Proteção por senha** opcional no link de revisão
6. **Controle de download** — quem envia decide se o cliente pode baixar/abrir o arquivo original
7. **Comentários com pins posicionais** em imagens (coordenadas normalizadas x/y) e chat geral para criativos do Drive; respostas encadeadas e comentário por áudio
8. **Reações de aprovação** — Aprovar / Solicitar Alterações
9. **Histórico de versões** navegável na própria página de revisão (VersionSwitcher)
10. **Dashboard em tempo real** via Supabase Realtime
11. **Notificações por e-mail** (PT/EN, detectado por navegador) via Resend, para aprovação e pedido de alteração
12. **Upload de convidados** — envio de arquivo sem conta, reivindicável depois por um usuário
13. **Identidade por usuário** — nome exibido, logo, cores e slug de link público personalizáveis (`FreelancerSettings`), refletidos na página de revisão via rota `/[slug]/review/[token]`

## Fora do escopo da primeira versão
- Billing, planos ou qualquer cobrança
- Páginas públicas de marketing (landing pages, pricing)
- Multi-tenant público self-service (é ferramenta interna, contas criadas internamente)
- Login social/OAuth — apenas credenciais por ora

## Critério de sucesso
**Pendência — confirmar com o usuário:** não há um critério de sucesso explícito registrado no repositório (métrica de adoção, tempo de aprovação, redução de trocas de e-mail, etc.). Preencher aqui após validação.
