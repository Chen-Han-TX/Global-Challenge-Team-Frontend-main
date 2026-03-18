import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TransactionStats } from "../types/transaction";

interface ChartsProps {
  stats: TransactionStats;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const Charts: React.FC<ChartsProps> = ({ stats }) => {
  // Prepare data for pie chart
  const pieData = Object.entries(stats.classificationBreakdown).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  // Prepare data for bar chart (top merchants)
  const barData = stats.topMerchants.slice(0, 5).map((merchant) => ({
    name: merchant.name,
    transactions: merchant.count,
    amount: merchant.amount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Classification Pie Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          Transaction Classification
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} transactions`, "Count"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Merchants Bar Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          Top Merchants by Transaction Count
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "amount") return [`$${value}`];
                  return [value];
                }}
              />
              <Legend />
              <Bar dataKey="transactions" name="Transactions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
