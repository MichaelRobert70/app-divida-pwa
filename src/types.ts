export interface Payment {
  id: string;
  amount: number;
  date: string;
}

export interface Debt {
  id: string;
  description: string;
  category?: string;
  totalAmount: number;
  paidAmount: number;
  payments: Payment[];
  createdAt: string;
}

export type DebtSummary = {
  totalDebt: number;
  totalPaid: number;
  remaining: number;
  overallProgress: number;
};
