# Minhas Contas — Renomeação + Contas a Receber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app from "Dívidas" to "Minhas Contas", add a minimalist Home screen with two navigation cards, and add a full "Contas a Receber" feature mirroring the existing debt management.

**Architecture:** Approach A (separate tables). New Dexie tables `receivables` + `receivable_payments` added as schema version 2 (non-destructive migration). New view states `'home' | 'payable' | 'receivable' | 'profile'` replace the old `'dashboard' | 'profile'`. The receivables UI mirrors the debts UI with parallel state/handlers in `App.tsx`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Dexie 4, Framer Motion (motion), lucide-react. No test framework present — verification is `npm run lint` (tsc --noEmit) + `npm run build` + manual smoke test in `npm run dev`.

## Global Constraints

- All UI strings in Brazilian Portuguese (pt-BR), currency via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, dates via `toLocaleDateString('pt-BR')`.
- Do NOT rename the Dexie database (`dividas_db`) or localStorage keys (`debt_master_*`) — preserve existing user data.
- Emerald (`#10b981` / `emerald-500/600`) remains the app's primary accent color. Receivables use `TrendingUp` icon (green); payables keep `TrendingDown` (red-rose tint on Home card).
- Follow existing patterns: glass/white cards with `rounded-2xl`/`rounded-3xl`, Framer Motion `AnimatePresence`, motion.div with initial/animate/exit.
- `App.tsx` is the single-file app (no router, state-based views). Keep all new code in `App.tsx` + `db.ts` + `types.ts` following existing structure. Do NOT extract components unless a step says so.
- The bottom-nav center (+) button opens a type selector ("Pagar" / "Receber") when on the Home screen, and the contextual add-modal when on a payable/receivable screen.

---

### Task 1: Rename app to "Minhas Contas" in config files

**Files:**
- Modify: `index.html:9,11`
- Modify: `vite.config.ts:17-19`
- Modify: `metadata.json:2`

**Interfaces:**
- Consumes: nothing
- Produces: consistent app name "Minhas Contas" across PWA manifest and HTML metadata

- [ ] **Step 1: Update `index.html`**

Replace the two occurrences of `Dívidas`:

```html
<meta name="apple-mobile-web-app-title" content="Minhas Contas" />
...
<title>Minhas Contas</title>
```

- [ ] **Step 2: Update `vite.config.ts` manifest**

Change the manifest block:

```ts
manifest: {
  name: 'Minhas Contas',
  short_name: 'Minhas Contas',
  description: 'Controle suas contas a pagar e a receber de forma simples e elegante.',
  theme_color: '#10b981',
  background_color: '#020617',
  display: 'standalone',
  orientation: 'portrait',
  icons: [
    {
      src: 'https://img.icons8.com/fluency/192/000000/money-transfer.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: 'https://img.icons8.com/fluency/512/000000/money-transfer.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ]
}
```

- [ ] **Step 3: Update `metadata.json`**

```json
{
  "name": "Minhas Contas",
  "description": "Um aplicativo simples e elegante para acompanhar suas contas a pagar, a receber e pagamentos.",
  "requestFramePermissions": []
}
```

- [ ] **Step 4: Verify build**

Run: `npm run lint`
Expected: PASS (no type errors — these are data files).

- [ ] **Step 5: Commit**

```bash
git add index.html vite.config.ts metadata.json
git commit -m "rename: app name Dívidas -> Minhas Contas in manifest and metadata"
```

---

### Task 2: Add Receivable types and Dexie tables

**Files:**
- Modify: `src/types.ts` (append)
- Modify: `src/lib/db.ts` (add interfaces, tables, version 2)

**Interfaces:**
- Consumes: existing `Payment` type from `types.ts`
- Produces:
  - `Receivable` (UI type) in `types.ts` with fields `{ id, description, category?, totalAmount, receivedAmount, payments: Payment[], createdAt }`
  - `ReceivableSummary` type in `types.ts`
  - `Receivable` (DB interface) in `db.ts` with fields `{ id, user_id, description, category?, total_amount, received_amount, created_at }`
  - `ReceivablePayment` (DB interface) in `db.ts` with fields `{ id, receivable_id, amount, date }`
  - `db.receivables` and `db.receivable_payments` Dexie tables

