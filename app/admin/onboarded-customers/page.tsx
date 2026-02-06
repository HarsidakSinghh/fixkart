import { prisma } from "@/lib/prisma";
import OnboardedCustomersTable from "@/components/admin/onboarded-customers-table";

export const dynamic = "force-dynamic";

export default async function OnboardedCustomersPage() {

    const rawCustomers = await prisma.customerProfile.findMany({
        where: {
            status: {
                in: ["APPROVED", "SUSPENDED"]
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    const customers = rawCustomers.map((customer) => ({
        id: customer.id,
        fullName: customer.fullName,
        companyName: customer.companyName,
        email: customer.email,
        status: customer.status,
    }));

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Onboarded Customers</h1>
            <OnboardedCustomersTable initialCustomers={customers} />
        </div>
    );
}
