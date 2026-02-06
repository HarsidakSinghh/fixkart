import { getComplaints } from "@/app/admin/actions";
import ComplaintsTable from "@/components/admin/complaints-table";

export default async function ComplaintsPage() {
    const res = await getComplaints();

    if (!res.success) {
        return (
            <div className="p-8 text-center text-red-500">
                Failed to load complaints. Please try again later.
            </div>
        );
    }

    const complaints = res.data || [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Complaints</h1>
                    <p className="text-muted-foreground">Manage and resolve reported issues.</p>
                </div>
            </div>

            <ComplaintsTable initialComplaints={complaints} />
        </div>
    );
}
