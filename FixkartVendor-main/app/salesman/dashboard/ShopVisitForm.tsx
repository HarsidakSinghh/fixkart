"use client";

import { useState, useRef } from "react";
import { submitShopVisit } from "@/app/actions/salesman-visit";
import { Camera, MapPin, Loader2, CheckCircle, Store } from "lucide-react";
import { compressImage } from "@/lib/image-compression";

export default function ShopVisitForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setPreview(URL.createObjectURL(originalFile));

      try {
        setIsCompressing(true);
        const compressed = await compressImage(originalFile);
        setCompressedFile(compressed);
      } catch (error) {
        console.error("Compression failed:", error);
        alert("Failed to process image. Please try again.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCompressing) return; // Prevent submit while compressing

    setIsSubmitting(true);
    const form = e.currentTarget;

    // 1. Capture Exact Location FIRST
    if (!navigator.geolocation) {
      alert("GPS not supported");
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 2. Create FormData manually
        const formData = new FormData(form);
        formData.append("lat", latitude.toString());
        formData.append("lng", longitude.toString());

        // Replace the original large file with the compressed one if available
        if (compressedFile) {
          formData.set("image", compressedFile);
        }

        // 3. Send to Server
        const res = await submitShopVisit(formData);

        if (res.success) {
          alert("✅ Visit Logged Successfully!");
          setShowForm(false);
          setPreview(null);
          setCompressedFile(null);
          form.reset();
        } else {
          alert("Error: " + res.error);
        }
        setIsSubmitting(false);
      },
      (err) => {
        alert("⚠️ Location failed. Please enable GPS.");
        setIsSubmitting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // --- STATE 1: BUTTON ONLY ---
  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-white border-2 border-dashed border-blue-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Store size={24} />
        </div>
        <span className="font-bold">Log New Shop Visit</span>
      </button>
    );
  }

  // --- STATE 2: THE FORM ---
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" /> New Check-In
        </h3>
        <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 font-medium">
          Cancel
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

        {/* Shop Name */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Shop Name</label>
          <input
            name="shopName"
            required
            placeholder="e.g. Gupta General Store"
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Notes (Optional)</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="e.g. Order taken for 50 boxes..."
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Camera Input */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Proof Photo</label>
          <div className="mt-2 relative">
            <input
              type="file"
              name="image"
              accept="image/*"
              capture="environment" // Forces back camera on mobile
              required
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />

            <div className="w-full h-40 bg-gray-100 border-2 border-gray-200 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400">
              {preview ? (
                <div className="relative w-full h-full">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                  {isCompressing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="animate-spin text-white" />
                      <span className="text-white text-xs ml-2">Processing...</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Camera size={24} className="mb-2" />
                  <span className="text-xs">Tap to Take Photo</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isCompressing}
          className="w-full bg-[#00529b] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Uploading...
            </>
          ) : isCompressing ? (
            <>
              <Loader2 className="animate-spin" /> Processing Image...
            </>
          ) : (
            <>
              <CheckCircle size={20} /> Submit Visit
            </>
          )}
        </button>

      </form>
    </div>
  );
}
