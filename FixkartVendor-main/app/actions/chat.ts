"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache"; // <--- Import this

// 1. Fetch Chat History
export async function getChatMessages(refundRequestId: string) {
  noStore(); // <--- DISABLE CACHE: Forces a fresh DB fetch every time

  const { userId } = await auth();
  if (!userId) return [];

  try {
    // Add console log to debug in your terminal
    console.log(`Fetching chats for Request ID: ${refundRequestId}`);

    const messages = await prisma.refundChat.findMany({
      where: { refundRequestId },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
}

// 2. Send a Message
export async function sendChatMessage(refundRequestId: string, message: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!message.trim()) return { error: "Message cannot be empty" };

  try {
    await prisma.refundChat.create({
      data: {
        refundRequestId,
        senderId: userId,
        senderRole: "VENDOR",
        message: message.trim(),
      },
    });
    
    revalidatePath("/vendor/returns");
    return { success: true };
  } catch (error) {
    console.error("Chat Error:", error);
    return { error: "Failed to send message" };
  }
}