- [ ] **Step 1: Append to `src/types.ts`**

Add after the existing `DebtSummary` type:

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

- [ ] **Step 2: Update `src/lib/db.ts`**

Replace the entire file with:

```ts
import Dexie, { type Table } from 'dexie';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  description: string;
  category?: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  debt_id: string;
  amount: number;
  date: string;
}

export interface Receivable {
  id: string;
  user_id: string;
  description: string;
  category?: string;
  total_amount: number;
  received_amount: number;
  created_at: string;
}

export interface ReceivablePayment {
  id: string;
  receivable_id: string;
  amount: number;
  date: string;
}

class AppDatabase extends Dexie {
  users!: Table<User, string>;
  debts!: Table<Debt, string>;
  payments!: Table<Payment, string>;
  receivables!: Table<Receivable, string>;
  receivable_payments!: Table<ReceivablePayment, string>;

  constructor() {
    super('dividas_db');
    this.version(1).stores({
      users: 'id, email',
      debts: 'id, user_id, created_at',
      payments: 'id, debt_id',
    });
    this.version(2).stores({
      users: 'id, email',
      debts: 'id, user_id, created_at',
      payments: 'id, debt_id',
      receivables: 'id, user_id, created_at',
      receivable_payments: 'id, receivable_id',
    });
  }
}

export const db = new AppDatabase();
```

Note: version 2 re-declares ALL stores (Dexie requirement) and adds the two new tables. Existing data is preserved.

- [ ] **Step 3: Verify types compile**

Run: `npm run lint`
Expected: PASS. If you see "receivables is declared but never used" warnings, ignore — they are used by Dexie's `!` assertion pattern (definite assignment).

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/lib/db.ts
git commit -m "feat(db): add Receivable + ReceivablePayment tables (Dexie v2)"
```

---

### Task 3: Rename app strings inside App.tsx (Login, Header, PWA banner)

**Files:**
- Modify: `src/App.tsx:76` (login welcome), `:78-79` (login subtitle), `:784` (header h1), and the `PWAInstallPrompt` component's "Instalar Dívidas" text.

**Interfaces:**
- Consumes: nothing
- Produces: UI strings say "Minhas Contas" instead of "Dívidas"

- [ ] **Step 1: Update the LoginScreen welcome text**

Find this block (around lines 75-79):

```tsx
<h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
  {isSignUp ? 'Criar Conta' : 'Bem-vindo ao Dívidas'}
</h1>
<p className="text-center text-slate-500 dark:text-slate-400 mb-8">
  {isSignUp ? 'Cadastre-se para gerenciar suas dívidas.' : 'Gerencie suas dívidas de forma simples e eficiente.'}
</p>
```

Replace with:

```tsx
<h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
  {isSignUp ? 'Criar Conta' : 'Bem-vindo ao Minhas Contas'}
</h1>
<p className="text-center text-slate-500 dark:text-slate-400 mb-8">
  {isSignUp ? 'Cadastre-se para gerenciar suas contas.' : 'Gerencie suas contas a pagar e a receber de forma simples.'}
</p>
```

- [ ] **Step 2: Update the header h1 (line 784)**

Replace:

```tsx
<h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Dívidas</h1>
```

with:

```tsx
<h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Minhas Contas</h1>
```

- [ ] **Step 3: Update the PWAInstallPrompt banner text**

Search `App.tsx` for the string `Instalar` (it appears in the `PWAInstallPrompt` component). Change any occurrence of `Instalar Dívidas` to `Instalar Minhas Contas`. If the text reads only `Instalar` without the app name, leave it.

- [ ] **Step 4: Verify lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "rename: update in-app strings Dívidas -> Minhas Contas"
```

---

### Task 4: Add view-state scaffolding and minimalist Home screen

**Files:**
- Modify: `src/App.tsx` — the `currentView` state (line 451), the header icon area, the main content area (line 803), and the bottom nav (lines 1043-1069).
- Modify: `src/App.tsx` imports (line 2) — add `TrendingUp` to the lucide-react import.

