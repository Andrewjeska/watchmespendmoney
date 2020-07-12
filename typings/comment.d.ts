interface TransactionComment {
  _id: string;
  dateTime: Date;
  text: string;
  transactionId?: string;
  parentId?: string;
  user?: string;
  profile?: string;
}
