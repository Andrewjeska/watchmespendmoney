interface UserTransaction {
  date: string;
  amount: number | null;
  description: string | null;
  category: string;
  _id?: string;
  id?: string;
  user?: string;
}
//TODO: too many optional types

interface UserMeta {
  handle: string;
  profile: string;
}

declare module "sfcookies";
