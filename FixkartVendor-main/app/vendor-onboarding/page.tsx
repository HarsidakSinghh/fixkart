"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerVendor } from "@/app/actions/vendor";
import { useUser } from "@clerk/nextjs";

export default function VendorOnboarding() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // 1. Add GPS coordinates if captured
      if (coords) {
        formData.set("gpsLat", coords.lat.toString());
        formData.set("gpsLng", coords.lng.toString());
      }

      // 2. VALIDATE FILE COUNTS (Enforce Max 3 files)
      const multiFileFields = ["gstCertificate", "msmeCertificate", "aadharCard", "panCard", "locationImage", "backup1IdProof", "backup2IdProof"];
      
      for (const field of multiFileFields) {
        const files = formData.getAll(field);
        if (files.length > 3) {
            alert(`⚠️ Error: You uploaded too many files for ${field}.\n\nPlease select a maximum of 3 files.`);
            setLoading(false);
            return;
        }
      }

      // 3. CHECK FILE SIZE (Crucial for Mobile)
      const fileInputs = Array.from(formData.entries()).filter(([key, val]) => val instanceof File);
      const totalSize = fileInputs.reduce((acc, [_, file]) => acc + (file as File).size, 0);
      const sizeInMB = totalSize / (1024 * 1024);

      if (sizeInMB > 15) {
         const proceed = window.confirm(`⚠️ Large Upload Detected (${sizeInMB.toFixed(1)} MB)\n\nUploading large photos from mobile may fail.\n\nDo you want to continue?`);
         if (!proceed) {
            setLoading(false);
            return;
         }
      }

      // 4. Send Data
      const res = await registerVendor(formData);
      
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        alert("Registration failed: " + (res.error || "Please check your inputs."));
      }
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Something went wrong.\n\nTip: If you are uploading photos directly from your camera, they might be too large.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#00529b] p-6 text-white">
          <h1 className="text-2xl font-bold">Vendor Registration</h1>
          <p className="text-blue-100 mt-2">Complete your profile to start selling on FixKart.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* SECTION 1: BASIC INFO */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="fullName" placeholder="Full Name *" required defaultValue={user?.fullName || ""} className="p-3 border rounded" />
              <input name="companyName" placeholder="Company Name" className="p-3 border rounded" />
              <input name="phone" placeholder="Phone Number *" required className="p-3 border rounded" />
              <input name="email" type="email" placeholder="Email *" required defaultValue={user?.primaryEmailAddress?.emailAddress || ""} className="p-3 border rounded" />
              <input name="address" placeholder="Physical Address *" required className="p-3 border rounded md:col-span-2" />
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <input name="city" placeholder="City *" required className="p-3 border rounded" />
                <input name="state" placeholder="State *" required className="p-3 border rounded" />
                <input name="postalCode" placeholder="Postal Code *" required className="p-3 border rounded" />
              </div>
            </div>
          </div>

          {/* SECTION 2: BUSINESS DETAILS */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">2. Business Details & Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Business Type Dropdown */}
               <div className="md:col-span-2">
                 <label className="block text-sm font-bold text-gray-700 mb-1">Business Type *</label>
                 <select name="businessType" required className="w-full p-3 border rounded bg-white">
                   <option value="" disabled selected>Select Business Type...</option>
                   <option value="Retailer">Retailer</option>
                   <option value="Wholesaler">Wholesaler</option>
                   <option value="Manufacturer">Manufacturer</option>
                   <option value="Exporter">Exporter</option>
                 </select>
               </div>

               {/* Text Inputs */}
               <input name="gstNumber" placeholder="GST Number" className="p-3 border rounded" />
               <input name="tradeLicense" placeholder="Trade License / Udyam No." className="p-3 border rounded" />
               <input name="yearsInBusiness" placeholder="Years in Business" className="p-3 border rounded md:col-span-2" />

               {/* --- MULTI FILE UPLOADS --- */}
               
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">GST Certificate (Max 3 files)</label>
                 <input 
                    type="file" 
                    name="gstCertificate" 
                    multiple // ALLOWS MULTIPLE SELECTION
                    accept="image/*,application/pdf"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                 />
                 <p className="text-[10px] text-gray-400">Hold Ctrl/Cmd to select multiple files.</p>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">MSME Certificate (Max 3 files)</label>
                 <input 
                    type="file" 
                    name="msmeCertificate" 
                    multiple 
                    accept="image/*,application/pdf"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">Aadhar Card (Front & Back)</label>
                 <input 
                    type="file" 
                    name="aadharCard" 
                    required 
                    multiple 
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">PAN Card Photo</label>
                 <input 
                    type="file" 
                    name="panCard" 
                    required 
                    multiple
                    accept="image/*" 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">Owner's Personal Photo</label>
                 <input 
                    type="file" 
                    name="ownerPhoto" 
                    required 
                    accept="image/*" // Usually single, kept single
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                 />
               </div>
            </div>
          </div>

          {/* SECTION 3: BANKING */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">3. Banking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="bankName" placeholder="Bank Name *" required className="p-3 border rounded" />
              <input name="accountHolder" placeholder="Account Holder Name *" required className="p-3 border rounded" />
              <input name="accountNumber" placeholder="Account Number *" required className="p-3 border rounded" />
              <input name="ifscCode" placeholder="IFSC Code *" required className="p-3 border rounded" />
              
              <div className="md:col-span-2 mt-2 space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">Cancelled Cheque Photo</label>
                 <input type="file" name="cancelledCheque" required className="block w-full text-sm text-gray-500 file:py-3 file:px-4 file:rounded border file:border-0 file:bg-gray-100 hover:file:bg-gray-200" />
               </div>
            </div>
          </div>

          {/* SECTION 4: BACKUP CONTACTS */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">4. Backup Contacts (Emergency)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Contact 1 */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-[#00529b]">Backup Contact 1</h4>
                <input name="backup1Name" placeholder="Name *" required className="w-full p-2 border rounded" />
                <input name="backup1Phone" placeholder="Phone *" required className="w-full p-2 border rounded" />
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Upload ID Proof (Front/Back)</label>
                  <input type="file" name="backup1IdProof" required multiple className="block w-full text-xs" />
                </div>
              </div>

              {/* Contact 2 */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-[#00529b]">Backup Contact 2</h4>
                <input name="backup2Name" placeholder="Name *" required className="w-full p-2 border rounded" />
                <input name="backup2Phone" placeholder="Phone *" required className="w-full p-2 border rounded" />
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Upload ID Proof (Front/Back)</label>
                  <input type="file" name="backup2IdProof" required multiple className="block w-full text-xs" />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 5: LOCATION VERIFICATION */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">5. Location Verification</h3>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">GPS Location</label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={handleGetLocation} className="bg-[#00529b] text-white px-4 py-2 rounded hover:bg-blue-800 transition flex items-center gap-2">
                       📍 Detect My Location
                    </button>
                    {coords && <span className="text-green-600 text-sm font-semibold">Location Captured!</span>}
                  </div>
               </div>
               
               <div className="space-y-1">
                 <label className="block text-sm text-gray-700 font-bold">Shop/Location Photos (Max 3)</label>
                 <input 
                    type="file" 
                    name="locationImage" 
                    required 
                    multiple 
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white file:text-blue-700 hover:file:bg-blue-100" 
                 />
                 <p className="text-[10px] text-gray-500">Upload multiple angles (Front, Inside, Signboard).</p>
               </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#ffc20e] text-black font-bold text-lg py-4 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting Registration..." : "Submit Registration"}
          </button>

        </form>
      </div>
    </div>
  );
}