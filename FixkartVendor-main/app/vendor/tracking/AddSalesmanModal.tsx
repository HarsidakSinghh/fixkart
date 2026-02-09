"use client";

import { useState } from "react";
import { createSalesman } from "@/app/actions/salesman";
import { UserPlus, X, Loader2 } from "lucide-react";

export default function AddSalesmanModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const res = await createSalesman(formData);
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      // Ideally show a toast here
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#00529b] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-800 transition"
      >
        <UserPlus size={18} /> Add Salesman
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Register New Staff</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            
            <form action={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input name="name" required placeholder="e.g. Rahul Kumar" className="w-full mt-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input name="phone" required placeholder="e.g. 9876543210" className="w-full mt-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Access Code (Login Password)</label>
                <input name="code" required placeholder="e.g. 1234" className="w-full mt-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest" />
                <p className="text-[10px] text-gray-400 mt-1">Give this code to your salesman for login.</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#00529b] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}