**Interfaces:**
- Consumes: `setCurrentView`
- Produces: new view values `'home' | 'payable' | 'receivable' | 'profile'`; `currentView` defaults to `'home'` after login.

- [ ] **Step 1: Add `TrendingUp` to the lucide-react import**

Find the import block at the top of `App.tsx` (lines 2-22) and add `TrendingUp,` to the list (keep alphabetical-ish order; place it near `TrendingDown`):

```tsx
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingDown, 
  TrendingUp,
  CheckCircle2, 
  ...
```

- [ ] **Step 2: Change the `currentView` state type and default**

Replace line 451:

```tsx
const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
```

with:

```tsx
const [currentView, setCurrentView] = useState<'home' | 'payable' | 'receivable' | 'profile'>('home');
```

Also update the `handleLogout` reset on line 551:

```tsx
setCurrentView('home');
```

- [ ] **Step 3: Rename the existing dashboard block to `payable`**

At line 803, change:

```tsx
{currentView === 'dashboard' && (
```

to:

```tsx
{currentView === 'payable' && (
```

- [ ] **Step 4: Add the Home view block**

Immediately after the opening `<div className="max-w-4xl mx-auto">` (line 802) and BEFORE the `{currentView === 'payable' && (` block, insert:

```tsx
{currentView === 'home' && (
  <div className="px-4 py-10 flex flex-col items-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md text-center mb-10"
    >
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Minhas Contas</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Escolha o que deseja gerenciar</p>
    </motion.div>

    <div className="w-full max-w-md grid grid-cols-1 gap-4">
      <motion.button
        type="button"
        onClick={() => setCurrentView('payable')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 transition-colors flex items-center gap-4 text-left"
      >
        <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 dark:shadow-none">
          <TrendingDown size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Contas a Pagar</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Dívidas e pagamentos</p>
        </div>
        <ChevronRight className="text-slate-300 dark:text-slate-600" size={24} />
      </motion.button>

      <motion.button
        type="button"
        onClick={() => setCurrentView('receivable')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors flex items-center gap-4 text-left"
      >
        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
          <TrendingUp size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Contas a Receber</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recebimentos e valores</p>
        </div>
        <ChevronRight className="text-slate-300 dark:text-slate-600" size={24} />
      </motion.button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Update the bottom nav Home button**

Replace the bottom nav block (lines 1044-1068) so the Home button targets `'home'` and is active for both `'home'` and `'payable'`:

```tsx
<div className="max-w-md mx-auto flex justify-between items-center h-16">
  <button 
    onClick={() => setCurrentView('home')}
    className={`flex flex-col items-center gap-1 transition-colors ${(currentView === 'home' || currentView === 'payable') ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    <Home size={24} strokeWidth={(currentView === 'home' || currentView === 'payable') ? 2.5 : 2} />
    <span className="text-[10px] font-medium">Início</span>
  </button>

  <button 
    onClick={() => {
      if (currentView === 'receivable') {
        setIsAddReceivableModalOpen(true);
      } else {
        setIsAddModalOpen(true);
      }
    }}
    className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none -mt-8 hover:bg-emerald-700 transition-colors active:scale-95"
  >
    <Plus size={28} />
  </button>

  <button 
    onClick={() => setCurrentView('profile')}
    className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'profile' ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    <User size={24} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
    <span className="text-[10px] font-medium">Perfil</span>
  </button>
</div>
```

Note: `setIsAddReceivableModalOpen` is defined in Task 5. To keep this task compiling, add a temporary placeholder state in this step:

In the state section (after `setIsPaymentModalOpen`, line ~457), add:

```tsx
const [isAddReceivableModalOpen, setIsAddReceivableModalOpen] = useState(false);
```

- [ ] **Step 6: Verify lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Smoke test**

Run: `npm run dev` and open the app at http://localhost:3000. Log in. Confirm:
- The Home screen shows two cards (Contas a Pagar / Contas a Receber).
- Tapping "Contas a Pagar" shows the existing debts dashboard.
- Tapping the bottom-nav Home icon returns to Home.
- The bottom-nav + button opens the existing Add Debt modal on Home/payable screens.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat(home): add minimalist Home screen with Pagar/Receber cards"
```

---

### Task 5: Add Receivable state, loaders, and handlers

**Files:**
- Modify: `src/App.tsx` — state section (lines ~454-467), data-loading `useEffect` (lines ~502-531), and add new handlers after `deleteDebt` (line ~697).

**Interfaces:**
- Consumes: `db.receivables`, `db.receivable_payments`, `Receivable` type from `types.ts`, `User` from `db.ts`.
- Produces:
  - `receivables: Receivable[]` state
  - `handleAddReceivable`, `handleEditReceivable`, `handleAddReceivablePayment`, `deleteReceivable`
  - `receivableCategories`, `receivableStats`, `filteredReceivables` useMemo
  - form states `newReceivable`, `editingReceivable`, `newReceivablePayment`
  - modal states `isAddReceivableModalOpen`, `isEditReceivableModalOpen`, `isReceivablePaymentModalOpen`, `selectedReceivableId`, `filterReceivable`, `selectedReceivableCategory`

- [ ] **Step 1: Add the `Receivable` import**

In the import from `./types` (line 24), add `Receivable`:

```tsx
import { Debt, Payment, Receivable } from './types';
```

- [ ] **Step 2: Add receivable state variables**

After the existing form states block (after line 467 `const [newPayment, setNewPayment] = useState({ amount: '' });`), add:

```tsx
// Receivable states
const [receivables, setReceivables] = useState<Receivable[]>([]);
const [isAddReceivableModalOpen, setIsAddReceivableModalOpen] = useState(false);
const [isEditReceivableModalOpen, setIsEditReceivableModalOpen] = useState(false);
const [isReceivablePaymentModalOpen, setIsReceivablePaymentModalOpen] = useState(false);
const [selectedReceivableId, setSelectedReceivableId] = useState<string | null>(null);
const [filterReceivable, setFilterReceivable] = useState<'all' | 'received' | 'pending'>('all');
const [selectedReceivableCategory, setSelectedReceivableCategory] = useState<string>('all');

// Receivable form states
const [newReceivable, setNewReceivable] = useState({ description: '', totalAmount: '', category: '' });
const [editingReceivable, setEditingReceivable] = useState<{ id: string, description: string, totalAmount: string, category: string } | null>(null);
const [newReceivablePayment, setNewReceivablePayment] = useState({ amount: '' });
```

If you added a placeholder `isAddReceivableModalOpen` in Task 4 Step 5, remove the duplicate — keep only the one declared here.

- [ ] **Step 3: Add receivable data loader in the existing `useEffect`**

Inside the `loadData` function (lines 503-527), after the debts loop sets `setDebts(formattedDebts)` (line 527) and BEFORE the closing of `loadData`, add a parallel block that loads receivables:

```tsx
const receivablesData = await db.receivables.where('user_id').equals(user.id).toArray();
const formattedReceivables: Receivable[] = [];
for (const r of receivablesData) {
  const rPayments = await db.receivable_payments.where('receivable_id').equals(r.id).toArray();
  formattedReceivables.push({
    id: r.id,
    description: r.description,
    category: r.category || undefined,
    totalAmount: r.total_amount,
    receivedAmount: r.received_amount,
    createdAt: r.created_at,
    payments: rPayments.map(p => ({
      id: p.id,
      amount: p.amount,
      date: p.date,
    })),
  });
}
setReceivables(formattedReceivables);
```

Also add `setReceivables([])` to the early-return branch where `!user` (around line 505) — right after the existing `setDebts([]);`.

- [ ] **Step 4: Add `handleAddReceivable`**

After the `deleteDebt` function (line 697), add:

```tsx
const handleAddReceivable = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newReceivable.description || !newReceivable.totalAmount) return;

  const receivable: Receivable = {
    id: crypto.randomUUID(),
    description: newReceivable.description,
    category: newReceivable.category.trim() || undefined,
    totalAmount: parseFloat(newReceivable.totalAmount),
    receivedAmount: 0,
    payments: [],
    createdAt: new Date().toISOString(),
  };

  if (user) {
    try {
      await db.receivables.add({
        id: receivable.id,
        user_id: user.id,
        description: receivable.description,
        category: newReceivable.category.trim() || undefined,
        total_amount: receivable.totalAmount,
        received_amount: 0,
        created_at: receivable.createdAt,
      });
    } catch (err) {
      console.error('Erro ao salvar conta a receber:', err);
    }
  }

  setReceivables([...receivables, receivable]);
  setNewReceivable({ description: '', totalAmount: '', category: '' });
  setIsAddReceivableModalOpen(false);
};

