interface UserTransaction {
  id: string;
  uid: string;
  displayName: string;
  date: string;
  description: string | null;
  amount: number;
  category: string;
  comments: Array<TransactionComment>;
}

interface UserMeta {
  uid: string | null;
  displayName: string;
}

interface UserStats {
  currentMonthSpend: number;
  daysSinceLastSpend: number | string;
  avgSpendPerDay: number;
  displayName: string;
}

interface UserBankAccount {
  name: string;
  mask: string;
}

declare module "sfcookies";
