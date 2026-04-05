/** Shape of a financial record after Decimal → number conversion */
export interface FormattedRecord {
  id: number;
  amount: number;
  type: string;
  category: string;
  date: Date;
  notes: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  user: { id: number; name: string; email: string };
}
