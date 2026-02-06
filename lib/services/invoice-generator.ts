import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper to convert number to words (Simplified version)
function numberToWords(amount: number) {
    // In a real app, use a library like 'n2words'
    return `INR ${amount.toFixed(0)} Only`;
}

interface OrderWithDetails {
    id: string;
    createdAt: Date;
    totalAmount: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    items: {
        id: string;
        productName: string | null;
        quantity: number;
        price: number;
        product: {
            title: string | null;
        };
    }[];
}

export async function generateInvoice(orderId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        // 1. Fetch Order Data
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        // [NEW] Fetch Customer Profile Details
        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: order.customerId }
        });

        // 2. Initialize PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 14;

        // --- BORDER FRAME ---
        doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

        // --- HEADER SECTION (Company Details) ---
        let yPos = 25;
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("The Fixkart", margin + 5, yPos);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yPos += 6;
        doc.text("2210, A.E.T .O.C, NEAR JASPAL KANDA, JASPAL BANGAR ROAD, GIASPURA LUDHIANA", margin + 5, yPos);
        yPos += 5;
        doc.text("GSTIN: 03CJGPG6171BIZQ", margin + 5, yPos);
        yPos += 5;
        doc.text("State Name : Punjab, Code : 03", margin + 5, yPos);
        yPos += 5;
        doc.text("Phone: +91 86994 66669", margin + 5, yPos);

        // --- SPLIT SECTION: BUYER (Left) vs INVOICE META (Right) ---
        yPos += 5;
        doc.line(margin, yPos, pageWidth - margin, yPos);

        const sectionTop = yPos;
        const colCenter = pageWidth / 2;

        doc.line(colCenter, yPos, colCenter, yPos + 60);
        doc.line(margin, yPos + 60, pageWidth - margin, yPos + 60);

        // LEFT COLUMN: Consignee / Buyer (FROM PROFILE)
        let leftY = sectionTop + 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Consignee / Buyer (Bill to):", margin + 4, leftY);

        doc.setFont("helvetica", "normal");
        leftY += 5;
        // Prioitize Profile Data, fallback to Order Data
        const billName = customerProfile?.companyName || order.customerName || "Valued Customer";
        const billEmail = customerProfile?.email || order.customerEmail || "";
        const billPhone = customerProfile?.phone || order.customerPhone || "";
        const billAddress = customerProfile ? `${customerProfile.address}, ${customerProfile.city}` : "Address not available";
        const billState = customerProfile ? `${customerProfile.state} - ${customerProfile.postalCode}` : "Punjab, Code: 03";
        const billGst = customerProfile?.gstNumber || "Unregistered";

        doc.text(billName, margin + 4, leftY);
        leftY += 5;
        doc.text(billEmail, margin + 4, leftY);
        leftY += 5;
        doc.text(billPhone, margin + 4, leftY);
        leftY += 5;
        doc.text(billAddress, margin + 4, leftY);
        leftY += 5;
        doc.text(billState, margin + 4, leftY);
        leftY += 5;
        doc.text(`GSTIN: ${billGst}`, margin + 4, leftY);

        // RIGHT COLUMN: Invoice Details 
        let rightY = sectionTop + 8;
        const rightColX = colCenter + 4;

        const printMeta = (label: string, value: string) => {
            doc.setFont("helvetica", "bold");
            doc.text(label, rightColX, rightY);
            doc.setFont("helvetica", "normal");
            doc.text(`: ${value}`, rightColX + 35, rightY);
            rightY += 6;
        };

        printMeta("Invoice No", `FK-${order.id.slice(-6).toUpperCase()}`);
        printMeta("Dated", new Date().toLocaleDateString());
        printMeta("Delivery Note", "-");
        printMeta("Mode/Terms", "Online");
        printMeta("Buyer's Order", `#${order.id.slice(0, 8)}`);
        printMeta("Destination", customerProfile?.city || "Ludhiana");

        // --- MAIN ITEMS TABLE --- 
        // We use autoTable to replicate the columns: SI No, Desc, HSN, GST, Qty, Rate, Amount
        const tableStartY = sectionTop + 65;

        const tableColumn = ["SI No.", "Description of Goods", "HSN/SAC", "GST Rate", "Quantity", "Rate", "Per", "Amount"];
        const tableRows: any[] = [];

        order.items.forEach((item, index) => {
            const amount = item.price * item.quantity;
            const itemData = [
                index + 1,
                item.productName || item.product?.title || "Item",
                "8500", // Placeholder HSN
                "18%",  // Placeholder GST
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
            theme: 'grid', // Grid theme matches the boxy look of the sample
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 15 }, // SI No
                1: { cellWidth: 50 }, // Desc
                7: { halign: 'right' } // Amount align right
            },
            margin: { left: margin, right: margin }
        });

        // --- TOTALS SECTION ---
        // Calculate Y position after table
        const finalY = (doc as any).lastAutoTable.finalY;

        // Total Text
        doc.setFont("helvetica", "bold");
        doc.text(`Total: INR ${order.totalAmount.toFixed(2)}`, pageWidth - margin - 5, finalY + 10, { align: "right" });

        // Amount in words
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Amount Chargeable (in words):`, margin + 4, finalY + 10);
        doc.setFont("helvetica", "bold");
        doc.text(numberToWords(order.totalAmount), margin + 4, finalY + 15);

        // --- TAX TABLE (Bottom Left) --- 
        // A mini table for tax breakdown
        autoTable(doc, {
            head: [["HSN/SAC", "Taxable Value", "Rate", "Tax Amount", "Total Tax Amount"]],
            body: [
                ["8500", `INR ${(order.totalAmount * 0.82).toFixed(2)}`, "18%", `INR ${(order.totalAmount * 0.18).toFixed(2)}`, `INR ${(order.totalAmount * 0.18).toFixed(2)}`]
            ],
            startY: finalY + 25,
            theme: 'grid',
            styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            margin: { left: margin, right: pageWidth / 2 } // Keep it to the left side
        });

        const taxTableY = (doc as any).lastAutoTable.finalY;

        // --- FOOTER (Bank Details & Signatory) ---
        const footerY = taxTableY + 10;

        // Bank Details Box
        doc.rect(margin, footerY, pageWidth / 2 - margin, 35);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Company's Bank Details", margin + 2, footerY + 5);

        doc.setFont("helvetica", "normal");
        doc.text("Bank Name: HDFC BANK", margin + 2, footerY + 12);
        doc.text("A/c No: 50200012345678", margin + 2, footerY + 18);
        doc.text("IFS Code: HDFC0001234", margin + 2, footerY + 24);

        // Signatory Box
        doc.rect(pageWidth / 2, footerY, pageWidth / 2 - margin, 35);
        doc.text("for The Fixkart", pageWidth / 2 + 5, footerY + 5);

        doc.setFontSize(8);
        doc.text("Authorised Signatory", pageWidth - margin - 5, footerY + 30, { align: 'right' });

        // Declaration
        doc.setFontSize(7);
        doc.text("Declaration: We declare that this invoice shows the actual price of the goods described and all particulars are true and correct.", margin, footerY + 40);
        doc.setFontSize(6);
        doc.text("This is a computer generated invoice", margin, footerY + 45);

        // 3. Upload to Cloudinary
        const pdfOutput = doc.output("arraybuffer");
        const buffer = Buffer.from(pdfOutput);

        // Import the uploader dynamically or assume it's imported at top (we should add import if missing)
        // Since we are replacing a block, we can't easily add top-level imports here without another generic replace.
        // Assuming uploadToCloudinary is imported. If not, I will add it in a subsequent step or use require if needed, but import is better.
        // For now, I'll rely on adding the import statement in a separate replacement or use a dynamic import if allowed.
        // Let's assume I'll add the import at the top in a separate call or same call if possible. 
        // Actually, this tool allows replacing a block. I will replace the logic here and then check imports.

        // Import uploader
        const { uploadToCloudinary, getPrivateDownloadUrl } = await import("@/lib/cloudinary");

        const publicId = `invoice-${orderId}`; // No extension in ID for cleaner handling, we pass format separately

        const uploadResult = await uploadToCloudinary(buffer, {
            folder: "fixkart/invoices",
            resource_type: "raw",
            type: "authenticated",
            public_id: `${publicId}.pdf`
        });

        if (!uploadResult || !uploadResult.public_id) {
            throw new Error("Failed to upload invoice to Cloudinary");
        }

        // Generate Long-Lived Private Download URL
        // Cloudinary stores raw with extension if we provided it. 
        // public_id in result usually includes extension for raw if we added it.
        const cloudUrl = getPrivateDownloadUrl(uploadResult.public_id, "pdf", "raw");

        console.log(`✅ Invoice uploaded and signed: ${cloudUrl}`);

        // 4. Update Order
        await prisma.order.update({
            where: { id: orderId },
            data: { invoiceUrl: cloudUrl }
        });

        return { success: true, url: cloudUrl };

    } catch (error) {
        console.error("Invoice Generation Error:", error);
        return { success: false, error: "Failed to generate invoice" };
    }
}