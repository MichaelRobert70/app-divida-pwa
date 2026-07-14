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

class AppDatabase extends Dexie {
  users!: Table<User, string>;
  debts!: Table<Debt, string>;
  payments!: Table<Payment, string>;

  constructor() {
    super('dividas_db');
    this.version(1).stores({
      users: 'id, email',
      debts: 'id, user_id, created_at',
      payments: 'id, debt_id',
    });
  }
}

export const db = new AppDatabase();
