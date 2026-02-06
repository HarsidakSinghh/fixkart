import { NextRequest, NextResponse } from "next/server";
import { generateInvoice } from "@/lib/services/invoice-generator";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
        }

        // Call the service
        const result = await generateInvoice(orderId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: result.url });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
