import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper to convert number to words
function numberToWords(amount: number) {
    return `INR ${amount.toFixed(0)} Only`;
}

export async function generatePurchaseOrders(orderId: string): Promise<{ success: boolean; generatedCount?: number; error?: string }> {
    try {
        // 1. Fetch Order Data with Items and Vendor Details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                        vendor: true // Fetch Vendor Profile for each item
                    }
                }
            }
        });

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        // 2. Group Items by Vendor
        const vendorGroups: { [vendorId: string]: typeof order.items } = {};

        order.items.forEach(item => {
            if (!item.vendorId) return; // Skip if no vendor linked (shouldn't happen)
            if (!vendorGroups[item.vendorId]) {
                vendorGroups[item.vendorId] = [];
            }
            vendorGroups[item.vendorId].push(item);
        });

        const generatedPOs = [];

        // 3. Loop through vendors and generate POs
        for (const [vendorId, items] of Object.entries(vendorGroups)) {
            const vendor = items[0].vendor; // All items in group share the same vendor
            if (!vendor) continue;

            // Calculate Totals for this PO
            const poTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // --- GENERATE PDF ---
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;

            // --- BORDER ---
            doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

            // --- HEADER (VENDOR - THE SELLER) ---
            let yPos = 25;
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            // Vendor Name
            doc.text(vendor.companyName || vendor.fullName, margin + 5, yPos);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            yPos += 6;
            // Vendor Address
            const vendorAddr = `${vendor.address}, ${vendor.city}`;
            const vendorState = `${vendor.state} - ${vendor.postalCode}`;
            doc.text(vendorAddr, margin + 5, yPos);
            yPos += 5;
            doc.text(vendorState, margin + 5, yPos);
            yPos += 5;
            doc.text(`GSTIN: ${vendor.gstNumber || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            doc.text(`Email: ${vendor.email}`, margin + 5, yPos);

            // --- SPLIT SECTION ---
            yPos += 5;
            doc.line(margin, yPos, pageWidth - margin, yPos);

            const sectionTop = yPos;
            const colCenter = pageWidth / 2;

            doc.line(colCenter, yPos, colCenter, yPos + 60);
            doc.line(margin, yPos + 60, pageWidth - margin, yPos + 60);

            // --- LEFT COLUMN: BUYER (FIXKART) ---
            let leftY = sectionTop + 8;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Consignee / Buyer (Bill to):", margin + 4, leftY);

            doc.setFont("helvetica", "normal");
            leftY += 5;
            doc.text("METAL CRAFT", margin + 4, leftY);
            leftY += 5;
            doc.text("2210, A.E.T .O.C, NEAR JASPAL KANDA", margin + 4, leftY);
            leftY += 5;
            doc.text("JASPAL BANGAR ROAD, GIASPURA LUDHIANA", margin + 4, leftY);
            leftY += 5;
            doc.text("State: Punjab, Code: 03", margin + 4, leftY);
            leftY += 5;
            doc.text("GSTIN: 03CJGPG6171BIZQ", margin + 4, leftY);

            // --- RIGHT COLUMN: PO Details ---
            let rightY = sectionTop + 8;
            const rightColX = colCenter + 4;
            const poNumber = `PO-${order.id.slice(-6).toUpperCase()}-${vendor.id.slice(-4).toUpperCase()}`;

            const printMeta = (label: string, value: string) => {
                doc.setFont("helvetica", "bold");
                doc.text(label, rightColX, rightY);
                doc.setFont("helvetica", "normal");
                doc.text(`: ${value}`, rightColX + 35, rightY);
                rightY += 6;
            };

            printMeta("PO No", poNumber);
            printMeta("Dated", new Date().toLocaleDateString());
            printMeta("Mode/Terms", "Online");
            printMeta("Reference Order", `#${order.id.slice(0, 8)}`);
            printMeta("Destination", "Ludhiana");

            // --- ITEMS TABLE ---
            const tableStartY = sectionTop + 65;
            const tableColumn = ["SI No.", "Description", "HSN/SAC", "GST", "Qty", "Rate", "Per", "Amount"];
            const tableRows: any[] = [];

            items.forEach((item, index) => {
                const amount = item.price * item.quantity;
                const itemData = [
                    index + 1,
                    item.productName || item.product?.title || "Item",
                    "8500",
                    "18%",
                    item.quantity,
                    `INR ${item.price.toFixed(2)}`,
                    "Nos",
                    `INR ${amount.toFixed(2)}`,
                ];
                tableRows.push(itemData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: tableStartY,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 50 }, 7: { halign: 'right' } },
                margin: { left: margin, right: margin }
            });

            // --- TOTALS ---
            const finalY = (doc as any).lastAutoTable.finalY;
            doc.setFont("helvetica", "bold");
            doc.text(`Total: INR ${poTotal.toFixed(2)}`, pageWidth - margin - 5, finalY + 10, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Amount (in words):`, margin + 4, finalY + 10);
            doc.setFont("helvetica", "bold");
            doc.text(numberToWords(poTotal), margin + 4, finalY + 15);

            // --- FOOTER ---
            const footerY = finalY + 30;
            doc.rect(pageWidth / 2, footerY, pageWidth / 2 - margin, 35);
            doc.text("for METAL CRAFT", pageWidth / 2 + 5, footerY + 5);
            doc.setFontSize(8);
            doc.text("Authorised Signatory", pageWidth - margin - 5, footerY + 30, { align: 'right' });

            doc.setFontSize(6);
            doc.text("This is a computer generated purchase order", margin, footerY + 45);

            // --- UPLOAD TO CLOUDINARY ---
            const pdfOutput = doc.output("arraybuffer");
            const buffer = Buffer.from(pdfOutput);

            // Dynamically import upload helper
            const { uploadToCloudinary, getPrivateDownloadUrl } = await import("@/lib/cloudinary");

            const uploadResult = await uploadToCloudinary(buffer, {
                folder: "fixkart/purchase-orders",
                resource_type: "raw",
                type: "authenticated",
                public_id: `po-${order.id}-${vendor.id}.pdf`
            });

            if (!uploadResult || !uploadResult.public_id) {
                throw new Error(`Failed to upload PO for vendor ${vendor.id}`);
            }

            const cloudUrl = getPrivateDownloadUrl(uploadResult.public_id, "pdf", "raw");
            console.log(`✅ Vendor PO uploaded and signed: ${cloudUrl}`);


            // --- SAVE TO DB ---
            // Check if PO already exists to avoid duplicates (optional, or upsert)
            const existingPO = await prisma.purchaseOrder.findFirst({
                where: { orderId: order.id, vendorId: vendor.id } // Use vendor.id (user id of vendor)
            });

            if (existingPO) {
                await prisma.purchaseOrder.update({
                    where: { id: existingPO.id },
                    data: { url: cloudUrl, poNumber }
                })
            } else {
                await prisma.purchaseOrder.create({
                    data: {
                        orderId: order.id,
                        vendorId: vendor.userId, // Link to VendorProfile via userId
                        url: cloudUrl,
                        poNumber
                    }
                });
            }

            generatedPOs.push(cloudUrl);
        }

        return { success: true, generatedCount: generatedPOs.length };

    } catch (error) {
        console.error("PO Generation Error:", error);
        return { success: false, error: "Failed to generate purchase orders" };
    }
}
