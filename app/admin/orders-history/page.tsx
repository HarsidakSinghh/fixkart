import { prisma } from "@/lib/prisma";
import OrderHistoryTable from "@/components/admin/order-history-table";
import TableSearch from "@/components/admin/table-search";

export const dynamic = "force-dynamic";

export default async function OrderHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const params = await searchParams;
    const query = params.query || "";

    const whereClause: any = {
        status: { not: "PENDING" },
    };

    if (query) {
        whereClause.OR = [
            { id: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { customerEmail: { contains: query, mode: "insensitive" } }
        ];
    }

    const rawOrders = await prisma.order.findMany({
        where: whereClause,
        include: {
            purchaseOrders: true, // [NEW]
            vendorInvoices: true, // [NEW]
            items: {
                include: {
                    product: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const orders = rawOrders.map((order) => ({
        id: order.id,
        customerName: order.customerName || "Unknown",
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.updatedAt.toISOString(),

        invoiceUrl: order.invoiceUrl, // [NEW]
        customerPoUrl: order.customerPoUrl, // [NEW]
        purchaseOrders: order.purchaseOrders, // [NEW]
        vendorInvoices: order.vendorInvoices, // [NEW]

        items: order.items.map(item => ({
            ...item,
            productName: item.productName || item.product?.title || "Unknown Product"
        })),

        vendorId: order.items[0]?.vendorId || "",
        expectedDelivery: order.expectedDelivery,
        userId: order.customerId,
        // Fetch from the first item (assuming single vendor per order or first available)
        transportSlipUrl: order.items[0]?.transportSlipUrl,
        billUrl: order.items[0]?.billUrl,
    }));

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Order History</h1>
                    <span className="text-sm text-muted-foreground">
                        {orders.length} past orders
                    </span>
                </div>
                <TableSearch placeholder="Search ID, Customer, Email..." />
            </div>

            <OrderHistoryTable initialOrders={orders} />
        </div>
    );
}