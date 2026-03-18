import type { EnrichedTransaction } from "../types/transaction";
import { formatCurrency, formatDate } from "../utils/formatting";
import { CreditCard, ShoppingBag, Globe, AlertCircle } from "lucide-react";

interface TransactionTableProps {
  transactions: EnrichedTransaction[];
  title?: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  title = "Transactions",
}) => {
  const getClassificationIcon = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "ecommerce":
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case "payment gateway":
        return <Globe className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50 sticky top-0">
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Merchant
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Classification
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Credit Card
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {formatDate(transaction.TransactionDate)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                <div className="font-medium">
                  {transaction.NormalizedEntity}
                </div>
                <div className="text-gray-500 text-xs">
                  {transaction.TransactionName}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                <span
                  className={
                    transaction.AmountUSD >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {formatCurrency(transaction.AmountUSD)}
                </span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {transaction.MerchantClassification}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {getClassificationIcon(
                    transaction.TransactionClassification
                  )}
                  <span className="text-sm text-gray-900">
                    {transaction.TransactionClassification}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {transaction.IsCreditCardExpense ? (
                  <CreditCard className="w-4 h-4 text-blue-500" />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;