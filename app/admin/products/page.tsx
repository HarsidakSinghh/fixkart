import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const mockProducts = [
    {
        id: "P-1001",
        name: "Industrial Valve",
        vendor: "ABC Tools",
        price: 1800,
        category: "Hardware",
    },
    {
        id: "P-1002",
        name: "Power Drill",
        vendor: "Industrial Hub",
        price: 4500,
        category: "Power Tools",
    },
];
export const dynamic = "force-dynamic";
export default function ProductsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Products</h1>

            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {mockProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">
                                    {product.name}
                                </TableCell>
                                <TableCell>{product.vendor}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>₹{product.price}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="destructive">
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
