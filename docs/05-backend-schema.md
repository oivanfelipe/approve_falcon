# Esquema de Backend

> Transcrito de `prisma/schema.prisma` (schema Postgres dedicado `falcon`, via Supabase). Este documento reflete o schema real do banco, não uma proposta.

## Fluxo de autenticação
Usuário interno se cadastra/loga por e-mail e senha (NextAuth v5, provider de credenciais; senha com hash via `bcryptjs`). Não há distinção de "papéis" (roles) no modelo `User` — cada usuário só enxerga e gerencia seus próprios projetos (`Project.userId`). Clientes e convidados nunca criam conta: acessam por token de link (`Delivery.reviewToken` / `GuestUpload.reviewToken`), sem sessão do NextAuth.

## Tabelas

### User
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| name | String? | Nome do usuário |
| email | String | Único, login |
| emailVerified | DateTime? | Reservado (fluxo NextAuth) |
| image | String? | Reservado (fluxo NextAuth) |
| password | String? | Hash bcrypt; null se algum dia houver OAuth |
| locale | String | `"pt"` ou `"en"`, default `"pt"` |
| createdAt / updatedAt | DateTime | Auditoria |

### Account / Session / VerificationToken
Modelos padrão exigidos pelo adapter Prisma do NextAuth v5 (`@auth/prisma-adapter`) — suportam login e sessão, sem lógica de domínio própria.

### Project
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → User, dono do projeto |
| name | String | Nome interno do projeto |
| clientName | String | Nome do cliente |
| clientEmail | String? | E-mail do cliente (opcional) |
| description | String? | Descrição livre |
| createdAt / updatedAt | DateTime | Auditoria |

### Delivery
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project |
| versionNumber | Int | Número sequencial da versão dentro do projeto |
| label | String? | Rótulo livre (ex.: "Ajuste de cor") |
| sourceType | `FILE` \| `DRIVE_LINK` | Origem do criativo |
| filePath | String? | Caminho no Supabase Storage — null se `DRIVE_LINK` |
| fileName | String | Nome do arquivo (ou nome do item do Drive) |
| fileSize | Int? | Bytes — null se `DRIVE_LINK` |
| mimeType | String? | null se `DRIVE_LINK` |
| driveUrl | String? | Link de compartilhamento do Drive — set se `DRIVE_LINK` |
| reviewToken | String | Único, usado na URL pública de revisão |
| status | `PENDING` \| `APPROVED` \| `CHANGES_REQUESTED` | Estado atual |
| expiresAt | DateTime? | Expiração opcional do link |
| requiresEmail | Boolean | Se o cliente precisa informar e-mail para interagir |
| allowDownload | Boolean | Se o cliente pode baixar o arquivo original |
| password | String? | Hash da senha do link, se protegido |
| createdAt / updatedAt | DateTime | Auditoria |

### ChatNotificationState
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| deliveryId | String | FK → Delivery, único (1:1) |
| hasPendingNotification | Boolean | Se há notificação de chat não vista |
| unreadCount | Int | Contagem de não lidos |
| lastNotifiedAt | DateTime? | Último envio de notificação |

### Comment
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| deliveryId | String | FK → Delivery |
| parentId | String? | FK → Comment (auto-relação, thread de respostas) |
| authorType | `CLIENT` \| `FREELANCER` | Quem comentou |
| authorName | String | Nome exibido do autor |
| authorEmail | String? | E-mail do autor, se informado |
| content | Text | Corpo do comentário |
| audioUrl | String? | Comentário em áudio, se houver |
| xPosition / yPosition | Float? | Coordenadas normalizadas (0–1) na imagem; null = comentário geral |
| resolvedAt | DateTime? | Marca quando o comentário foi resolvido |
| createdAt | DateTime | Auditoria |

### View
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| deliveryId | String | FK → Delivery |
| ipAddress / userAgent | String? | Rastreio de acesso ao link |
| createdAt | DateTime | Auditoria |

### Approval
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| deliveryId | String | FK → Delivery, único (1:1) |
| signerName | String | Nome de quem aprovou |
| signerEmail | String? | E-mail de quem aprovou |
| ipAddress | String? | IP de quem aprovou |
| createdAt | DateTime | Auditoria |

### FreelancerSettings
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → User, único (1:1) |
| displayName | String? | Nome exibido na página de revisão com branding |
| logoUrl | String? | Logo customizado |
| primaryColor | String | Default `#E10600` |
| secondaryColor | String | Default `#000000` |
| backgroundColor | String? | Fundo customizado, opcional |
| slug | String | Único — usado na rota `/[slug]/review/[token]` |

### GuestUpload
| Coluna | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | PK |
| filePath / fileName / fileSize / mimeType | — | Metadados do arquivo enviado pelo convidado |
| reviewToken | String | Único — link de acompanhamento |
| claimToken | String | Único — usado para associar o upload a um usuário depois |
| status | `PENDING` \| `APPROVED` \| `CHANGES_REQUESTED` | Mesmo enum de `Delivery` |
| expiresAt | DateTime | Expiração (obrigatória, sem default null) |
| claimedByUserId | String? | Preenchido quando um usuário reivindica o upload |
| createdAt | DateTime | Auditoria |

### GuestComment / GuestView
Espelham `Comment` e `View`, mas ligados a `GuestUpload` em vez de `Delivery` — mesma estrutura de thread, pins e rastreio de acesso.

## Relacionamentos
- `User` 1—N `Project` (dono)
- `Project` 1—N `Delivery`
- `Delivery` 1—N `Comment`, 1—N `View`, 1—1 `Approval`, 1—1 `ChatNotificationState`
- `Comment` auto-relação 1—N (`parentId` → respostas)
- `GuestUpload` 1—N `GuestComment`, 1—N `GuestView` (mesmo padrão de `Delivery`, mas isolado)
- `User` 1—1 `FreelancerSettings`

## Regras de acesso aos dados
- Um usuário só vê/edita/exclui **seus próprios** `Project` e as `Delivery` deles (filtro por `userId` em toda query autenticada).
- Cliente (via token) só acessa a `Delivery` correspondente ao `reviewToken` da URL — nunca lista outras entregas do mesmo projeto.
- Se `Delivery.password` estiver setado, o cliente só vê o conteúdo após validar a senha (`PasswordGate` + rota `verify-password`).
- `allowDownload = false` bloqueia download/abertura do arquivo original para o cliente, mesmo com acesso de visualização liberado.
- Convidado (guest) só enxerga o próprio `GuestUpload` pelo `reviewToken`; a associação a um usuário só acontece explicitamente via `claimToken`.
