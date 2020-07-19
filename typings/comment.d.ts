interface TransactionComment {
  id: string;
  uid: string;
  dateTime: Date;
  text: string;
  transactionId: string;
  // parentId?: string;
  children: Array<TransactionComment>;
}
