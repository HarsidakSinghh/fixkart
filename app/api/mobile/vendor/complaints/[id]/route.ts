import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

function deriveOrderStatus(itemStatuses: string[]) {
  if (itemStatuses.every((status) => status === "REJECTED")) return "REJECTED";
  if (itemStatuses.some((status) => status === "DELIVERED")) return "DELIVERED";
  if (itemStatuses.some((status) => status === "SHIPPED" || status === "READY")) return "SHIPPED";
  if (itemStatuses.some((status) => status === "PROCESSING" || status === "APPROVED")) return "PROCESSING";
  if (itemStatuses.some((status) => status === "COMPLAINT" || status === "COMPLAINT_REVIEW")) return "PROCESSING";
  return "PENDING";
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const complaintId = resolved.id;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").toUpperCase();
  const feedback = String(body?.feedback || "").trim();

  if (!["IN_REVIEW", "RESOLVED", "REJECT_ORDER"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });
  if (!complaint || complaint.vendorId !== guard.userId) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const nextComplaintStatus =
    action === "IN_REVIEW" ? "IN_REVIEW" : action === "RESOLVED" ? "RESOLVED" : "ORDER_REJECTED";
  const nextOrderItemStatus =
    action === "IN_REVIEW" ? "COMPLAINT_REVIEW" : action === "RESOLVED" ? "COMPLAINT_RESOLVED" : "REJECTED";

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: nextComplaintStatus,
      vendorResponse: feedback || complaint.vendorResponse || null,
      actionTaken: action,
    },
  });

  if (complaint.orderItemId) {
    await prisma.orderItem.update({
      where: { id: complaint.orderItemId },
      data: { status: nextOrderItemStatus },
    });
  }

  const allItems = await prisma.orderItem.findMany({
    where: { orderId: complaint.orderId },
    select: { status: true },
  });
  if (allItems.length) {
    const nextOrderStatus = deriveOrderStatus(allItems.map((item) => String(item.status || "").toUpperCase()));
    await prisma.order.update({
      where: { id: complaint.orderId },
      data: { status: nextOrderStatus },
    });
  }

  return NextResponse.json({
    success: true,
    complaint: updatedComplaint,
  });
}

