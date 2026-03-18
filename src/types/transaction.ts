export interface RawTransaction {
  Date: string;
  Description: string;
  Name: string;
  Category: string;
  Credit: string | number | null;
  Debit: string | number | null;
  Balance: string | number;
  Currency: string;
}

export interface EnrichedTransaction {
  TransactionDate: string;
  Description: string;
  Category: string;
  AmountUSD: number;
  Balance: number | null;
  TransactionClassification: string;
  MerchantClassification: string;
  NormalizedEntity: string;
  TransactionName: string;
  IsCreditCardExpense: boolean;
  Reason: string;
  Confidence: number;
  RuleHit: string;
  originalData: Partial<RawTransaction>;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  averageTransaction: number;
  byCategory: Record<string, number>;
  byMerchant: Record<string, number>;
  topMerchants: Array<{ name: string; count: number; amount: number }>;
  classificationBreakdown: Record<string, number>;
}

export interface DashboardData {
  rawTransactions: RawTransaction[];
  enrichedTransactions: EnrichedTransaction[];
  stats: TransactionStats;
  isLoading: boolean;
  error?: string;
}

export interface TransactionInput {
  TransactionDate: string;
  Description: string;
  AmountUSD: number;
}


export interface TransactionOutput {
  enriched_transactions?: EnrichedTransaction[] | null;
}