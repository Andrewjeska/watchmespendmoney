interface UserTransaction {
  date: string;
  amount: number | null;
  description: string | null;
  category: string;
  id: string;
}

interface UserMeta {
  handle: string;
  profile: string;
}

declare module "sfcookies";
