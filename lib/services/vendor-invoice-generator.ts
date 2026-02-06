import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

// Helper to convert number to words
function numberToWords(amount: number) {
    return `INR ${amount.toFixed(0)} Only`;
}

export async function generateVendorInvoices(orderId: string): Promise<{ success: boolean; generatedCount?: number; error?: string }> {
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
            if (!item.vendorId) return; // Skip if no vendor linked
            if (!vendorGroups[item.vendorId]) {
                vendorGroups[item.vendorId] = [];
            }
            vendorGroups[item.vendorId].push(item);
        });

        const generatedInvoices = [];

        // 3. Loop through vendors and generate Invoices
        for (const [vendorId, items] of Object.entries(vendorGroups)) {
            const vendor = items[0].vendor; // All items in group share the same vendor
            if (!vendor) continue;

            // Calculate Totals for this Invoice
            const invoiceTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // --- GENERATE PDF ---
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 14;

            // --- BORDER FRAME (Matches Invoice Design) ---
            doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

            // --- HEADER SECTION (SENDER: VENDOR) ---
            let yPos = 25;
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");

            // Vendor Name (Sender)
            doc.text(vendor.companyName || vendor.fullName, margin + 5, yPos);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            yPos += 6;

            const vAddr = `${vendor.address}, ${vendor.city}`;
            const vState = `${vendor.state} - ${vendor.postalCode}`;

            doc.text(vAddr, margin + 5, yPos); yPos += 5;
            doc.text(vState, margin + 5, yPos); yPos += 5;
            if (vendor.gstNumber) {
                doc.text(`GSTIN: ${vendor.gstNumber}`, margin + 5, yPos); yPos += 5;
            }
            doc.text(`Phone: ${vendor.phone}`, margin + 5, yPos); yPos += 5;
            doc.text(`Email: ${vendor.email}`, margin + 5, yPos);

            // --- SPLIT SECTION ---
            yPos += 5;
            doc.line(margin, yPos, pageWidth - margin, yPos);

            const sectionTop = yPos;
            const colCenter = pageWidth / 2;

            doc.line(colCenter, yPos, colCenter, yPos + 60);
            doc.line(margin, yPos + 60, pageWidth - margin, yPos + 60);

            // LEFT COLUMN: RECEIVER (METAL CRAFT)
            let leftY = sectionTop + 8;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("To (Buyer):", margin + 4, leftY);

            doc.setFont("helvetica", "normal");
            leftY += 5;

            doc.text("METAL CRAFT", margin + 4, leftY);
            leftY += 5;
            doc.text("2210, A.E.T .O.C, NEAR JASPAL KANDA,", margin + 4, leftY);
            leftY += 5;
            doc.text("JASPAL BANGAR ROAD, GIASPURA LUDHIANA,", margin + 4, leftY);
            leftY += 5;
            doc.text("Punjab, Code: 03", margin + 4, leftY);
            leftY += 5;
            doc.text("GSTIN: 03CJGPG6171BIZQ", margin + 4, leftY);
            leftY += 5;
            doc.text("Email: info@fixkart.com", margin + 4, leftY);

            // RIGHT COLUMN: INVOICE META
            let rightY = sectionTop + 8;
            const rightColX = colCenter + 4;

            // Format: VI-OrderId-VendorIdSuffix
            const invoiceNumber = `VI-${order.id.slice(-6).toUpperCase()}-${vendor.id.slice(-4).toUpperCase()}`;

            const printMeta = (label: string, value: string) => {
                doc.setFont("helvetica", "bold");
                doc.text(label, rightColX, rightY);
                doc.setFont("helvetica", "normal");
                doc.text(`: ${value}`, rightColX + 35, rightY);
                rightY += 6;
            };

            printMeta("Invoice No", invoiceNumber);
            printMeta("Dated", new Date().toLocaleDateString());
            printMeta("Terms", "Online");
            printMeta("Ref Order", `#${order.id.slice(0, 8)}`);

            // --- ITEMS TABLE (Matches Invoice Design) ---
            const tableStartY = sectionTop + 65;
            const tableColumn = ["SI No.", "Description of Goods", "HSN/SAC", "GST Rate", "Quantity", "Rate", "Per", "Amount"];
            const tableRows: any[] = [];

            items.forEach((item, index) => {
                const amount = item.price * item.quantity;
                const itemData = [
                    index + 1,
                    item.productName || item.product?.title || "Item",
                    "8500", // HSN
                    "18%",  // GST
                    item.quantity,
                    `INR ${item.price.toFixed(2)}`,
                    "Nos",
                    `INR ${amount.toFixed(2)}`,
                ];
                tableRows.push(itemData);
            });

            // @ts-ignore
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: tableStartY,
                theme: 'grid', // MATCHING INVOICE THEME
                styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 50 }, 7: { halign: 'right' } },
                margin: { left: margin, right: margin }
            });

            // --- TOTALS ---
            // @ts-ignore
            const finalY = (doc as any).lastAutoTable.finalY;

            doc.setFont("helvetica", "bold");
            doc.text(`Total: INR ${invoiceTotal.toFixed(2)}`, pageWidth - margin - 5, finalY + 10, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Amount Chargeable (in words):`, margin + 4, finalY + 10);
            doc.setFont("helvetica", "bold");
            doc.text(numberToWords(invoiceTotal), margin + 4, finalY + 15);

            // --- TAX SUMMARY (Bottom Left) ---
            // @ts-ignore
            autoTable(doc, {
                head: [["HSN/SAC", "Taxable Value", "Rate", "Tax Amount", "Total Tax Amount"]],
                body: [
                    ["8500", `INR ${(invoiceTotal * 0.82).toFixed(2)}`, "18%", `INR ${(invoiceTotal * 0.18).toFixed(2)}`, `INR ${(invoiceTotal * 0.18).toFixed(2)}`]
                ],
                startY: finalY + 25,
                theme: 'grid',
                styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
                margin: { left: margin, right: pageWidth / 2 }
            });

            // --- FOOTER ---
            const footerY = (doc as any).lastAutoTable.finalY + 10;

            // Bank Details (Vendor's Bank)
            doc.rect(margin, footerY, pageWidth / 2 - margin, 35);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Bank Details", margin + 2, footerY + 5);

            doc.setFont("helvetica", "normal");
            doc.text(`Bank: ${vendor.bankName || 'N/A'}`, margin + 2, footerY + 12);
            doc.text(`A/c No: ${vendor.accountNumber || 'N/A'}`, margin + 2, footerY + 18);
            doc.text(`IFSC: ${vendor.ifscCode || 'N/A'}`, margin + 2, footerY + 24);

            // Signatory (Vendor)
            doc.rect(pageWidth / 2, footerY, pageWidth / 2 - margin, 35);
            doc.text(`for ${vendor.companyName || vendor.fullName}`, pageWidth / 2 + 5, footerY + 5);
            doc.setFontSize(8);
            doc.text("Authorised Signatory", pageWidth - margin - 5, footerY + 30, { align: 'right' });

            doc.setFontSize(6);
            doc.text("This is a computer generated invoice.", margin, footerY + 45);

            // --- UPLOAD TO CLOUDINARY ---
            const pdfOutput = doc.output("arraybuffer");
            const buffer = Buffer.from(pdfOutput);

            // Dynamically import upload helper
            const { uploadToCloudinary, getPrivateDownloadUrl } = await import("@/lib/cloudinary");

            const uploadResult = await uploadToCloudinary(buffer, {
                folder: "fixkart/vendor-invoices",
                resource_type: "raw",
                type: "authenticated",
                public_id: `vi-${order.id}-${vendor.id}.pdf`
            });

            if (!uploadResult || !uploadResult.public_id) {
                throw new Error(`Failed to upload Vendor Invoice for vendor ${vendor.id}`);
            }

            const cloudUrl = getPrivateDownloadUrl(uploadResult.public_id, "pdf", "raw");
            console.log(`✅ Vendor Invoice uploaded and signed: ${cloudUrl}`);

            // --- SAVE TO DB ---
            const existingInv = await prisma.vendorInvoice.findFirst({
                where: { orderId: order.id, vendorId: vendor.id } // Use vendor.id (user id)
            });

            if (existingInv) {
                await prisma.vendorInvoice.update({
                    where: { id: existingInv.id },
                    data: { url: cloudUrl, invoiceNumber }
                })
            } else {
                await prisma.vendorInvoice.create({
                    data: {
                        orderId: order.id,
                        vendorId: vendor.userId, // Link via userId
                        url: cloudUrl,
                        invoiceNumber
                    }
                });
            }

            generatedInvoices.push(cloudUrl);
        }

        return { success: true, generatedCount: generatedInvoices.length };

    } catch (error) {
        console.error("Vendor Invoice Generation Error:", error);
        return { success: false, error: "Failed to generate vendor invoices" };
    }
}
