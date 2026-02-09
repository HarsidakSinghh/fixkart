"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MessageSquare, X, User, ShieldCheck, Send, Loader2, RefreshCcw } from "lucide-react";
import { getChatMessages, sendChatMessage } from "@/app/actions/chat";

// Define Data Types
interface RefundRequestProps {
  id: string;
  vendorRejectionReason: string | null;
  vendorRejectionProof: string[];
  status: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  senderRole: string;
  message: string;
  createdAt: Date;
}

export default function DisputeChatModal({ request }: { request: RefundRequestProps }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If there's no rejection reason, there's no dispute yet
  if (!request.vendorRejectionReason) return null;

  // Fetch Messages when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // Auto-refresh messages every 3 seconds to see Admin replies in real-time
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const loadMessages = async () => {
    try {
      const chats = await getChatMessages(request.id);
      if (chats) setMessages(chats);
    } catch (err) {
      console.error("Failed to load chats", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    
    // Optimistic Update (Show message immediately)
    const tempMsg = {
        id: "temp-" + Date.now(),
        senderRole: "VENDOR",
        message: newMessage,
        createdAt: new Date()
    };
    setMessages((prev) => [...prev, tempMsg]);
    
    const msgToSend = newMessage;
    setNewMessage(""); // Clear input

    await sendChatMessage(request.id, msgToSend);
    setSending(false);
    loadMessages(); // Refresh from DB to confirm
  };

  return (
    <>
      {/* --- TRIGGER BUTTON --- */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative group p-2 hover:bg-blue-50 rounded-full transition-colors"
        title="Open Dispute Chat"
      >
        <MessageSquare size={20} className="text-blue-600" />
      </button>

      {/* --- MODAL OVERLAY --- */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-100 w-full max-w-lg h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <ShieldCheck className="text-purple-600" size={18} /> Dispute Resolution
                </h3>
                <p className="text-xs text-gray-400">Order ID: {request.id.slice(-6).toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={loadMessages} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400" title="Refresh">
                    <RefreshCcw size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition">
                    <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
               
               {/* --- ORIGINAL REJECTION CONTEXT (Pinned at top) --- */}
               <div className="flex flex-col items-center">
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-xs font-medium mb-4">
                     Dispute Started: {new Date(request.createdAt).toLocaleDateString()}
                  </div>
               </div>

               {/* 1. Initial Rejection Reason (Visualized as first message) */}
               <div className="flex flex-col items-end">
                  <div className="flex items-end gap-2 max-w-[85%]">
                     <div className="bg-blue-100 border border-blue-200 text-gray-800 p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                        <p className="font-bold text-[10px] text-blue-600 uppercase mb-1">Original Rejection Reason</p>
                        <p>{request.vendorRejectionReason}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                        <User size={14} />
                     </div>
                  </div>
                  {/* Proof Images */}
                  {request.vendorRejectionProof && request.vendorRejectionProof.length > 0 && (
                      <div className="mt-2 flex gap-2 mr-10 justify-end flex-wrap">
                          {request.vendorRejectionProof.map((img, idx) => (
                              <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:scale-105 transition shadow-sm">
                                  <Image src={img} alt="proof" fill className="object-cover" />
                              </a>
                          ))}
                      </div>
                  )}
               </div>

               {/* 2. Dynamic Chat Messages */}
               {messages.length > 0 ? (
                   messages.map((msg) => {
                       const isMe = msg.senderRole === "VENDOR";
                       return (
                           <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                               <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                                   
                                   {/* Message Bubble */}
                                   <div className={`p-3 rounded-2xl shadow-sm text-sm ${
                                       isMe 
                                       ? "bg-blue-600 text-white rounded-tr-none" 
                                       : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                                   }`}>
                                       <p>{msg.message}</p>
                                   </div>

                                   {/* Avatar */}
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                                       isMe ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600 border border-purple-200"
                                   }`}>
                                       {isMe ? <User size={14} /> : <ShieldCheck size={14} />}
                                   </div>
                               </div>
                               <span className={`text-[10px] text-gray-400 mt-1 ${isMe ? "mr-10" : "ml-10"}`}>
                                   {isMe ? "You" : "Admin"} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </span>
                           </div>
                       );
                   })
               ) : (
                   <p className="text-center text-xs text-gray-400 my-4">No new messages yet.</p>
               )}
               
               {/* Spacer for scrolling */}
               <div className="h-4"></div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-200">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message to Admin..."
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                    <button 
                        type="submit" 
                        disabled={sending || !newMessage.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
}