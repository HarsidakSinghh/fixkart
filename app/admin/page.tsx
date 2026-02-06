import { prisma } from "@/lib/prisma";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Truck, CheckCircle, Clock, Users, UserCheck, UserX, AlertCircle } from "lucide-react";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
export const dynamic = "force-dynamic";
export default async function AdminDashboard() {
    // 1. Calculate Date Range (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Fetch Data
    const [
        vendorStats,
        orderStats,
        revenueResult,
        recentVendors,
        recentOrders
    ] = await Promise.all([
        prisma.vendorProfile.groupBy({
            by: ['status'],
            _count: { id: true }
        }),
        prisma.order.groupBy({
            by: ['status'],
            _count: { id: true }
        }),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: { not: "REJECTED" } }
        }),
        prisma.vendorProfile.findMany({ take: 5, orderBy: { updatedAt: 'desc' } }),
        prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: { not: "REJECTED" }
            },
            select: { createdAt: true, totalAmount: true }
        })
    ]);

    // --- DATA PROCESSING ---
    const getCount = (arr: any[], status: string) => arr.find((i: any) => i.status === status)?._count.id || 0;

    const vendorApproved = getCount(vendorStats, "APPROVED");
    const vendorPending = getCount(vendorStats, "PENDING");
    const vendorSuspended = getCount(vendorStats, "SUSPENDED");
    const vendorTotal = vendorApproved + vendorPending + vendorSuspended;

    const orderPending = getCount(orderStats, "PENDING");
    const orderApproved = getCount(orderStats, "APPROVED");
    const orderCompleted = getCount(orderStats, "COMPLETED");
    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Chart Data Processing
    const chartDataMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { weekday: 'short' });
        chartDataMap.set(key, 0);
    }
    recentOrders.forEach(order => {
        const key = order.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (chartDataMap.has(key)) {
            chartDataMap.set(key, (chartDataMap.get(key) || 0) + order.totalAmount);
        }
    });
    const chartData = Array.from(chartDataMap).map(([name, total]) => ({ name, total }));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>

            {/* SECTION 1: ORDER & REVENUE KPIS */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Order Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Lifetime Revenue</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{orderPending}</div>
                            <p className="text-xs text-muted-foreground">Action required</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Processing</CardTitle>
                            <Truck className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{orderApproved}</div>
                            <p className="text-xs text-muted-foreground">In progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{orderCompleted}</div>
                            <p className="text-xs text-muted-foreground">Delivered</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECTION 2: CHARTS */}
            <DashboardCharts data={chartData} />

            {/* SECTION 3: VENDOR OVERVIEW (New Cards Added Here) */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Vendor Overview</h2>

                {/* 1. Vendor Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vendorTotal}</div>
                            <p className="text-xs text-muted-foreground">Registered accounts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <UserCheck className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{vendorApproved}</div>
                            <p className="text-xs text-muted-foreground">Active sellers</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{vendorPending}</div>
                            <p className="text-xs text-muted-foreground">Waiting for approval</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                            <UserX className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{vendorSuspended}</div>
                            <p className="text-xs text-muted-foreground">Access revoked</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Recent Vendors Table */}
                <div className="rounded-md border bg-background">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Recent Vendor Signups</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead className="text-right">Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentVendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">{vendor.fullName}</TableCell>
                                    <TableCell>{vendor.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                vendor.status === "SUSPENDED" ? "destructive" :
                                                    vendor.status === "APPROVED" ? "default" : "outline"
                                            }
                                            className={vendor.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                                        >
                                            {vendor.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{vendor.city}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {new Date(vendor.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}