const handleEditReceivable = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingReceivable || !editingReceivable.description || !editingReceivable.totalAmount) return;

  const updatedTotal = parseFloat(editingReceivable.totalAmount);

  if (user) {
    try {
      await db.receivables.update(editingReceivable.id, {
        description: editingReceivable.description,
        category: editingReceivable.category.trim() || undefined,
        total_amount: updatedTotal,
      });
    } catch (err) {
      console.error('Erro ao atualizar conta a receber:', err);
    }
  }

  setReceivables(prev => prev.map(r =>
    r.id === editingReceivable.id
      ? { ...r, description: editingReceivable.description, totalAmount: updatedTotal, category: editingReceivable.category.trim() || undefined }
      : r
  ));
  setEditingReceivable(null);
  setIsEditReceivableModalOpen(false);
};

const handleAddReceivablePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedReceivableId || !newReceivablePayment.amount) return;

  const amount = parseFloat(newReceivablePayment.amount);
  const paymentId = crypto.randomUUID();
  const date = new Date().toISOString();

  try {
    await db.receivable_payments.add({
      id: paymentId,
      receivable_id: selectedReceivableId,
      amount: amount,
      date: date,
    });
  } catch (err) {
    console.error('Erro ao salvar recebimento:', err);
  }

  const receivable = receivables.find(r => r.id === selectedReceivableId);
  if (receivable) {
    try {
      await db.receivables.update(selectedReceivableId, {
        received_amount: Math.min(receivable.receivedAmount + amount, receivable.totalAmount),
      });
    } catch (err) {
      console.error('Erro ao atualizar valor recebido:', err);
    }
  }

  setReceivables(prev => prev.map(r => {
    if (r.id === selectedReceivableId) {
      const updatedReceived = Math.min(r.receivedAmount + amount, r.totalAmount);
      const payment: Payment = { id: paymentId, amount, date };
      return { ...r, receivedAmount: updatedReceived, payments: [payment, ...r.payments] };
    }
    return r;
  }));

  setNewReceivablePayment({ amount: '' });
  setIsReceivablePaymentModalOpen(false);
  setSelectedReceivableId(null);
};

