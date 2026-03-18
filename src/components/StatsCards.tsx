import React from "react";

type Stats = {
  totalTransactions?: number;
  totalAmount?: number;
  averageTransaction?: number;
  byCategory?: Record<string, number>;
  byMerchant?: Record<string, number>;
  topMerchants?: { name: string; count: number; amount: number }[];
  classificationBreakdown?: Record<string, number>;
  topCategories?: string[];
  topCategory?: string;
  categoriesCount?: number;
};

interface StatsCardsProps {
  stats: Stats;
}

const formatCurrency = (n?: number) =>
  n === undefined ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const {
    totalTransactions = 0,
    totalAmount = 0,
    averageTransaction = 0,
  } = stats ?? {};

  // Prefer deriving top categories from byCategory (no type changes required).
  const byCategory = stats?.byCategory ?? {};
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const derivedTopCategories = categoryEntries.map(([k]) => k);
  const derivedTopCategory = derivedTopCategories.length > 0 ? derivedTopCategories[0] : "";

  // Fall back to any existing optional fields if byCategory is empty
  const topCategoriesList = derivedTopCategories.length > 0 ? derivedTopCategories : (stats?.topCategories ?? []);
  const topCategoryFromProps = stats?.topCategory ?? "";
  const categoriesCountFromProps = stats?.categoriesCount ?? Object.keys(byCategory).length;

  const topCategoryLabel = derivedTopCategory
    ? derivedTopCategory
    : (topCategoryFromProps
      ? topCategoryFromProps
      : (topCategoriesList.length > 0
        ? topCategoriesList[0]
        : (categoriesCountFromProps > 0 ? `${categoriesCountFromProps} categories` : "—")));

  // For the small "Also:" text, prefer showing other top categories from the derived list
  const alsoList = topCategoriesList.length > 1 ? topCategoriesList.slice(1, 3) : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500">Total Transactions</div>
        <div className="mt-2 text-2xl font-bold text-blue-600">{totalTransactions}</div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500">Total Amount</div>
        <div className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500">Average Transaction</div>
        <div className="mt-2 text-2xl font-bold text-purple-600">{formatCurrency(averageTransaction)}</div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-sm text-gray-500">Top Category</div>
        <div className="mt-2 text-2xl font-bold text-orange-600">{topCategoryLabel}</div>
        {alsoList.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Also: {alsoList.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCards;