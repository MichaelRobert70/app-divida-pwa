# Minhas Contas — Renomeação + Contas a Receber

**Data:** 2026-07-13
**Status:** Aprovado

## Objetivo

1. Renomear o app de "Dívidas" para "Minhas Contas".
2. Adicionar funcionalidade de **Contas a Receber** em aba/tela separada, seguindo o mesmo padrão visual e funcional das Contas a Pagar existentes.
3. Introduzir uma **tela Home minimalista** com dois cards de navegação: Contas a Pagar e Contas a Receber.

## Abordagem

**Abordagem A — Tabelas separadas + nova tela Home (recomendada e aprovada).**

- Cria novas tabelas `receivables` e `receivable_payments` no Dexie (version 2 do schema).
- Não altera as tabelas existentes (`users`, `debts`, `payments`), preservando os dados atuais.
- Adiciona um novo estado de view `'home'` (minimalista) que passa a ser a tela inicial após login.
- A tela de recebíveis espelha a de dívidas (CRUD, filtros de status, categorias, registro de recebimento parcial/total, histórico, progresso).
- Não unifica tabelas, evitando migração arriscada de dados.

## Escopo

### 1. Renomeação (Minhas Contas)

Substituir "Dívidas" por "Minhas Contas" em:

- `index.html` — `<title>`, `apple-mobile-web-app-title`.
- `vite.config.ts` — manifest `name` e `short_name`, `description`.
- `src/App.tsx`:
  - Texto do header `<h1>` (atualmente `Dívidas`).
  - Texto de boas-vindas do `LoginScreen` ("Bem-vindo ao Dívidas").
  - Texto do banner de instalação PWA ("Instalar Dívidas").
- `metadata.json` — campo `name`.

Notas:
- O nome do banco Dexie (`dividas_db`) e as chaves de localStorage (`debt_master_*`) **não** serão alterados para preservar dados existentes.
- O nome interno do pacote npm (`react-example`) permanece inalterado (não é visível ao usuário).
- Os ícones remotos do `icons8` permanecem; troca de ícone fica fora deste escopo.

### 2. Tela Home Minimalista

Nova view `'home'` que substitui `'dashboard'` como tela inicial padrão após login.

Conteúdo:
- Header compacto com nome do app "Minhas Contas" (reaproveitando o cabeçalho atual).
- Dois cards grandes lado a lado (ou empilhados em telas pequenas):
  1. **Contas a Pagar** — ícone vermelho/rosa (TrendingDown), ao tocar leva para `currentView = 'payable'`.
  2. **Contas a Receber** — ícone verde/esmeralda (TrendingUp), ao tocar leva para `currentView = 'receivable'`.
- Sem cards de resumo, sem filtros, sem listas. Minimalista conforme solicitado.
- Cada card pode exibir um pequeno indicador opcional (ex.: contagem pendente), mas o foco é minimalismo.

Navegação:
- Estado de view passa a ser: `'home' | 'payable' | 'receivable' | 'profile'`.
- Bottom nav:
  - Botão "Início" → `home`.
  - Botão central (+) → abre modal de adicionar. O modal pergunta o tipo (Pagar/Receber) ou abre o modal correspondente à tela atual; a definir no plano de implementação (ver seção "Decisões pendentes").
  - Botão "Perfil" → `profile`.

### 3. Contas a Receber — Nova tela

Espelha a tela atual de dívidas (`'dashboard'` → renomeada para `'payable'`).

**Dados:**

Novas interfaces (Dexie + tipos):

```ts
// db.ts
export interface Receivable {
  id: string;
  user_id: string;
  description: string;
  category?: string;
  total_amount: number;
  received_amount: number;  // análogo a paid_amount
  created_at: string;
}

export interface ReceivablePayment {
  id: string;
  receivable_id: string;
  amount: number;
  date: string;
}
```

