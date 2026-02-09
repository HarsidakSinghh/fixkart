import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  RefreshCw,
  PhoneCall,
  PlusCircle
} from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { getVendorStats } from "@/app/actions/vendor-stats";
import SalesChart from "@/components/vendor/SalesChart";
import VendorSidebar from "@/components/vendor/VendorSidebar";

export default async function VendorDashboard() {
  const user = await currentUser();
  const statsData = await getVendorStats();

  const stats = statsData || {
    totalRevenue: 0,
    totalSalesCount: 0,
    chartData: [],
    pendingOrders: 0,
    inventoryCount: 0,
    returns: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* --- SIDEBAR --- */}
      <VendorSidebar user={JSON.parse(JSON.stringify(user))} />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">

        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {user?.firstName}! Here is your store's performance today.
            </p>
          </div>
        </header>

        {/* --- 1. STATUS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp className="text-green-600" />}
            color="bg-green-50"
            textColor="text-green-700"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders || 0}
            icon={<ShoppingCart className="text-orange-600" />}
            color="bg-orange-50"
            textColor="text-orange-700"
            desc="Action Required"
          />
          <StatCard
            title="Active Inventory"
            value={stats.inventoryCount || 0}
            icon={<Package className="text-blue-600" />}
            color="bg-blue-50"
            textColor="text-blue-700"
            desc="Listed Items"
          />
          <StatCard
            title="Total Sales Count"
            value={stats.totalSalesCount}
            icon={<RefreshCw className="text-red-600" />}
            color="bg-red-50"
            textColor="text-red-700"
            desc="Items Sold"
          />
        </div>

        {/* --- 2. PERFORMANCE SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* Chart Area */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Sales Trends</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Daily Revenue</span>
            </div>

            {/* REAL-TIME CHART COMPONENT */}
            {stats.chartData && stats.chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <SalesChart data={stats.chartData} />
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                <p>No sales data to display yet.</p>
                <span className="text-xs mt-2">Sales will appear here automatically.</span>
              </div>
            )}
          </div>

          {/* Quick Actions (Sidebar style) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <h3 className="font-bold text-gray-800">Quick Actions</h3>

            <Link
              href="/vendor/add-product"
              className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-gray-300 hover:border-[#00529b] hover:bg-blue-50 group transition-all"
            >
              <div className="bg-blue-100 text-[#00529b] p-2 rounded-full group-hover:bg-[#00529b] group-hover:text-white transition-colors">
                <PlusCircle size={24} />
              </div>
              <div>
                <span className="block font-bold text-gray-700">Add New Product</span>
                <span className="text-xs text-gray-500">Upload single item</span>
              </div>
            </Link>

            <div className="bg-gradient-to-br from-[#00529b] to-[#003d73] rounded-xl p-5 text-white mt-auto">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <PhoneCall size={16} /> Need Support?
              </h4>
              <p className="text-xs text-blue-100 mb-4 leading-relaxed">
                Having trouble with orders or listings? Our support team is available 24/7.
              </p>
              <Link href="/vendor/help" className="block w-full text-center bg-white text-[#00529b] py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, icon, color, textColor, desc }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
          {desc && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">{desc}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color} ${textColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
