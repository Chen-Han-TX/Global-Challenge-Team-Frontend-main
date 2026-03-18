import type {
  EnrichedTransaction,
} from "../types/transaction";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateToISO = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

export const parseTransactionAmount = (
  credit: string | number,
  debit: string | number
): number => {
  const creditNum =
    typeof credit === "string" ? parseFloat(credit.replace(/,/g, "")) : credit;
  const debitNum =
    typeof debit === "string" ? parseFloat(debit.replace(/,/g, "")) : debit;

  return creditNum || -debitNum || 0;
};

export const generateMockEnrichedData = (rawData: any[]): EnrichedTransaction[] => {
  return rawData.map((transaction, index) => ({
    TransactionDate: formatDateToISO(transaction.Date),
    Description: transaction.Description.toLowerCase(),
    Category: "Unknown", // As per the example, it's "Unknown" unless further logic is added
    AmountUSD: parseTransactionAmount(transaction.Credit, transaction.Debit),
    Balance: null, // As per the example
    TransactionClassification: classifyTransaction(transaction.Description),
    MerchantClassification: extractMerchant(transaction.Description),
    NormalizedEntity: normalizeEntity(transaction.Description),
    TransactionName: cleanTransactionName(transaction.Description.toLowerCase()),
    IsCreditCardExpense: /credit|card|visa|mastercard/i.test(
      transaction.Description.toLowerCase()
    ),
    Reason: `Classified based on description pattern`,
    Confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(1)), // Random confidence between 0.7 and 1.0
    RuleHit: index % 2 === 0 ? "RULE_MERCHANT_LOOKUP" : "RULE_PAYMENT_RAIL",
    originalData: transaction,
  }));
};

const classifyTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  if (desc.includes("amazon")) return "Merchant Payment";
  if (desc.includes("afterpay") || desc.includes("stripe"))
    return "Payment Rail Transaction";
  if (desc.includes("payment")) return "Payment";
  return "Other";
};

const extractMerchant = (description: string): string => {
  const desc = description.toLowerCase();
  if (desc.includes("amazon")) return "Amazon";
  if (desc.includes("afterpay")) return "Payment Processor";
  const merchants = ["Stripe", "PayPal", "Starbucks", "Netflix", "Local Grocer", "Online Store"];
  for (const merchant of merchants) {
    if (desc.includes(merchant.toLowerCase())) return merchant;
  }
  return "Miscellaneous Merchant";
};

const cleanTransactionName = (description: string): string => {
  return description.split("  ")[0] || description;
};

const normalizeEntity = (description: string): string => {
  const desc = description.toLowerCase();
  if (desc.includes("amazon")) return "Amazon";
  if (desc.includes("afterpay")) return "Payment Processor";
  return description.split(" ")[0] || "General Transaction";
};