const deleteReceivable = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir esta conta a receber?')) {
    try {
      await db.receivable_payments.where('receivable_id').equals(id).delete();
    } catch (err) {
      console.error('Erro ao deletar recebimentos:', err);
    }
    try {
      await db.receivables.delete(id);
    } catch (err) {
      console.error('Erro ao deletar conta a receber:', err);
    }
    setReceivables(receivables.filter(r => r.id !== id));
  }
};
```

- [ ] **Step 5: Add `receivableCategories`, `receivableStats`, `filteredReceivables` useMemo**

After the existing `filteredDebts` useMemo (line 748), add:

```tsx
const receivableCategories = useMemo(() => {
  const cats = receivables
    .map(r => r.category?.trim())
    .filter((c): c is string => !!c);
  const uniqueCatsMap = new Map<string, string>();
  cats.forEach(cat => {
    const lower = cat.toLowerCase();
    if (!uniqueCatsMap.has(lower)) uniqueCatsMap.set(lower, cat);
  });
  return ['all', ...Array.from(uniqueCatsMap.values())];
}, [receivables]);

const receivableStats = useMemo(() => {
  const filteredByCategory = selectedReceivableCategory === 'all'
    ? receivables
    : receivables.filter(r => r.category?.toLowerCase() === selectedReceivableCategory.toLowerCase());
  const totalReceivable = filteredByCategory.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalReceived = filteredByCategory.reduce((acc, r) => acc + r.receivedAmount, 0);
  const remaining = totalReceivable - totalReceived;
  const overallProgress = totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0;
  return { totalReceivable, totalReceived, remaining, overallProgress };
}, [receivables, selectedReceivableCategory]);

