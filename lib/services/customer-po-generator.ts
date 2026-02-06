import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

// Helper to convert number to words
function numberToWords(amount: number) {
    return `INR ${amount.toFixed(0)} Only`;
}

export async function generateCustomerPO(orderId: string): Promise<{ success: boolean; url?: string; error?: string }> {
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

        // Fetch Customer Profile
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

        // --- HEADER SECTION (SENDER: CUSTOMER) ---
        let yPos = 25;
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");

        const customerName = customerProfile?.companyName || order.customerName || "Customer Name";
        const customerAddress = customerProfile?.address ? `${customerProfile.address}, ${customerProfile.city}` : "Address N/A";
        const customerState = customerProfile?.state ? `${customerProfile.state} - ${customerProfile.postalCode}` : "";
        const customerPhone = customerProfile?.phone || order.customerPhone || "";
        const customerEmail = customerProfile?.email || order.customerEmail || "";

        doc.text(customerName, margin + 5, yPos);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yPos += 6;
        doc.text(customerAddress, margin + 5, yPos);
        yPos += 5;
        if (customerState) {
            doc.text(customerState, margin + 5, yPos);
            yPos += 5;
        }
        doc.text(`Phone: ${customerPhone}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Email: ${customerEmail}`, margin + 5, yPos);

        if (customerProfile?.gstNumber) {
            yPos += 5;
            doc.text(`GSTIN: ${customerProfile.gstNumber}`, margin + 5, yPos);
        }

        // --- SPLIT SECTION ---
        yPos += 5;
        doc.line(margin, yPos, pageWidth - margin, yPos);

        const sectionTop = yPos;
        const colCenter = pageWidth / 2;

        doc.line(colCenter, yPos, colCenter, yPos + 60);
        doc.line(margin, yPos + 60, pageWidth - margin, yPos + 60);

        // LEFT COLUMN: RECEIVER (FIXKART)
        let leftY = sectionTop + 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("To (Seller):", margin + 4, leftY);

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


        // RIGHT COLUMN: PO DETAILS
        let rightY = sectionTop + 8;
        const rightColX = colCenter + 4;

        const printMeta = (label: string, value: string) => {
            doc.setFont("helvetica", "bold");
            doc.text(label, rightColX, rightY);
            doc.setFont("helvetica", "normal");
            doc.text(`: ${value}`, rightColX + 35, rightY);
            rightY += 6;
        };

        const poNumber = `CPO-${order.id.slice(-6).toUpperCase()}`;

        printMeta("PO No", poNumber);
        printMeta("Dated", new Date().toLocaleDateString());
        printMeta("Reference Order", `#${order.id.slice(0, 8)}`);
        printMeta("Status", "Confirmed");
        printMeta("Destination", "Ludhiana (Fixkart)");

        // --- MAIN ITEMS TABLE --- 
        const tableStartY = sectionTop + 65;
        // Same columns as Invoice for consistency
        const tableColumn = ["SI No.", "Description of Goods", "HSN/SAC", "GST Rate", "Quantity", "Rate", "Per", "Amount"];
        const tableRows: any[] = [];

        order.items.forEach((item, index) => {
            const amount = item.price * item.quantity;
            const itemData = [
                index + 1,
                item.productName || item.product?.title || "Item",
                "8500", // HSN
                "18%", // GST
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
                0: { cellWidth: 15 },
                1: { cellWidth: 50 },
                7: { halign: 'right' }
            },
            margin: { left: margin, right: margin }
        });

        // --- TOTALS SECTION ---
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY;

        doc.setFont("helvetica", "bold");
        doc.text(`Total: INR ${order.totalAmount.toFixed(2)}`, pageWidth - margin - 5, finalY + 10, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Amount (in words):`, margin + 4, finalY + 10);
        doc.setFont("helvetica", "bold");
        doc.text(numberToWords(order.totalAmount), margin + 4, finalY + 15);

        // --- FOOTER ---
        const footerY = finalY + 30;

        // Signatory Box for Customer
        doc.rect(pageWidth / 2, footerY, pageWidth / 2 - margin, 35);
        doc.text(`for ${customerName}`, pageWidth / 2 + 5, footerY + 5);
        doc.setFontSize(8);
        doc.text("Authorised Signatory", pageWidth - margin - 5, footerY + 30, { align: 'right' });

        doc.setFontSize(6);
        doc.text("This is a computer generated purchase order.", margin, footerY + 45);

        // --- UPLOAD TO CLOUDINARY ---
        const pdfOutput = doc.output("arraybuffer");
        const buffer = Buffer.from(pdfOutput);

        const { uploadToCloudinary, getPrivateDownloadUrl } = await import("@/lib/cloudinary");

        const uploadResult = await uploadToCloudinary(buffer, {
            folder: "fixkart/customer-pos",
            resource_type: "raw",
            type: "authenticated",
            public_id: `cpo-${orderId}.pdf`
        });

        if (!uploadResult || !uploadResult.public_id) {
            throw new Error("Failed to upload Customer PO to Cloudinary");
        }

        const cloudUrl = getPrivateDownloadUrl(uploadResult.public_id, "pdf", "raw");
        console.log(`✅ Customer PO uploaded and signed: ${cloudUrl}`);

        // -- UPDATE ORDER --
        // Use try/catch for the update to avoid crashing if prisma sync is lagging, though it shouldn't be now
        await prisma.order.update({
            where: { id: orderId },
            data: { customerPoUrl: cloudUrl }
        });

        return { success: true, url: cloudUrl };

    } catch (error) {
        console.error("Customer PO Generation Error:", error);
        return { success: false, error: "Failed to generate customer PO" };
    }
}
