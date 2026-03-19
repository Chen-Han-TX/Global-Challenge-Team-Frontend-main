import { useState, useMemo, useEffect, useRef } from "react";
import FileUpload from "../components/FileUpload";
import StatsCards from "../components/StatsCards";
import Charts from "../components/Charts";
import TransactionTable from "../components/TransactionTable";
import PlotlyChart from "../components/PlotlyChart";
import { formatDateMMDDYYYY, formatDateToISO } from "../utils/date";

import type {
  DashboardData,
  RawTransaction,
  EnrichedTransaction,
  TransactionOutput,
  TransactionInput,
  // ForecastOutput
} from "../types/transaction";
import { generateMockEnrichedData } from "../utils/formatting";
import { RefreshCw, AlertCircle } from "lucide-react";

import forecast_output from "../assets/forecast_output.json";

const Dashboard: React.FC = () => {
  // Mock data for initial display
  const mockRawData: RawTransaction[] = useMemo(() => {
    const data: RawTransaction[] = [];
    const merchants = ["Amazon.com", "Afterpay", "Starbucks", "Netflix", "Local Grocer", "Online Store"];
    const categories = ["Marketplace Payments", "Electronic Deposit", "Food & Dining", "Subscriptions", "Groceries", "Online Retail"];

    for (let i = 0; i < 200; i++) {
      const merchant = merchants[i % merchants.length];
      const category = categories[i % categories.length];

      data.push({
        Date: `10/${(i % 30) + 1}/2025`,
        Description: `Transaction ${i + 1} from ${merchant} for ${category} on 10/${(i % 30) + 1
          }/2025`,
        Name: merchant.split(".")[0],
        Category: category,
        Credit: `${(Math.random() * 5000 + 100).toFixed(2)}`,
        Debit: i % 3 === 0 ? `${(Math.random() * 2000 + 50).toFixed(2)}` : "",
        Balance: `${(Math.random() * 50000 + 10000).toFixed(2)}`,
        Currency: "USD",
      });
    }
    return data;
  }, []);


  // Robust calculateStatistics: safely read numeric amount from possible fields.
  const calculateStatistics = (transactions: EnrichedTransaction[]) => {
    const totalTransactions = transactions.length;

    const getAmount = (t: EnrichedTransaction) =>
      Number(t.AmountUSD ?? (t as any).TransactionAmountUSD ?? 0) || 0;

    const totalAmount = transactions.reduce((sum, t) => sum + getAmount(t), 0);
    const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    const byCategory: Record<string, number> = {};
    const byMerchant: Record<string, number> = {};
    const classificationBreakdown: Record<string, number> = {};
    const merchantMap: Record<string, { count: number; amount: number }> = {};

    transactions.forEach((transaction) => {
      const classification = transaction.TransactionClassification ?? "Unclassified";
      const merchantClass = transaction.MerchantClassification ?? "Unknown";
      const normalizedEntity = transaction.NormalizedEntity ?? "Unknown";
      const amount = getAmount(transaction);

      classificationBreakdown[classification] = (classificationBreakdown[classification] || 0) + 1;
      byMerchant[merchantClass] = (byMerchant[merchantClass] || 0) + 1;
      byCategory[classification] =
        (byCategory[classification] || 0) + 1;


      if (!merchantMap[normalizedEntity]) merchantMap[normalizedEntity] = { count: 0, amount: 0 };
      merchantMap[normalizedEntity].count += 1;
      merchantMap[normalizedEntity].amount += amount;
    });

    const topMerchants = Object.entries(merchantMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // show top 5 merchants for the UI

    return {
      totalTransactions,
      totalAmount,
      averageTransaction,
      byCategory,
      byMerchant,
      topMerchants,
      classificationBreakdown,
    };
  };

  // Local state type: override enrichedTransactions to be EnrichedTransaction[] | null
  type LocalDashboardData = Omit<DashboardData, "enrichedTransactions"> & { enrichedTransactions: EnrichedTransaction[] | null };

  // initial dashboard data object (synchronous)
  const initialDashboard: LocalDashboardData = {
    rawTransactions: mockRawData,
    // Use a flat array of enriched transactions in state
    enrichedTransactions: null,
    stats: calculateStatistics([]),
    isLoading: false,
    error: "",
  };

  const [dashboardData, setDashboardData] = useState<LocalDashboardData>(initialDashboard);

  // New: tab state - default to "mock" (raw transactions) as requested
  const [activeTab, setActiveTab] = useState<"enriched" | "mock">("mock");

  // New: only render mock table contents after a user uploads a CSV file
  const [hasUploadedFile, setHasUploadedFile] = useState<boolean>(false);

  // Track elapsed upload time (in seconds) instead of a countdown
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const uploadIntervalRef = useRef<number | null>(null);


  const handleFileUpload = async (_file: File) => {
    // File is intentionally ignored — upload acts as a trigger only
    setDashboardData(prev => ({ ...prev, isLoading: true, error: "" }));

    // Start elapsed timer
    setElapsedSeconds(0);
    uploadIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds(prev => (prev ?? 0) + 1);
    }, 1000);

    try {
      // Always use mock data
      const rawTransactions = mockRawData;
      const enrichedTransactions = generateMockEnrichedData(rawTransactions);
      const stats = calculateStatistics(enrichedTransactions);

      // Simulate async processing delay (optional but feels realistic)
      await new Promise(res => setTimeout(res, 5000));

      setDashboardData({
        rawTransactions,
        enrichedTransactions,
        stats,
        isLoading: false,
        error: "",
      });

      setHasUploadedFile(true);
    } catch (err) {
      console.error("mock upload error:", err);
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to process mock transaction data.",
      }));
    } finally {
      if (uploadIntervalRef.current !== null) {
        clearInterval(uploadIntervalRef.current);
        uploadIntervalRef.current = null;
      }
    }
  };


  // Make sure to cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current !== null) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, []);

  const loadMockData = () => {
    const enriched = generateMockEnrichedData(mockRawData);
    const stats = calculateStatistics(enriched);
    setDashboardData({ rawTransactions: mockRawData, enrichedTransactions: enriched, stats, isLoading: false, error: "" });
  };

  const handleRefresh = async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true }));
    setTimeout(() => {
      loadMockData();
    }, 1000);
  };

  const forecastChartData = useMemo(() => {
    try {
      const preds = (forecast_output as any)?.forecast?.predictions ?? [];
      return preds.map((p: any) => ({
        date: new Date(p.date).getTime(), // PlotlyChart expects numeric timestamp
        value: Number(p.predicted_balance ?? p.predictedBalance ?? 0),
      }));
    } catch (e) {
      return [];
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Enrichment Dashboard</h1>
              <p className="text-gray-600 mt-2">Transform raw bank transaction data into enriched, meaningful records</p>
            </div>
            <button onClick={handleRefresh} disabled={dashboardData.isLoading} className="btn-secondary flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${dashboardData.isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </header>

        {/* File Upload */}
        <FileUpload onFileUpload={handleFileUpload} isLoading={dashboardData.isLoading} />

        {/* Elapsed upload timer (show while uploading, and keep final elapsed when finished) */}
        {elapsedSeconds !== null && dashboardData.isLoading && (
          <div className="mt-4 text-sm text-gray-700">
            Uploading... {elapsedSeconds}s elapsed
          </div>
        )}
        {elapsedSeconds !== null && !dashboardData.isLoading && hasUploadedFile && (
          <div className="mt-4 text-sm text-gray-700">
            Upload completed in {elapsedSeconds}s
          </div>
        )}

        {/* Error Message */}
        {dashboardData.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{dashboardData.error}</p>
            </div>
          </div>
        )}

        {/* Transaction Tables (with tabs: Mock Raw (default) | Enriched) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Transactions</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("mock")}
                  className={`px-3 py-1 rounded-md text-sm ${activeTab === "mock" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  Raw Transactions
                </button>
                <button
                  onClick={() => setActiveTab("enriched")}
                  className={`px-3 py-1 rounded-md text-sm ${activeTab === "enriched" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  Enriched Transactions
                </button>
              </div>
            </div>

            <div>
              {activeTab === "enriched" ? (
                <TransactionTable transactions={(dashboardData.enrichedTransactions ?? [])} />
              ) : (
                // Render the mock raw transactions table only after upload. Make it scrollable (card-like).
                hasUploadedFile ? (
                  <div className="border border-gray-100 rounded-md">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(dashboardData.rawTransactions ?? []).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {formatDateMMDDYYYY(formatDateToISO(row.Date))}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">{row.Description}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{row.Name}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{row.Category}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{row.Credit ?? "-"}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{row.Debit ?? "-"}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{row.Balance ?? "-"}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{row.Currency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 text-sm text-gray-500 border-t border-gray-100">
                      Showing {dashboardData.rawTransactions?.length ?? 0} raw transactions (scroll to browse).
                    </div>
                  </div>
                ) : (
                  // Not uploaded yet: show helpful placeholder (default tab is mock)
                  <div className="p-6 text-center text-sm text-gray-600">
                    Upload a CSV file to enable the Raw Transactions view.
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatsCards stats={dashboardData.stats} />

        {/* Charts */}
        <Charts stats={dashboardData.stats} />

        {/* NEW: Forecast chart section 
        
        
        <section className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">30-day Balance Forecast</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <PlotlyChart
              chartId="forecast-plot"
              isDarkMode={false}
              data={forecastChartData}
              height="320px"
              hoverTemplate="<b>Balance:</b> $%{y:.2f}<br>%{x|%b %d, %Y}<extra></extra>"
            />
          </div>
        </section>
        
        */}

        {/* Only show forecast after file upload */}
        {hasUploadedFile && (
          <section className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">30-day Balance Forecast</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <PlotlyChart
                chartId="forecast-plot"
                isDarkMode={false}
                data={forecastChartData}
                height="320px"
                hoverTemplate="<b>Balance:</b> $%{y:.2f}<br>%{x|%b %d, %Y}<extra></extra>"
              />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Crediling/Transaction Enrichment Project</p>
          <p className="mt-1">This dashboard demonstrates the data enrichment pipeline for the AI+X meetup.</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;