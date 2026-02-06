import { NextRequest, NextResponse } from "next/server";
import { generatePurchaseOrders } from "@/lib/services/purchase-order-generator";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
        }

        // Call the service
        const result = await generatePurchaseOrders(orderId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        // Return count of generated POs
        return NextResponse.json({ success: true, count: result.generatedCount });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
