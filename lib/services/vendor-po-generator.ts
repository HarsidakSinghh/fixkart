import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";

function numberToWords(amount: number) {
  return `INR ${amount.toFixed(0)} Only`;
}

export async function generateVendorPO(orderId: string, vendorId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true, vendor: true } },
      },
    });

    if (!order) return { success: false, error: "Order not found" };

    const items = order.items.filter((item) => item.vendorId === vendorId);
    if (!items.length) {
      return { success: false, error: "No items for vendor" };
    }

    const vendor = items[0].vendor;
    if (!vendor) return { success: false, error: "Vendor not found" };

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: order.customerId },
    });

    const customerName = order.customerName || customerProfile?.fullName || "Customer";
    const customerEmail = order.customerEmail || customerProfile?.email || "";
    const customerPhone = order.customerPhone || customerProfile?.phone || "";
    const customerAddress = customerProfile
      ? [customerProfile.address, customerProfile.city, customerProfile.state, customerProfile.postalCode]
          .filter(Boolean)
          .join(", ")
      : order.billingAddress || "";

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Purchase Order", margin + 5, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Order: #${order.id.slice(0, 8)}`, pageWidth - margin - 5, 25, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 5, 31, { align: "right" });

    let yPos = 38;
    doc.line(margin, yPos, pageWidth - margin, yPos);

    const sectionTop = yPos;
    const colCenter = pageWidth / 2;
    doc.line(colCenter, yPos, colCenter, yPos + 58);
    doc.line(margin, yPos + 58, pageWidth - margin, yPos + 58);

    // Vendor (Supplier)
    let leftY = sectionTop + 8;
    doc.setFont("helvetica", "bold");
    doc.text("Vendor (Supplier):", margin + 4, leftY);
    doc.setFont("helvetica", "normal");
    leftY += 5;
    doc.text(vendor.companyName || vendor.fullName, margin + 4, leftY);
    leftY += 5;
    doc.text([vendor.address, vendor.city].filter(Boolean).join(", "), margin + 4, leftY);
    leftY += 5;
    doc.text([vendor.state, vendor.postalCode].filter(Boolean).join(" - "), margin + 4, leftY);
    leftY += 5;
    if (vendor.gstNumber) {
      doc.text(`GSTIN: ${vendor.gstNumber}`, margin + 4, leftY);
      leftY += 5;
    }
    doc.text(`Phone: ${vendor.phone || "N/A"}`, margin + 4, leftY);
    leftY += 5;
    doc.text(`Email: ${vendor.email || "N/A"}`, margin + 4, leftY);

    // Customer (Buyer)
    let rightY = sectionTop + 8;
    const rightColX = colCenter + 4;
    doc.setFont("helvetica", "bold");
    doc.text("Customer (Buyer):", rightColX, rightY);
    doc.setFont("helvetica", "normal");
    rightY += 5;
    doc.text(customerName, rightColX, rightY);
    rightY += 5;
    if (customerEmail) {
      doc.text(customerEmail, rightColX, rightY);
      rightY += 5;
    }
    if (customerPhone) {
      doc.text(customerPhone, rightColX, rightY);
      rightY += 5;
    }
    if (customerAddress) {
      doc.text(customerAddress, rightColX, rightY, { maxWidth: pageWidth - rightColX - margin });
    }

    const tableStartY = sectionTop + 63;
    const tableColumn = ["SI No.", "Description", "Qty", "Rate", "Amount"];
    const tableRows: any[] = [];

    const total = items.reduce((sum, item) => {
      const commissionPercent = Number(item.product?.specs?.commissionPercent || 0);
      const basePrice =
        typeof item.product?.price === "number"
          ? item.product.price
          : commissionPercent > 0
          ? item.price / (1 + commissionPercent / 100)
          : item.price;
      const amount = basePrice * item.quantity;
      tableRows.push([
        tableRows.length + 1,
        item.productName || item.product?.title || "Item",
        item.quantity,
        `INR ${basePrice.toFixed(2)}`,
        `INR ${amount.toFixed(2)}`,
      ]);
      return sum + amount;
    }, 0);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 70 }, 4: { halign: "right" } },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: INR ${total.toFixed(2)}`, pageWidth - margin - 5, finalY + 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Amount (in words):", margin + 4, finalY + 10);
    doc.setFont("helvetica", "bold");
    doc.text(numberToWords(total), margin + 4, finalY + 15);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer generated purchase order.", margin, finalY + 30);

    const pdfOutput = doc.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    const { uploadToCloudinary, getPrivateDownloadUrl } = await import("@/lib/cloudinary");
    const publicId = `po-${order.id}-${vendor.userId}.pdf`;
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "fixkart/purchase-orders",
      resource_type: "raw",
      type: "authenticated",
      public_id: publicId,
    });

    if (!uploadResult || !uploadResult.public_id) {
      throw new Error("Failed to upload PO");
    }

    const cloudUrl = getPrivateDownloadUrl(uploadResult.public_id, "pdf", "raw");

    const existing = await prisma.purchaseOrder.findFirst({
      where: { orderId: order.id, vendorId: vendor.userId },
    });

    if (existing) {
      await prisma.purchaseOrder.update({
        where: { id: existing.id },
        data: { url: cloudUrl, poNumber: `PO-${order.id.slice(-6).toUpperCase()}-${vendor.id.slice(-4).toUpperCase()}` },
      });
    } else {
      await prisma.purchaseOrder.create({
        data: {
          orderId: order.id,
          vendorId: vendor.userId,
          url: cloudUrl,
          poNumber: `PO-${order.id.slice(-6).toUpperCase()}-${vendor.id.slice(-4).toUpperCase()}`,
        },
      });
    }

    return { success: true, url: cloudUrl };
  } catch (error) {
    console.error("Vendor PO Generation Error:", error);
    return { success: false, error: "Failed to generate purchase order" };
  }
}
