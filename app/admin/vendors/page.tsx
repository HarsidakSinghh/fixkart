import { prisma } from "@/lib/prisma";
import PendingVendorsTable from "@/components/admin/pending-vendors-table";
export const dynamic = "force-dynamic";
// This is a Server Component (fetches data on the server)
export default async function VendorsPage() {

    // 1. Fetch PENDING vendors from Database
    const rawVendors = await prisma.vendorProfile.findMany({
        where: {
            status: "PENDING"
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 2. Clean data (Convert Dates to Strings to avoid errors)
    const vendors = rawVendors.map((v) => ({
        id: v.id,
        fullName: v.fullName, // Make sure this matches your schema (might be 'name' or 'fullName')
        email: v.email,
        status: v.status,
    }));

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Pending Vendors</h1>

            {/* 3. Pass Data to the Interactive Component */}
            <PendingVendorsTable initialVendors={vendors} />
        </div>
    );
}