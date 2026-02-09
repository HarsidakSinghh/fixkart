import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import { 
  Search,
  ChevronRight,
  ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare
} from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export const dynamic = "force-dynamic";

export default async function VendorComplaintsPage({ searchParams }: PageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const filter = params.filter?.toLowerCase() || "all";
  
  // 1. DETERMINE FILTER STATUS
  let statusFilter: any = {};
  
  if (filter === "pending") {
    statusFilter = { in: ["OPEN", "PENDING", "INVESTIGATING", "CLOSURE_REQUESTED"] };
  } else if (filter === "resolved") {
    statusFilter = { in: ["RESOLVED", "CLOSED", "REJECTED"] };
  }

  // --- 2. OWNERSHIP LOGIC (Smart Filter) ---
  const vendorOwnershipFilter = {
    OR: [
      { vendorId: user.id }, 
      {
        AND: [
          { vendorId: null },
          {
            order: {
              items: {
                some: {
                  vendorId: user.id
                }
              }
            }
          }
        ]
      }
    ]
  };

  // 3. FETCH DATA
  const complaints = await prisma.complaint.findMany({
    where: {
      AND: [
        { status: statusFilter }, 
        vendorOwnershipFilter 
      ]
    },
    include: {
      order: {
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Stats Counter
  const openCount = await prisma.complaint.count({
    where: {
      AND: [
        { status: { in: ["OPEN", "PENDING", "CLOSURE_REQUESTED"] } },
        vendorOwnershipFilter
      ]
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
        
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="text-[#00529b]" /> Complaints & Support
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage customer disputes and issues</p>
          </div>
        </header>

        {/* --- COMPLAINTS TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* TABS & SEARCH */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search by Order ID..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
             </div>
             
             {/* FILTER TABS */}
             <div className="flex gap-2">
                 <Link href="/vendor/complaints?filter=all">
                    <TabButton label="All" active={filter === "all"} />
                 </Link>
                 <Link href="/vendor/complaints?filter=pending">
                    <TabButton label="Pending" active={filter === "pending"} />
                 </Link>
                 <Link href="/vendor/complaints?filter=resolved">
                    <TabButton label="Resolved" active={filter === "resolved"} />
                 </Link>
             </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            {complaints.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No complaints found.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 text-sm font-bold text-gray-600">Complaint ID</th>
                      <th className="p-4 text-sm font-bold text-gray-600">Customer</th>
                      <th className="p-4 text-sm font-bold text-gray-600">Issue</th>
                      <th className="p-4 text-sm font-bold text-gray-600">Proof</th> {/* MATCHING RETURNS PAGE */}
                      <th className="p-4 text-sm font-bold text-gray-600">Date</th>
                      <th className="p-4 text-sm font-bold text-gray-600">Status</th>
                      <th className="p-4 text-sm font-bold text-gray-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 group transition-colors">
                            {/* ID */}
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold text-xs">
                                      #{item.id.slice(-4)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm text-gray-800">#{item.id.slice(-6).toUpperCase()}</p>
                                      <p className="text-xs text-gray-400">Ord: {item.orderId.slice(-6)}</p>
                                   </div>
                                </div>
                            </td>

                            {/* Customer */}
                            <td className="p-4">
                                <p className="text-sm font-medium text-gray-700">{item.order?.customerName || "Guest"}</p>
                                <p className="text-xs text-gray-400">{item.order?.customerEmail}</p>
                            </td>

                            {/* Issue */}
                            <td className="p-4">
                                <div className="max-w-[180px] text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-2">
                                    "{item.message}"
                                </div>
                            </td>

                            {/* --- PROOF IMAGES (Same Style as Returns) --- */}
                            <td className="p-4">
                                {item.proofImages && item.proofImages.length > 0 ? (
                                    <div className="flex gap-2">
                                        {item.proofImages.map((img, idx) => (
                                            <a 
                                                key={idx} 
                                                href={img} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="relative w-12 h-12 block border border-gray-200 rounded-lg overflow-hidden hover:opacity-80 hover:ring-2 ring-blue-500 transition-all"
                                                title="View Proof"
                                            >
                                                <Image 
                                                    src={img} 
                                                    alt="Proof" 
                                                    fill 
                                                    className="object-cover" 
                                                />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 italic flex items-center gap-1">
                                        <ImageIcon size={12}/> No Image
                                    </span>
                                )}
                            </td>

                            {/* Date */}
                            <td className="p-4 text-sm text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </td>

                            {/* Status Badge */}
                            <td className="p-4">
                                <StatusBadge status={item.status} />
                            </td>

                            {/* Action */}
                            <td className="p-4 text-right">
                                <Link href={`/vendor/complaints/${item.id}`}>
                                    <button className="text-gray-400 hover:text-[#00529b] transition-colors p-2 rounded hover:bg-blue-50">
                                        <ChevronRight size={20} />
                                    </button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
            )}
          </div>
        </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function TabButton({ label, active }: { label: string, active?: boolean }) {
    return (
        <button className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            active ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
        }`}>
            {label}
        </button>
    )
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toUpperCase();
    
    let style = "bg-gray-100 text-gray-600 border-gray-200";
    let Icon = Clock;

    if (s === "OPEN") { style = "bg-red-100 text-red-700 border-red-200"; Icon = AlertCircle; }
    else if (s === "CLOSURE_REQUESTED") { style = "bg-yellow-100 text-yellow-700 border-yellow-200"; Icon = Clock; }
    else if (s === "RESOLVED" || s === "CLOSED") { style = "bg-green-100 text-green-700 border-green-200"; Icon = CheckCircle; }
    else if (s === "PENDING") { style = "bg-orange-100 text-orange-700 border-orange-200"; Icon = Clock; }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit ${style}`}>
        <Icon size={12} />
        {status.replace(/_/g, " ")}
      </span>
    );
}