const filteredReceivables = useMemo(() => {
  let result = receivables;
  if (selectedReceivableCategory !== 'all') {
    result = result.filter(r => r.category?.toLowerCase() === selectedReceivableCategory.toLowerCase());
  }
  if (filterReceivable === 'received') {
    result = result.filter(r => r.receivedAmount >= r.totalAmount);
  } else if (filterReceivable === 'pending') {
    result = result.filter(r => r.receivedAmount < r.totalAmount);
  }
  return result;
}, [receivables, filterReceivable, selectedReceivableCategory]);
```

- [ ] **Step 6: Verify lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(receivables): add state, loaders, CRUD handlers, memoized filters"
```

---

### Task 6: Add the Receivables view (dashboard mirror)

**Files:**
- Modify: `src/App.tsx` — insert the `{currentView === 'receivable' && (...)}` block immediately AFTER the closing of the `{currentView === 'payable' && (...)}` block (after line 1026).

**Interfaces:**
- Consumes: `receivables`, `filteredReceivables`, `receivableCategories`, `receivableStats`, `filterReceivable`, `setFilterReceivable`, `selectedReceivableCategory`, `setSelectedReceivableCategory`, `formatCurrency`, `setEditingReceivable`, `setIsEditReceivableModalOpen`, `setSelectedReceivableId`, `setIsReceivablePaymentModalOpen`, `deleteReceivable`.
- Produces: the receivables dashboard screen.

- [ ] **Step 1: Insert the receivables view block**

After the payable block's closing `)}` (line 1026), insert:

