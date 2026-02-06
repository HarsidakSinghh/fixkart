import { prisma } from "@/lib/prisma";
import VendorsTable from "@/components/admin/vendors-table";
export const dynamic = "force-dynamic";
// This MUST be the default export
export default async function OnboardedVendorsPage() {

    // 1. Fetch data directly from DB
    const rawVendors = await prisma.vendorProfile.findMany({
        where: {
            status: {
                in: ["APPROVED", "SUSPENDED"]
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // 2. Convert Date objects to strings (Required for Client Components)
    const vendors = rawVendors.map((vendor) => ({
        ...vendor,
        createdAt: vendor.createdAt.toISOString(),
        updatedAt: vendor.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Onboarded Vendors</h1>

            {/* 3. Pass sanitized data to the Client Component */}
            <VendorsTable initialVendors={vendors} />
        </div>
    );
}