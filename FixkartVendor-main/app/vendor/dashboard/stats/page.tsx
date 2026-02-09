import React from "react";
import { getVendorStats } from "@/app/actions/vendor-stats";
import SalesChart from "@/components/vendor/SalesChart";
import { TrendingUp, ShoppingBag, CreditCard, Calendar } from "lucide-react";

export default async function VendorStatsPage() {
  const stats = await getVendorStats();

  if (!stats) {
    return <div>Loading stats or Unauthorized...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Sales & Analytics</h1>
        <p className="text-sm text-gray-500">Track your daily revenue and business growth.</p>
      </div>

      {/* 1. Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon={<CreditCard className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard 
          title="Total Items Sold" 
          value={stats.totalSalesCount} 
          icon={<ShoppingBag className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`₹${stats.totalSalesCount > 0 ? Math.round(stats.totalRevenue / stats.totalSalesCount).toLocaleString() : 0}`} 
          icon={<TrendingUp className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* 2. Main Sales Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400"/>
            Revenue Overview
          </h2>
        </div>
        
        {stats.chartData.length > 0 ? (
           <SalesChart data={stats.chartData} />
        ) : (
           <div className="h-64 flex items-center justify-center text-gray-400">
             No sales data available for this period.
           </div>
        )}
      </div>
    </div>
  );
}

// Simple internal component for the cards
function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  );
}