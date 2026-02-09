import nodemailer from "nodemailer";

// 1. Initialize Email Transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ADMIN EMAIL (Where new vendor alerts go)
const ADMIN_EMAIL = "info@thefixkart.com"; 

// Define Notification Types
type NotificationType = 
  | "ORDER_PLACED" 
  | "ORDER_SHIPPED" 
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "RETURN_REQUESTED" 
  | "RETURN_APPROVED" 
  | "RETURN_REJECTED"
  | "VENDOR_REGISTERED" 
  | "VENDOR_APPROVED"
  | "VENDOR_REJECTED";

interface NotificationData {
  toEmail?: string | null;
  toPhone?: string | null; 
  name: string;
  orderId?: string;
  extraMessage?: string; // We use this to detect if it's a Vendor!
}

export async function sendNotification(type: NotificationType, data: NotificationData) {
  
  // Determine Recipient
  const recipientEmail = type === "VENDOR_REGISTERED" ? ADMIN_EMAIL : data.toEmail;

  if (!recipientEmail) return;

  console.log(`🔔 PREPARING EMAIL [${type}] for ${recipientEmail}`);

  try {
    const info = await transporter.sendMail({
      from: `"FixKart Support" <${process.env.SMTP_EMAIL}>`, 
      to: recipientEmail, 
      subject: getSubject(type, data),
      html: getHtmlTemplate(type, data),
    });

    console.log(`✅ Email Sent Successfully to ${recipientEmail} (Msg ID: ${info.messageId})`);
  } catch (err: any) {
    console.error("❌ Email Failed:", err.message);
  }
}

// --- HELPERS: Subject & Body ---

function getSubject(type: NotificationType, data: NotificationData) {
  const orderId = data.orderId || "N/A";
  const isVendorAlert = data.extraMessage?.includes("received a new order");

  switch (type) {
    case "ORDER_PLACED": 
      // Differentiate Subject based on who is receiving it
      if (isVendorAlert) return `🔔 New Order Received! (#${orderId})`;
      return `Order Confirmation #${orderId}`;

    case "ORDER_SHIPPED": return `Your Order #${orderId} has Shipped! 🚚`;
    case "ORDER_DELIVERED": return `Order #${orderId} Delivered Successfully 🎉`;
    case "ORDER_CANCELLED": return `Order #${orderId} Cancellation Alert ⚠️`;
    case "RETURN_REQUESTED": return `Return Request for Order #${orderId}`;
    case "RETURN_APPROVED": return `Return Approved for Order #${orderId} ✅`;
    case "RETURN_REJECTED": return `Return Update for Order #${orderId}`;
    
    // Vendor Notifications
    case "VENDOR_REGISTERED": return `🔔 New Vendor Registration: ${data.name}`;
    case "VENDOR_APPROVED": return `Welcome to FixKart! Account Approved`;
    case "VENDOR_REJECTED": return `Update regarding your Vendor Application`;
    
    default: return `Notification from FixKart`;
  }
}

function getHtmlTemplate(type: NotificationType, data: NotificationData) {
  const message = getMessageText(type, data);
  const orderId = data.orderId || "N/A";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #00529b; margin-top: 0;">${getSubject(type, data)}</h2>
      <p style="font-size: 16px; color: #333333; line-height: 1.5;">${message}</p>
      
      ${data.orderId ? `
      <div style="margin: 25px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00529b; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>Order ID:</strong> #${orderId}<br>
          <strong>Recipient:</strong> ${data.name}
        </p>
      </div>` : ''}

      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">
        This is an automated message from FixKart. Please do not reply directly to this email.
      </p>
    </div>
  `;
}

function getMessageText(type: NotificationType, data: NotificationData) {
  const orderId = data.orderId || "N/A";
  
  // Logic to detect Vendor vs Customer for Order Placed
  const isVendorAlert = data.extraMessage?.includes("received a new order");

  switch (type) {
    case "ORDER_PLACED": 
      // IF VENDOR (based on the extraMessage we pass in checkout.ts)
      if (isVendorAlert) {
         return `Hi ${data.name},<br><br><strong>You have received a new order!</strong><br>Order #${orderId} has been placed. Please go to your Vendor Dashboard to pack and ship the items.`;
      }
      // IF CUSTOMER
      return `Hi ${data.name},<br><br>Thank you for your purchase! We have received your order and are getting it ready. You will be notified once it ships.`;
    
    case "ORDER_SHIPPED": 
      return `Hi ${data.name},<br><br>Great news! Your order has been shipped and is on its way to you.`;
    
    case "ORDER_DELIVERED": 
      return `Hi ${data.name},<br><br>Your order has been delivered! We hope you enjoy your purchase.`;
    
    case "ORDER_CANCELLED": 
      // Vendors usually get this notification with an extraMessage saying "The customer has cancelled..."
      if (data.extraMessage) {
        return `<strong>Alert:</strong> Order #${orderId} has been cancelled.<br>Reason: ${data.extraMessage}`;
      }
      return `Hi ${data.name},<br><br>This is a confirmation that Order #${orderId} has been cancelled as requested.`;
    
    case "RETURN_REQUESTED": 
      // This goes to the Vendor
      return `<strong>Action Required:</strong> A return has been requested for Order #${orderId}.<br><br><strong>Reason:</strong> ${data.extraMessage}`;
    
    case "RETURN_APPROVED": 
      return `Hi ${data.name},<br><br>Your return request has been <strong>APPROVED</strong>. We have initiated the refund process.`;
    
    case "RETURN_REJECTED": 
      return `Hi ${data.name},<br><br>Your return request for Order #${orderId} was rejected.<br><strong>Reason:</strong> ${data.extraMessage}`;

    case "VENDOR_REGISTERED":
       return `<strong>Admin Alert:</strong><br>A new vendor <strong>${data.name}</strong> has just registered and is waiting for approval.<br><br>Please log in to the Admin Panel to review their documents.`;

    case "VENDOR_APPROVED":
      return `Hi ${data.name},<br><br>Congratulations! Your vendor account has been approved. You can now log in and start selling products.`;

    case "VENDOR_REJECTED":
      return `Hi ${data.name},<br><br>We regret to inform you that your vendor application was not approved at this time.<br><strong>Reason:</strong> ${data.extraMessage}`;
      
    default: return `Hi ${data.name}, you have a new notification regarding your account.`;
  }
}