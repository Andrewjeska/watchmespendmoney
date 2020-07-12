interface UserTransaction {
  id: string;
  uid?: string;
  date: string;
  description: string | null;
  amount: number | null;
  category: string;
}
//TODO: too many optional types

interface UserMeta {
  uid: string | null;
  displayName: string | null;
}

declare module "sfcookies";
