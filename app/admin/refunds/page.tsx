import { prisma } from "@/lib/prisma";
import RefundsTable from "@/components/admin/refunds-table";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {

    // Fetch refunds with relations
    const rawRefunds = await prisma.refundRequest.findMany({
        include: {
            item: {
                include: {
                    product: true,
                    order: true,
                    vendor: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Helper to safely extract string from Json (String or Array)
    const extractUrl = (val: any): string | null => {
        if (!val) return null;
        if (typeof val === 'string') return val;
        if (Array.isArray(val) && val.length > 0) return val[0];
        return null;
    };

    // Transform data for the UI
    const refunds = rawRefunds.map(r => ({
        id: r.id,
        orderItemId: r.orderItemId,
        productName: r.item?.productName || r.item?.product?.title || "Unknown Product",
        productImage: r.item?.image || r.item?.product?.image,
        customerName: r.item?.order?.customerName || "Unknown Customer",
        customerId: r.customerId,
        vendorName: r.item?.vendor?.companyName || r.item?.vendor?.fullName || "Unknown Vendor",
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        amount: (r.item?.price || 0) * (r.item?.quantity || 1),
        price: r.item?.price || 0,
        quantity: r.item?.quantity || 0,
        orderId: r.item?.orderId,
        billUrl: extractUrl(r.item?.billUrl),
        transportSlipUrl: extractUrl(r.item?.transportSlipUrl)
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Returns & Refunds</h1>
                <span className="text-sm text-muted-foreground">
                    {refunds.length} requests
                </span>
            </div>

            <RefundsTable initialRefunds={refunds} />
        </div>
    );
}
