import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Total Orders</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                    --
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                    --
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Total Vendors</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                    --
                </CardContent>
            </Card>
        </div>
    );
}
