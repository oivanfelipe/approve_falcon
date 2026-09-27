# Design Brief — UI e UX

> Gerado a partir de `app/globals.css`, `components/ui/` e do histórico de commits de rebranding ("Roll out Falcon black/white/red identity across the entire app").

## Tom visual
Estética **racing/editorial**, alto contraste, direta — nada de gradientes, blur ou glow. Headlines em caixa alta e peso extra-bold, sombras "poster" sólidas com offset (sem blur). Comunica uma ferramenta interna séria e rápida, não um SaaS de marketing.

## Paleta de cores
- **Primária (accent/CTA):** vermelho `#E10600`
- **Estrutura/texto:** preto `#000000`
- **Canvas (fundo base):** branco `#FFFFFF`
- **Superfície:** `#F4F4F4`
- **Subtle (fundos secundários):** `#ECECEC`
- **Elevated:** `#FFFFFF` (mesma cor do canvas, diferenciado por sombra/borda, não por tom)
- **Texto muted:** `rgba(0, 0, 0, 0.55)`
- **Seleção de texto:** `rgba(225, 6, 0, 0.25)` sobre texto preto

Cada usuário pode sobrescrever `primaryColor` / `secondaryColor` / `backgroundColor` (e logo) nas próprias configurações (`FreelancerSettings`), refletido apenas na página de revisão com seu branding (`/[slug]/review/[token]`) — o painel interno (`/dashboard`) mantém sempre a identidade Falcon padrão.

## Tipografia
- **Principal:** Archivo (`--font-archivo`) — títulos e corpo de texto em geral
- **Monoespaçada:** JetBrains Mono (`--font-jetbrains-mono`) — usada para elementos técnicos (tokens, timestamps, valores de código)

## Componentes e estilo
- **Bordas:** retas, sem arredondamento — cantos vivos em linha com a estética racing
- **Sombra:** "hard shadow" sólida com offset preto (`shadow-hard` = 6px 6px 0 0 #000; `shadow-hard-sm` = 4px 4px 0 0 #000), nunca blur ou glow
- **Densidade:** compacta, com bordas grossas (`border-b-2 border-black` observado em headers)
- **Ícones:** `lucide-react`
- **Botões (`Button`):** variantes `primary` (vermelho), `secondary`, `ghost`, `outline`, `danger`
- **Cards (`Card`):** variantes `default`, `glass`, `elevated`, `outlined`
- **Badges (`Badge`):** `default`, `brand`, `success`, `warning`, `error`, `info`
- **Modal:** portal seguro para SSR, controlado via prop `isOpen`
- **Inputs/Textarea:** ref encaminhada, estado de erro visível
- **Tabs:** usadas para alternar origem do criativo (arquivo vs. link do Drive)

## Padrão por tipo de tela
- **Telas de lista** (dashboard, entregas de um projeto): estado vazio tratado explicitamente, atualização em tempo real sem precisar recarregar a página
- **Telas de formulário** (novo projeto, nova entrega): em modal, com tabs quando há mais de uma origem de dado possível
- **Tela de revisão pública:** foco total no criativo (preview central), ações de aprovação e comentário sempre visíveis, sem elementos de navegação do dashboard interno
