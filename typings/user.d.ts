interface UserTransaction {
  id: string;
  uid?: string;
  date: string;
  description: string | null;
  amount: number;
  category: string;
}
//TODO: too many optional types

interface UserMeta {
  uid: string | null;
  displayName: string;
}

interface UserStats {
  currentMonthSpend: number;
  daysSinceLastSpend: number | string;
  avgSpendPerDay: number;
}

declare module "sfcookies";
