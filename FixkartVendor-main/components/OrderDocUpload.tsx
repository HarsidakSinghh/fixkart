"use client";

import { useState } from "react";
import { Upload, Eye, Loader2 } from "lucide-react";
import { uploadOrderDoc } from "../app/actions/vendor-uploads"; // We will create this next

interface OrderDocUploadProps {
  itemId: string;
  docType: "bill" | "slip";
  currentUrl: string | null;
}

export default function OrderDocUpload({ itemId, docType, currentUrl }: OrderDocUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (Max 5MB)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderItemId", itemId);
    formData.append("docType", docType);

    const res = await uploadOrderDoc(formData);
    setUploading(false);

    if (!res.success) {
      alert("Upload failed");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {docType === "bill" ? "Invoice / Bill" : "Transport Slip"}
      </span>
      
      {currentUrl ? (
        <div className="flex items-center gap-2">
          <a 
            href={currentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-100"
          >
            <Eye size={12} /> View
          </a>
          <label className="cursor-pointer text-gray-400 hover:text-gray-600">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
          </label>
        </div>
      ) : (
        <label className="cursor-pointer flex items-center gap-2 border border-dashed border-gray-300 rounded px-2 py-1.5 hover:border-blue-400 hover:bg-blue-50 transition-colors w-fit">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
          {uploading ? (
            <Loader2 className="animate-spin text-blue-500" size={16} />
          ) : (
            <Upload className="text-gray-400" size={16} />
          )}
          <span className="text-xs text-gray-500 font-medium">Upload</span>
        </label>
      )}
    </div>
  );
}