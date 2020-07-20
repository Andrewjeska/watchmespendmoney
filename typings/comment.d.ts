interface TransactionComment {
  id: string;
  uid: string;
  displayName: string;
  dateTime: Date;
  text: string;
  transactionId: string;
  // parentId?: string;
  children: Array<TransactionComment>;
}