Schema Dexie version 2:
```ts
this.version(2).stores({
  users: 'id, email',
  debts: 'id, user_id, created_at',
  payments: 'id, debt_id',
  receivables: 'id, user_id, created_at',
  receivable_payments: 'id, receivable_id',
});
```

Tipos de UI (`types.ts`):
```ts
export interface Receivable {
  id: string;
  description: string;
  category?: string;
  totalAmount: number;
  receivedAmount: number;
  payments: Payment[];
  createdAt: string;
}

export type ReceivableSummary = {
  totalReceivable: number;
  totalReceived: number;
  remaining: number;
  overallProgress: number;
};
```

**Funcionalidades (espelham Contas a Pagar):**

- Cards de resumo: Total a Receber, Total Recebido, Restante.
- Filtros de status: Todas / A Receber / Recebidas.
- Filtros por categoria (mesmo padrão de datalist).
- Adicionar nova conta a receber (modal): descrição, valor total (R$), categoria opcional.
- Editar conta a receber (modal).
- Registrar recebimento (modal) — análogo ao "Registrar Pagamento".
- Excluir conta a receber com confirmação (cascade delete dos receivable_payments).
- Barra de progresso por conta (percentual recebido).
- Histórico de recebimentos expandível (`<details>`).
- Estado "Quitada" → "Recebida" quando `receivedAmount >= totalAmount`.

**Estilo visual:**
- Mesmo padrão de `glass-card` / cards brancos/slate do tema atual.
- Cor de destaque para recebíveis: esmeralda (verde, consistente com o tema). As contas a pagar podem manter a cor atual (o cabeçalho atual usa esmeralda; manteremos o esquema existente para pagar e usaremos esmeralda para receber, com diferenciação por ícone e rótulos).
- Animações Framer Motion idênticas.

### 4. Estado e Lógica

- Novos estados no `App`:
  - `receivables: Receivable[]`
  - `isAddReceivableModalOpen`, `isEditReceivableModalOpen`, `isReceivablePaymentModalOpen`
  - `selectedReceivableId`
  - `filterReceivable`, `selectedReceivableCategory`
  - `newReceivable`, `editingReceivable`, `newReceivablePayment`
- Novos handlers (espelho dos handlers de debts):
  - `handleAddReceivable`, `handleEditReceivable`, `handleDeleteReceivable`
  - `handleAddReceivablePayment`
  - carregamento via `useEffect` que busca `db.receivables` + `db.receivable_payments` por `user_id`.
- `receivableStats` via `useMemo` (análogo a `stats`).

## Decisões pendentes (a serem resolvidas no plano de implementação)

1. **Botão central (+) da bottom nav:** ao tocar em Home, ele abre qual modal? Opções:
   - (a) Abre um mini-seletor "Pagar ou Receber?" e depois abre o modal correspondente.
   - (b) Abre o modal correspondente à tela atual (Home → Pagar por padrão).
   - Recomendação: (a) — mini-seletor, mais claro para o usuário.
2. **Cor de destaque de Contas a Pagar vs. Receber:** manter esmeralda para ambos com diferenciação por ícone/rótulo, ou usar tons diferentes. Recomendação: manter esmeralda como cor principal do app e diferenciar por ícone (`TrendingDown` vermelho para pagar, `TrendingUp` verde para receber).

## Fora de escopo

- Migração/renomeação do banco Dexie ou das chaves de localStorage.
- Troca dos ícones remotos do `icons8`.
- Funcionalidades de exportação, relatórios ou gráficos.
- Backend/sync — permanece 100% local (IndexedDB + localStorage).

## Riscos

- **Tamanho do `App.tsx`:** já tem 1255 linhas; adicionar o espelho de recebíveis aumentará significativamente. Aceitável neste escopo; refatoração para componentes separados fica como melhoria futura.
- **Version 2 do Dexie:** adicionar tabelas em nova versão é seguro (Dexie migra incrementalmente), mas deve ser testado com dados existentes.
