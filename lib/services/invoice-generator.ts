import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

function numberToWords(amount: number) {
  return `INR ${amount.toFixed(0)} Only`;
}

const FIXKART_INFO = {
  name: "Fixkart",
  addressLines: [
    "E-BXXX1-210, INDL AREA-C",
    "JASPAL BANGAR ROAD, SUA ROAD",
    "DHANDARI KALAN",
    "LUDHIANA, PUNJAB (India) - 141010",
  ],
  gst: "03ADGPK7577B2ZO",
  state: "Punjab",
  stateCode: "03",
  phone: "+91 86994 66669",
  email: "info@fixkart.com",
};

function loadLogoBase64() {
  try {
    const logoPath = path.resolve(process.cwd(), "mobileapp/assets/logo1.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (_) {
    return null;
  }
}

export async function generateInvoice(orderId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: order.customerId },
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    doc.setDrawColor(40);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    const logo = loadLogoBase64();
    if (logo) {
      doc.addImage(logo, "PNG", margin + 5, 18, 40, 14);
    }

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Tax Invoice", margin + (logo ? 48 : 5), 28);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: FK-${order.id.slice(-6).toUpperCase()}`, pageWidth - margin - 5, 24, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 5, 30, { align: "right" });

    let yPos = 36;
    doc.line(margin, yPos, pageWidth - margin, yPos);

    const sectionTop = yPos;
    const colCenter = pageWidth / 2;
    doc.line(colCenter, yPos, colCenter, yPos + 62);
    doc.line(margin, yPos + 62, pageWidth - margin, yPos + 62);

    // Seller: Fixkart
    let leftY = sectionTop + 8;
    doc.setFont("helvetica", "bold");
    doc.text("Seller (Fixkart)", margin + 4, leftY);
    doc.setFont("helvetica", "normal");
    leftY += 5;
    doc.text(FIXKART_INFO.name, margin + 4, leftY);
    leftY += 5;
    FIXKART_INFO.addressLines.forEach((line) => {
      doc.text(line, margin + 4, leftY);
      leftY += 5;
    });
    doc.text(`GSTIN/UIN: ${FIXKART_INFO.gst}`, margin + 4, leftY);
    leftY += 5;
    doc.text(`State Name: ${FIXKART_INFO.state}, Code: ${FIXKART_INFO.stateCode}`, margin + 4, leftY);
    leftY += 5;
    doc.text(`Phone: ${FIXKART_INFO.phone}`, margin + 4, leftY);
    leftY += 5;
    doc.text(`Email: ${FIXKART_INFO.email}`, margin + 4, leftY);

    // Buyer: Customer
    let rightY = sectionTop + 8;
    const rightColX = colCenter + 4;
    doc.setFont("helvetica", "bold");
    doc.text("Buyer (Customer)", rightColX, rightY);
    doc.setFont("helvetica", "normal");
    rightY += 5;

    const billName = customerProfile?.companyName || order.customerName || "Customer";
    const billEmail = customerProfile?.email || order.customerEmail || "";
    const billPhone = customerProfile?.phone || order.customerPhone || "";
    const billAddress = customerProfile
      ? [customerProfile.address, customerProfile.city, customerProfile.state, customerProfile.postalCode]
          .filter(Boolean)
          .join(", ")
      : order.billingAddress || "";
    const billGst = customerProfile?.gstNumber || "Unregistered";

    doc.text(billName, rightColX, rightY);
    rightY += 5;
    if (billEmail) {
      doc.text(billEmail, rightColX, rightY);
      rightY += 5;
    }
    if (billPhone) {
      doc.text(billPhone, rightColX, rightY);
      rightY += 5;
    }
    if (billAddress) {
      doc.text(billAddress, rightColX, rightY, { maxWidth: pageWidth - rightColX - margin });
      rightY += 10;
    }
    doc.text(`GSTIN: ${billGst}`, rightColX, rightY);

    const tableStartY = sectionTop + 66;
    const tableColumn = ["SI No.", "Description of Goods", "HSN/SAC", "GST Rate", "Qty", "Rate", "Per", "Amount"];
    const tableRows: any[] = [];

    order.items.forEach((item, index) => {
      const amount = item.price * item.quantity;
      tableRows.push([
        index + 1,
        item.productName || item.product?.title || "Item",
        "8500",
        "18%",
        item.quantity,
        `INR ${item.price.toFixed(2)}`,
        "Nos",
        `INR ${amount.toFixed(2)}`,
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 55 }, 7: { halign: "right" } },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: INR ${order.totalAmount.toFixed(2)}`, pageWidth - margin - 5, finalY + 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Amount Chargeable (in words):", margin + 4, finalY + 10);
    doc.setFont("helvetica", "bold");
    doc.text(numberToWords(order.totalAmount), margin + 4, finalY + 15);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer generated invoice.", margin, finalY + 28);

    const pdfOutput = doc.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    const { uploadToCloudinary, getPrivateDownloadUrl } = await import("@/lib/cloudinary");

    const publicId = `invoice-${orderId}`;
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "fixkart/invoices",
      resource_type: "raw",
      type: "authenticated",
      public_id: `${publicId}.pdf`,
    });

    if (!uploadResult || !uploadResult.public_id) {
      throw new Error("Failed to upload invoice to Cloudinary");
    }

    const cloudUrl = getPrivateDownloadUrl(uploadResult.public_id, "pdf", "raw");

    await prisma.order.update({
      where: { id: orderId },
      data: { invoiceUrl: cloudUrl },
    });

    return { success: true, url: cloudUrl };
  } catch (error) {
    console.error("Invoice Generation Error:", error);
    return { success: false, error: "Failed to generate invoice" };
  }
}
