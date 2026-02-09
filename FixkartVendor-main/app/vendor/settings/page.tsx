import React from "react";
import { getVendorProfile } from "@/app/actions/vendor-profile";
import { 
  Building2, 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail, 
  ShieldCheck 
} from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const profile = await getVendorProfile();

  if (!profile) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Profile not found. Please complete your registration.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-50 flex-shrink-0">
          <Image 
            src={profile.ownerPhotoUrl || "/placeholder-user.jpg"} 
            alt="Owner" 
            fill 
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
          <p className="text-gray-500 font-medium">{profile.fullName} • {profile.category}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
             <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide border ${
               profile.status === "APPROVED" 
                 ? "bg-green-50 text-green-700 border-green-200" 
                 : "bg-yellow-50 text-yellow-700 border-yellow-200"
             }`}>
               {profile.status}
             </span>
             <span className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 text-xs font-bold rounded-full uppercase tracking-wide">
               {profile.businessType}
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. BUSINESS INFO */}
        <SectionCard title="Business Details" icon={<Building2 className="text-[#00529b]" />}>
           <InfoRow label="Company Name" value={profile.companyName} />
           <InfoRow label="Business Category" value={profile.category} />
           <InfoRow label="Structure" value={profile.businessType} />
           <InfoRow label="Years in Business" value={profile.yearsInBusiness} />
           <InfoRow label="GST Number" value={profile.gstNumber} />
           <InfoRow label="Trade License" value={profile.tradeLicense || "N/A"} />
        </SectionCard>

        {/* 2. CONTACT INFO */}
        <SectionCard title="Contact Information" icon={<User className="text-[#00529b]" />}>
           <InfoRow label="Owner Name" value={profile.fullName} />
           <InfoRow label="Primary Phone" value={profile.phone} icon={<Phone size={14} />} />
           <InfoRow label="Email Address" value={profile.email} icon={<Mail size={14} />} />
           
           <div className="pt-4 border-t border-dashed border-gray-200 mt-4">
             <p className="text-xs font-bold text-gray-400 uppercase mb-3">Emergency Contacts</p>
             <InfoRow label="Backup 1" value={profile.backup1Name ? `${profile.backup1Name} (${profile.backup1Phone})` : "N/A"} />
             <InfoRow label="Backup 2" value={profile.backup2Name ? `${profile.backup2Name} (${profile.backup2Phone})` : "N/A"} />
           </div>
        </SectionCard>

        {/* 3. LOCATION */}
        <SectionCard title="Location" icon={<MapPin className="text-[#00529b]" />}>
           <InfoRow label="Address" value={profile.address} />
           <div className="grid grid-cols-2 gap-4">
             <InfoRow label="City" value={profile.city} />
             <InfoRow label="State" value={profile.state} />
           </div>
           <InfoRow label="Postal Code" value={profile.postalCode} />
           
           {profile.locationPhotoUrl && (
             <div className="mt-5">
               <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Store Front</p>
               <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-200">
                 <Image src={profile.locationPhotoUrl} alt="Store Location" fill className="object-cover" />
               </div>
             </div>
           )}
        </SectionCard>

        {/* 4. BANKING */}
        <SectionCard title="Banking Details" icon={<CreditCard className="text-[#00529b]" />}>
           <InfoRow label="Bank Name" value={profile.bankName} />
           <InfoRow label="Account Holder" value={profile.accountHolder} />
           <InfoRow label="Account Number" value={profile.accountNumber} />
           <InfoRow label="IFSC Code" value={profile.ifscCode} />
           
           {profile.cancelledChequeUrl && (
             <div className="mt-4">
               <a 
                 href={profile.cancelledChequeUrl} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 text-xs font-bold text-[#00529b] bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
               >
                 <FileText size={16} /> View Cancelled Cheque
               </a>
             </div>
           )}
        </SectionCard>

      </div>

      {/* 5. DOCUMENTS SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-6">
          <ShieldCheck className="text-[#00529b]" /> Verified Documents
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <DocPreview label="GST Certificate" url={profile.gstCertificateUrl} />
           <DocPreview label="MSME Certificate" url={profile.msmeCertificateUrl} />
           <DocPreview label="PAN Card" url={profile.panCardUrl} />
           <DocPreview label="Aadhar Card" url={profile.aadharCardUrl} />
        </div>
      </div>

    </div>
  );
}

// --- HELPER COMPONENTS ---

function SectionCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
        {icon} {title}
      </h3>
      <div className="space-y-4 flex-1">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string, value: string | null | undefined, icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{label}</span>
      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2 break-words">
        {icon} {value}
      </span>
    </div>
  );
}

function DocPreview({ label, url }: { label: string, url: string | null }) {
  if (!url) return null;
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer"
      className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-[#00529b] hover:bg-blue-50 transition-all text-center h-32"
    >
      <FileText className="mb-3 text-gray-400 group-hover:text-[#00529b] transition-colors" size={32} />
      <span className="text-xs font-bold text-gray-600 group-hover:text-[#00529b] transition-colors">{label}</span>
    </a>
  );
}