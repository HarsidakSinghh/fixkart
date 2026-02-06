"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addRefundMessage } from "@/app/admin/actions";
import { Send, User as UserIcon, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    senderRole: string;
    message: string;
    createdAt: Date;
}

export default function RefundChatSection({ refundId, messages }: { refundId: string, messages: Message[] }) {
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const router = useRouter();

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setIsSending(true);
        try {
            const res = await addRefundMessage(refundId, newMessage);
            if (res.success) {
                setNewMessage("");
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] border rounded-md bg-white">
            <div className="p-4 border-b bg-gray-50 font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-600" />
                Dispute Resolution Chat
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-10">
                        No messages yet. Start the conversation.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isAdmin = msg.senderRole === "ADMIN";
                        return (
                            <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${isAdmin ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold opacity-80">
                                            {isAdmin ? "Admin (You)" : "Vendor"}
                                        </span>
                                        <span className="text-[10px] opacity-60">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm break-words">{msg.message}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
                <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-[50px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button
                    onClick={handleSend}
                    disabled={isSending || !newMessage.trim()}
                    className="h-auto"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
