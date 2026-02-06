import { prisma } from "@/lib/prisma";
import PendingCustomersTable from "@/components/admin/pending-customers-table";

export const dynamic = "force-dynamic";

export default async function CustomerApprovalsPage() {

    // 1. Fetch PENDING customers from Database
    const rawCustomers = await prisma.customerProfile.findMany({
        where: {
            status: "PENDING"
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 2. Clean data
    const customers = rawCustomers.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        status: c.status,
    }));

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Pending Customer Approvals</h1>

            <PendingCustomersTable initialCustomers={customers} />
        </div>
    );
}
