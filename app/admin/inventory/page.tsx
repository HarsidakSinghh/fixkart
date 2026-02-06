import { prisma } from "@/lib/prisma";
import AllInventoryTable from "@/components/admin/all-inventory-table";
import { InventoryFilters } from "@/components/admin/inventory-filters";
import TableSearch from "@/components/admin/table-search";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        status?: string;
        subcategory?: string;
        vendor?: string;
    }>;
}) {
    noStore();
    const params = await searchParams;
    const query = params.query || "";
    const statusFilter = params.status;
    const subCategoryFilter = params.subcategory;
    const vendorFilter = params.vendor;

    // 1. Fetch Vendors for the Filter Dropdown
    const vendorsRaw = await prisma.vendorProfile.findMany({
        select: {
            userId: true,
            companyName: true,
            fullName: true,
        },
        orderBy: { companyName: 'asc' }
    });

    const vendorOptions = vendorsRaw.map(v => ({
        id: v.userId,
        name: v.companyName || v.fullName
    }));

    // 1.1 Fetch Unique Subcategories
    const subCatsRaw = await prisma.product.findMany({
        where: { isPublished: true, subCategory: { not: null } },
        select: { subCategory: true },
        distinct: ['subCategory']
    });

    const subCategoryOptions = subCatsRaw
        .map(p => p.subCategory)
        .filter((c): c is string => !!c)
        .sort();

    // 2. Build Dynamic Filter
    const whereClause: any = {};

    if (vendorFilter && vendorFilter !== "all") {
        whereClause.vendorId = vendorFilter;
    }

    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
        ];
    }

    if (subCategoryFilter && subCategoryFilter !== "all") {
        const subFilterCondition = {
            contains: subCategoryFilter,
            mode: "insensitive"
        };
        if (whereClause.OR) {
            whereClause.AND = [{ OR: [{ subCategory: subFilterCondition }, { subSubCategory: subFilterCondition }] }];
        } else {
            whereClause.OR = [{ subCategory: subFilterCondition }, { subSubCategory: subFilterCondition }];
        }
    }

    // Enforce Live Status: Approved AND Published
    whereClause.isPublished = true;
    whereClause.status = "APPROVED";

    // Remove old status filter logic as visual filter is removed
    // if (statusFilter === "live") { ... }

    // 3. Fetch Products
    const [rawProducts, totalCount] = await Promise.all([
        prisma.product.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
        prisma.product.count({ where: whereClause })
    ]);

    // 4. Fetch Detailed Vendor Info for these products
    const productVendorIds = Array.from(new Set(rawProducts.map(p => p.vendorId).filter(Boolean))) as string[];

    const productVendors = await prisma.vendorProfile.findMany({
        where: { userId: { in: productVendorIds } },
        // 👇 Fetch Email and Phone now
        select: { userId: true, companyName: true, fullName: true, email: true, phone: true }
    });

    // Map: userId -> Vendor Object
    const vendorMap = new Map(productVendors.map(v => [v.userId, v]));

    // 5. Clean Data for Table
    const inventory = rawProducts.map((p) => {
        const vendor = vendorMap.get(p.vendorId || "");
        return {
            id: p.id,
            name: p.title || p.name,
            sku: p.sku,
            price: p.price,
            stock: p.quantity,
            category: p.category,
            subCategory: p.subCategory,

            // Vendor Details
            vendorId: p.vendorId || "Unknown",
            vendorName: vendor?.companyName || vendor?.fullName || "Unknown Vendor",
            vendorEmail: vendor?.email || "N/A",
            vendorPhone: vendor?.phone || "N/A",

            // Product Details
            description: p.description || "No description provided.",
            createdAt: p.createdAt.toISOString(),
            status: p.status,
            isPublished: p.isPublished,
            image: p.image,
            gallery: p.gallery || [],
        };
    });

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Global Inventory</h1>
                    <p className="text-sm text-muted-foreground">
                        View and manage {totalCount} products across all vendors.
                    </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="bg-muted px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap">
                        Total: {totalCount}
                    </div>
                    <TableSearch placeholder="Search name or SKU..." />
                    <InventoryFilters vendors={vendorOptions} subCategories={subCategoryOptions} />
                </div>
            </div>

            <AllInventoryTable data={inventory} />
        </div>
    );
}