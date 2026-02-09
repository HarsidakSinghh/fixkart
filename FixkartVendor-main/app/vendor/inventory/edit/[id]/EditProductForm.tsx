"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/app/actions/vendor"; 
import { ArrowLeft, Save, Loader2, X, UploadCloud, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function EditProductForm({ product }: { product: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE: IMAGE MANAGEMENT ---
  // 1. Initialize with existing images (Main + Gallery)
  // We dedup just in case the main image is also repeated in the gallery
  const initialImages = [
    product.image,
    ...(product.gallery || []).filter((url: string) => url !== product.image)
  ].filter(Boolean);

  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  
  // 2. New Uploads
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // --- HANDLERS ---
  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...files]);
      
      const urls = files.map(file => URL.createObjectURL(file));
      setNewPreviews((prev) => [...prev, ...urls]);
    }
  };

  const removeNewFile = (indexToRemove: number) => {
    setNewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setNewPreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    // 1. Append Existing Images to Keep (The backend needs to know what NOT to delete)
    // We send these as multiple 'keptImages' entries
    existingImages.forEach(url => {
        formData.append("keptImages", url);
    });

    // 2. Append New Images (The backend will upload these)
    newFiles.forEach(file => {
        formData.append("newImages", file);
    });

    const res = await updateProduct(formData);
    
    if (res.success) {
      alert("Product updated successfully!");
      router.push("/vendor/inventory"); // Or wherever you list products
      router.refresh();
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          type="button"
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500">Update images, stock, price, and details</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="id" value={product.id} />

        {/* --- SECTION 1: IMAGE MANAGEMENT --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                 <ImageIcon size={20} /> Media Gallery
              </h3>
              <span className="text-xs text-gray-400">
                 {existingImages.length + newFiles.length} images selected
              </span>
           </div>
           
           <div className="p-6 space-y-6">
              
              {/* A. Existing Images Grid */}
              {existingImages.length > 0 && (
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Current Images</label>
                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {existingImages.map((url, index) => (
                         <div key={index} className="relative group aspect-square bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <Image 
                               src={url} 
                               alt="Product" 
                               fill 
                               className="object-contain p-2" 
                            />
                            {/* Delete Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <button 
                                 type="button"
                                 onClick={() => removeExistingImage(index)}
                                 className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-sm"
                                 title="Remove Image"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                            {/* Main Badge for first item */}
                            {index === 0 && (
                               <span className="absolute top-0 left-0 bg-[#00529b] text-white text-[10px] px-2 py-0.5 rounded-br-lg font-bold">
                                  Main
                               </span>
                            )}
                         </div>
                      ))}
                   </div>
                </div>
              )}

              {/* B. New Uploads Dropzone */}
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Add New Images</label>
                 
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                 >
                    <input 
                       type="file" 
                       multiple 
                       accept="image/*" 
                       className="hidden" 
                       ref={fileInputRef}
                       onChange={handleFileChange}
                    />
                    <UploadCloud className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm font-bold text-gray-600">Click to Upload</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP supported</p>
                 </div>

                 {/* New Previews Grid */}
                 {newPreviews.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mt-4">
                       {newPreviews.map((url, index) => (
                          <div key={index} className="relative group aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                             <img src={url} alt="New Preview" className="w-full h-full object-cover" />
                             <button 
                               type="button"
                               onClick={() => removeNewFile(index)}
                               className="absolute top-1 right-1 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                <X size={14} />
                             </button>
                             <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[9px] text-center py-0.5">
                                New
                             </span>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* --- SECTION 2: PRODUCT DETAILS --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-700">Product Information</h3>
           </div>
           
           <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                <input 
                   name="name" 
                   defaultValue={product.name} 
                   className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none font-bold text-gray-800"
                />
             </div>

             <div className="col-span-1 md:col-span-2">
               <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
               <textarea 
                 name="description" 
                 required
                 rows={4}
                 defaultValue={product.description || ""}
                 className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none resize-none"
               />
             </div>

             <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹)</label>
                 <input 
                   name="price" 
                   type="number" 
                   step="0.01" 
                   required 
                   defaultValue={product.price}
                   className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none font-bold text-lg text-[#00529b]"
                 />
             </div>

             <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Stock Quantity</label>
                 <input 
                   name="quantity" 
                   type="number" 
                   required 
                   defaultValue={product.quantity}
                   className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none"
                 />
             </div>
             
             {/* Category Info (Read Only) */}
             <div className="col-span-1 md:col-span-2 flex gap-4 pt-2">
                 <div className="bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-sm text-gray-600">
                   <span className="font-bold">Category:</span> {product.category}
                 </div>
                 <div className="bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-sm text-gray-600">
                   <span className="font-bold">Sub-Category:</span> {product.subCategory}
                 </div>
             </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-4 z-10 flex justify-end gap-3">
          <div className="bg-white p-2 rounded-xl shadow-xl border border-gray-200 flex gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 rounded-lg font-bold text-white bg-[#00529b] hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}