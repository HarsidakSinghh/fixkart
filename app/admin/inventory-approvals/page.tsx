import { prisma } from "@/lib/prisma";
import ProductApprovalTable from "@/components/admin/product-approval-table";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function InventoryApprovalsPage() {
    noStore(); // Force dynamic rendering

    try {
        // 1. Fetch pending products
        const rawProducts = await prisma.product.findMany({
            where: {
                OR: [
                    { isPublished: false },
                    { status: "pending" },
                    { status: "PENDING" }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 2. Fetch Vendor Details
        const vendorIds = Array.from(new Set(rawProducts.map(p => p.vendorId).filter(Boolean)));

        // Fix: Ensure vendorIds is not empty before querying (though prisma handles empty 'in' gracefully usually)
        const vendors = await prisma.vendorProfile.findMany({
            where: {
                userId: { in: vendorIds as string[] }
            },
            select: {
                userId: true,
                fullName: true,
                companyName: true,
                email: true,
                phone: true
            }
        });

        const vendorMap = new Map(vendors.map(v => [v.userId, v]));

        // 3. Serialize data
        const products = rawProducts.map((p) => {
            const vendor = vendorMap.get(p.vendorId || ""); // Handle null vendorId

            return {
                id: p.id,
                name: p.title || p.name,
                category: p.category,
                subCategory: p.subCategory, // Added subCategory
                price: p.price,
                image: p.image,
                // 👇 ADDED: Pass the gallery array
                gallery: p.gallery || [],

                vendorId: p.vendorId || "N/A",
                createdAt: p.createdAt.toISOString(),
                description: p.description || "No description provided.",
                quantity: p.quantity || 0,

                vendorName: vendor?.companyName || vendor?.fullName || "Unknown Vendor",
                vendorEmail: vendor?.email || "N/A",
                vendorPhone: vendor?.phone || "N/A",
            };
        });

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Inventory Approvals</h1>
                    <span className="text-sm text-muted-foreground">
                        {products.length} pending items
                    </span>
                </div>

                <ProductApprovalTable initialProducts={products} />
            </div>
        );

    } catch (error) {
        console.error("Database Error:", error);
        return <div className="p-4 text-red-500">Error loading products.</div>;
    }
}