import { prisma } from "@/lib/prisma";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
};

export async function sendPushToUsers(userIds: string[], title: string, body: string, data?: Record<string, any>) {
  if (!userIds.length) return;
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
  });

  if (!tokens.length) return;

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
  }));

  await sendExpoPush(messages);
}

async function sendExpoPush(messages: PushMessage[]) {
  if (!messages.length) return;
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[push] failed", text);
    }
  } catch (err: any) {
    console.error("[push] error", err?.message || err);
  }
}