```tsx
{currentView === 'receivable' && (
  <div className="px-4 py-8 flex flex-col">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 order-2 sm:order-1">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total a Receber</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(receivableStats.totalReceivable)}</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <p className="text-emerald-500 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Recebido</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(receivableStats.totalReceived)}</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <p className="text-rose-500 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">Restante</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(receivableStats.remaining)}</p>
      </motion.div>
    </div>

    {/* Status Filters */}
    <div className="mb-4 order-1 sm:order-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setFilterReceivable('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterReceivable === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
        >
          Todas ({receivables.length})
        </button>
        <button 
          onClick={() => setFilterReceivable('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterReceivable === 'pending' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
        >
          A Receber ({receivables.filter(r => r.receivedAmount < r.totalAmount).length})
        </button>
        <button 
          onClick={() => setFilterReceivable('received')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterReceivable === 'received' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
        >
          Recebidas ({receivables.filter(r => r.receivedAmount >= r.totalAmount).length})
        </button>
      </div>
    </div>

    {/* Category Filters */}
    {receivableCategories.length > 1 && (
      <div className="mb-6 order-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2">Categorias:</span>
          {receivableCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedReceivableCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${selectedReceivableCategory === cat ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Receivable List */}
    <div className="space-y-4 order-4">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <TrendingUp size={20} className="text-emerald-500" />
        {filterReceivable === 'all' ? 'Minhas Contas a Receber' : filterReceivable === 'received' ? 'Contas Recebidas' : 'Contas a Receber'}
      </h2>
      
      {filteredReceivables.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
            <TrendingUp size={32} />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Nenhuma conta a receber encontrada.</p>
          {filterReceivable !== 'all' && (
            <button 
              onClick={() => setFilterReceivable('all')}
              className="mt-4 text-emerald-600 dark:text-emerald-500 font-medium hover:underline"
            >
              Ver todas as contas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReceivables.map((receivable, index) => {
            const progress = receivable.totalAmount > 0 ? (receivable.receivedAmount / receivable.totalAmount) * 100 : 0;
            const isReceived = receivable.receivedAmount >= receivable.totalAmount;

            return (
              <motion.div
                key={receivable.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{receivable.description}</h3>
                      {receivable.category && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-tighter">
                          {receivable.category}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      {new Date(receivable.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingReceivable({
                          id: receivable.id,
                          description: receivable.description,
                          totalAmount: receivable.totalAmount.toString(),
                          category: receivable.category || ''
                        });
                        setIsEditReceivableModalOpen(true);
                      }}
                      className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedReceivableId(receivable.id);
                        setIsReceivablePaymentModalOpen(true);
                      }}
                      disabled={isReceived}
                      className={`p-2 rounded-lg transition-colors ${isReceived ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}
                      title="Registrar Recebimento"
                    >
                      <DollarSign size={18} />
                    </button>
                    <button 
                      onClick={() => deleteReceivable(receivable.id)}
                      className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Recebido: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(receivable.receivedAmount)}</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Total: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(receivable.totalAmount)}</span>
                    </span>
                  </div>

                  <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full ${isReceived ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs font-medium">
                      {isReceived ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Recebida
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          Faltam {formatCurrency(receivable.totalAmount - receivable.receivedAmount)}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${isReceived ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {receivable.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <details className="group/details">
                      <summary className="text-xs font-medium text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 list-none">
                        <History size={12} />
                        Ver histórico de recebimentos
                        <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-2 space-y-2">
                        {receivable.payments.map(p => (
                          <div key={p.id} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                            <span>{new Date(p.date).toLocaleDateString('pt-BR')}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(receivables): add receivables dashboard view mirroring debts"
```

---

### Task 7: Add Receivable modals (Add / Edit / Payment)

**Files:**
- Modify: `src/App.tsx` — insert three new `<AnimatePresence>` blocks immediately after the existing Add Payment Modal's closing `</AnimatePresence>` (line 1252), just before the final closing `</div>` (line 1253).

**Interfaces:**
- Consumes: `isAddReceivableModalOpen`, `newReceivable`, `setNewReceivable`, `handleAddReceivable`, `receivableCategories`, `isEditReceivableModalOpen`, `editingReceivable`, `setEditingReceivable`, `handleEditReceivable`, `isReceivablePaymentModalOpen`, `receivables`, `selectedReceivableId`, `newReceivablePayment`, `setNewReceivablePayment`, `handleAddReceivablePayment`.

- [ ] **Step 1: Insert the Add Receivable modal**

After the last existing `</AnimatePresence>` (line 1252), add:

```tsx
{/* Add Receivable Modal */}
<AnimatePresence>
  {isAddReceivableModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nova Conta a Receber</h2>
          <button onClick={() => setIsAddReceivableModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleAddReceivable} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Freelance, Salário, Venda..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={newReceivable.description}
              onChange={e => setNewReceivable({...newReceivable, description: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="0,00"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={newReceivable.totalAmount}
              onChange={e => setNewReceivable({...newReceivable, totalAmount: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Opcional)</label>
            <input 
              type="text" 
              list="existing-receivable-categories"
              placeholder="Ex: Freelance, Salário, Investimento..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={newReceivable.category}
              onChange={e => setNewReceivable({...newReceivable, category: e.target.value})}
            />
            <datalist id="existing-receivable-categories">
              {receivableCategories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            Adicionar Conta a Receber
          </button>
        </form>
      </motion.div>
    </div>
  )}
</AnimatePresence>

{/* Edit Receivable Modal */}
<AnimatePresence>
  {isEditReceivableModalOpen && editingReceivable && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Conta a Receber</h2>
          <button onClick={() => setIsEditReceivableModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleEditReceivable} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Freelance, Salário, Venda..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={editingReceivable.description}
              onChange={e => setEditingReceivable({...editingReceivable, description: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="0,00"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={editingReceivable.totalAmount}
              onChange={e => setEditingReceivable({...editingReceivable, totalAmount: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Opcional)</label>
            <input 
              type="text" 
              list="existing-receivable-categories-edit"
              placeholder="Ex: Freelance, Salário, Investimento..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={editingReceivable.category}
              onChange={e => setEditingReceivable({...editingReceivable, category: e.target.value})}
            />
            <datalist id="existing-receivable-categories-edit">
              {receivableCategories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            Salvar Alterações
          </button>
        </form>
      </motion.div>
    </div>
  )}
</AnimatePresence>

{/* Add Receivable Payment Modal */}
<AnimatePresence>
  {isReceivablePaymentModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Recebimento</h2>
          <button onClick={() => setIsReceivablePaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleAddReceivablePayment} className="p-6 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Conta: <span className="font-bold text-slate-700 dark:text-slate-200">
              {receivables.find(r => r.id === selectedReceivableId)?.description}
            </span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor do Recebimento (R$)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="0,00"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={newReceivablePayment.amount}
              onChange={e => setNewReceivablePayment({amount: e.target.value})}
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            Confirmar Recebimento
          </button>
        </form>
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

- [ ] **Step 2: Verify lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS — build completes, `dist/` regenerated. No TypeScript errors.

- [ ] **Step 4: Smoke test**

Run: `npm run dev` and verify at http://localhost:3000:
- Home → "Contas a Receber" card opens the receivables dashboard (empty state visible).
- Bottom-nav + button opens "Nova Conta a Receber" modal. Add one (e.g., "Freelance X", R$ 1000).
- The new receivable appears with 0% progress, "Faltam R$ 1.000,00".
- Edit button opens edit modal; change description; save reflects immediately.
- Dollar button opens "Registrar Recebimento"; enter R$ 400; progress becomes 40%, "Recebido: R$ 400,00".
- History (`<details>`) shows the recebimento entry.
- Delete button removes the receivable after confirm.
- Navigate to "Contas a Pagar" — existing debts are intact and unchanged.

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(receivables): add Add/Edit/Payment modals for contas a receber"
```

---

### Task 8: Final integration verification and version bump

**Files:**
- Modify: `src/App.tsx` — the profile screen's version display (search for `Versao` or `1.1.0`).

**Interfaces:**
- Consumes: nothing new
- Produces: version string `1.2.0`

- [ ] **Step 1: Bump the displayed version**

Search `App.tsx` for the version string (in the ProfileScreen component, around the footer). Change `1.1.0` to `1.2.0`. If the string is `Versão 1.1.0` or `Versao 1.1.0`, change it to `Versão 1.2.0` (use the existing spelling).

- [ ] **Step 2: Full build verification**

Run: `npm run lint`
Expected: PASS.

Run: `npm run build`
Expected: PASS. Confirm `dist/manifest.webmanifest` contains `"name":"Minhas Contas"`.

- [ ] **Step 3: Full manual smoke test**

Run: `npm run dev`. Complete this checklist:
- [ ] Login screen shows "Bem-vindo ao Minhas Contas".
- [ ] After login, Home screen appears with two cards.
- [ ] "Contas a Pagar" card → debts dashboard works (add/edit/pay/delete unchanged).
- [ ] "Contas a Receber" card → receivables dashboard works (add/edit/receive/delete).
- [ ] Bottom-nav Home icon returns to Home from any screen.
- [ ] Bottom-nav + opens the correct add-modal for the current screen.
- [ ] Profile screen shows version `1.2.0`.
- [ ] Dark mode toggle works on all screens including Home and Receivables.
- [ ] Reloading the page preserves debts AND receivables (IndexedDB persistence).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "chore: bump version to 1.2.0 for Minhas Contas release"
```

---

## Notes for the implementer

- **Dexie version 2 is non-destructive:** existing users' debts/payments remain untouched. The new tables are simply added. Never edit version 1's stores in a way that drops columns.
- **No test framework:** this project has no `test` script in `package.json`. All verification is `npm run lint` (tsc --noEmit) + `npm run build` + manual smoke testing via `npm run dev`. Do not add a test framework as part of this plan.
- **`App.tsx` size:** it will grow from ~1255 to ~1900 lines. This is acceptable per the spec; refactoring into separate component files is explicitly out of scope.
- **State duplication:** the receivable state intentionally mirrors the debt state (parallel arrays, parallel handlers) per the approved Approach A. Resist the urge to "DRY" them into a generic abstraction — it would complicate the Dexie calls and risk regressing the working debts feature.
- **Edit in place:** when modifying `App.tsx`, use exact string matching from the surrounding context. Line numbers in this plan are approximate starting references and will drift as earlier tasks insert code.
