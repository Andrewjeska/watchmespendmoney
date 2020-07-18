interface UserTransaction {
  id: string;
  uid?: string;
  date: string;
  description: string | null;
  amount: number;
  category: string;
}

interface UserMeta {
  uid: string | null;
  displayName: string;
}

interface UserStats {
  currentMonthSpend: number;
  daysSinceLastSpend: number | string;
  avgSpendPerDay: number;
}

interface UserBankAccount {
  name: string;
  mask: string;
}

declare module "sfcookies";
