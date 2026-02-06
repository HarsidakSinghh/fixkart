import { prisma } from "@/lib/prisma";
import OrdersTable from "@/components/admin/orders-table";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {

    // 1. Fetch PENDING orders from Database
    const rawOrders = await prisma.order.findMany({
        where: {
            status: "PENDING"
        },
        include: {
            purchaseOrders: true,
            vendorInvoices: true, // [NEW] 
            items: {
                include: {
                    product: true
                }
            } // We include items to display them in details
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 2. Clean data for the client
    const orders = rawOrders.map((order) => ({
        id: order.id,
        customerName: order.customerName || "Unknown",
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        vendorId: order.items[0]?.vendorId || "",
        userId: order.customerId,
        createdAt: order.createdAt.toISOString(),
        invoiceUrl: order.invoiceUrl,
        customerPoUrl: order.customerPoUrl, // [NEW] Customer PO URL

        purchaseOrders: order.purchaseOrders,
        vendorInvoices: order.vendorInvoices, // [NEW]
        items: order.items.map(item => ({
            ...item,
            productName: item.productName || item.product?.title || "Unknown Product"
        })),
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Pending Orders</h1>
                <span className="text-sm text-muted-foreground">
                    {orders.length} requiring attention
                </span>
            </div>

            <OrdersTable initialOrders={orders} />
        </div>
    );
}
