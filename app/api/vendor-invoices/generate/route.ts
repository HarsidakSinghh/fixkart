import { NextRequest, NextResponse } from "next/server";
import { generateVendorInvoices } from "@/lib/services/vendor-invoice-generator";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
        }

        const result = await generateVendorInvoices(orderId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: result.generatedCount });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
