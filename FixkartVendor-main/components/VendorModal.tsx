"use client";

import React, { useState, useEffect, useRef } from "react";
import { addProduct, getExistingSubSubCategories, searchGlobalProducts } from "@/app/actions";
import { INVENTORY_DATA } from "@/app/data/inventory";
import { X, UploadCloud, Trash2, Search, Copy, Pencil, Eye, ArrowLeft, CheckCircle, List } from "lucide-react";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedSubCategorySlug?: string;
  preSelectedItemType?: string;
}

export default function VendorModal({
  isOpen,
  onClose,
  preSelectedSubCategorySlug,
  preSelectedItemType
}: VendorModalProps) {

  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedItemType, setSelectedItemType] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("Piece");
  const [subSubOptions, setSubSubOptions] = useState<string[]>([]);

  // Logic State
  const [isLocked, setIsLocked] = useState(false);
  const [isTemplateMode, setIsTemplateMode] = useState(false);

  // Images State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Search/Template State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  // --- 1. HANDLE PRE-SELECTION ---
  useEffect(() => {
    if (isOpen && preSelectedSubCategorySlug) {
      const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetSlug = normalize(preSelectedSubCategorySlug);
      let foundCategory = "";
      let foundSubTitle = "";
      let foundItemType = "";

      const mainCatMatch = INVENTORY_DATA.find(c => normalize(c.slug) === targetSlug);
      if (mainCatMatch) {
        foundCategory = mainCatMatch.parentCategory || "General";
        foundSubTitle = mainCatMatch.title;
      } else {
        for (const cat of INVENTORY_DATA) {
          const itemMatch = cat.items.find(item => normalize(item.name) === targetSlug);
          if (itemMatch) {
            foundCategory = cat.parentCategory || "General";
            foundSubTitle = cat.title;
            foundItemType = itemMatch.name;
            break;
          }
        }
      }

      if (foundSubTitle) {
        setSelectedCategory(foundCategory);
        setSelectedSubCategory(foundSubTitle);
        if (preSelectedItemType || foundItemType) {
          setSelectedItemType(preSelectedItemType || foundItemType);
        }
        setIsLocked(true);
      }
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, preSelectedSubCategorySlug, preSelectedItemType]);

  // --- 2. SEARCH HANDLER (TYPING) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Only auto-search if user is typing (length > 1)
      if (searchQuery.length > 1) {
        setIsSearching(true);
        const subCatFilter = isLocked ? selectedSubCategory : undefined;
        const subSubCatFilter = (isLocked && selectedItemType) ? selectedItemType : undefined;

        const results = await searchGlobalProducts(
          searchQuery,
          subCatFilter,
          subSubCatFilter
        );

        setSearchResults(results);
        setIsSearching(false);
      } else if (searchQuery.length === 0) {
        // If query cleared, do NOT clear results if we are in "View All" mode 
        // (But for simplicity, clearing typing usually clears results unless handled explicitly. 
        //  We will let the Toggle Button handle the View All state exclusively below).
        // setSearchResults([]); 
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isLocked, selectedSubCategory, selectedItemType]);

  // --- 3. HANDLE VIEW ALL BUTTON (TOGGLE) ---
  const handleViewAll = async () => {
    // TOGGLE OFF: If results are already showing, close them.
    if (searchResults.length > 0) {
      setSearchResults([]);
      setSearchQuery(""); // Clear any text query too
      return;
    }

    // TOGGLE ON: Fetch all items
    setIsSearching(true);
    const subCatFilter = selectedSubCategory;
    const subSubCatFilter = selectedItemType || undefined;

    const results = await searchGlobalProducts(
      "", // Empty query to get everything
      subCatFilter,
      subSubCatFilter
    );

    setSearchResults(results);
    setIsSearching(false);
  };

  // --- 4. TEMPLATE SELECTION ---
  const handleSelectTemplate = (product: any) => {
    setProductName(product.name);
    setTitle(product.title || product.name);
    setDescription(product.description || "");

    setSelectedCategory(product.category);
    setSelectedSubCategory(product.subCategory);
    setSelectedItemType(product.subSubCategory || "");

    if (product.specs?.unit) setUnit(product.specs.unit);

    if (product.gallery && product.gallery.length > 0) {
      setExistingImages(product.gallery);
    } else if (product.image) {
      setExistingImages([product.image]);
    }

    setIsTemplateMode(true);
    setIsLocked(true);
    setSearchQuery("");
    setSearchResults([]);
    setPreviewProduct(null);
  };

  const resetForm = () => {
    setImageFiles([]);
    setPreviews([]);
    setExistingImages([]);
    setProductName("");
    setTitle("");
    setDescription("");
    setIsTemplateMode(false);
    setSearchQuery("");
    setPreviewProduct(null);
    setSearchResults([]);
  };

  // --- IMAGE & SUBMIT HANDLERS ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      formData.set("category", selectedCategory);
      formData.set("subCategory", selectedSubCategory);
      formData.set("subSubCategory", selectedItemType || preSelectedItemType || "");
      formData.set("description", description);
      formData.set("name", productName);
      formData.set("title", title);
      formData.set("unit", unit);

      existingImages.forEach(url => formData.append("existingImages", url));
      formData.delete("images");
      imageFiles.forEach((file) => formData.append("images", file));

      const res = await addProduct(formData);
      if (res?.success) {
        alert(isTemplateMode ? "Listed successfully from template!" : "Product Added Successfully!");
        onClose();
        window.location.reload();
      } else {
        alert("Failed: " + (res?.error || "Unknown error"));
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">

        {/* Header */}
        <div className="bg-[#00529b] p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isTemplateMode ? <Copy size={24} /> : <UploadCloud size={24} />}
            {isTemplateMode ? "Sell Similar Item" : "Post New Item"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* --- PREVIEW OVERLAY --- */}
        {previewProduct && (
          <div className="absolute inset-0 top-[60px] z-[60] bg-white flex flex-col animate-in fade-in slide-in-from-right-4">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ArrowLeft className="text-gray-600" size={20} />
              </button>
              <h3 className="font-bold text-gray-800">Previewing Product</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                {previewProduct.image ? (
                  <img src={previewProduct.image} alt="preview" className="h-full object-contain" />
                ) : (
                  <span className="text-gray-400">No Image Available</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#00529b]">{previewProduct.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {previewProduct.category} / {previewProduct.subCategory} / {previewProduct.subSubCategory}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {previewProduct.description || "No description provided."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-gray-50">
                  <span className="text-xs text-gray-500 uppercase font-bold">Base Price</span>
                  <p className="font-bold text-lg">₹{previewProduct.price}</p>
                </div>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <span className="text-xs text-gray-500 uppercase font-bold">Unit</span>
                  <p className="font-bold text-lg">{previewProduct.specs?.unit || "Piece"}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-4 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setPreviewProduct(null)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
              >
                Back to Search
              </button>
              <button
                onClick={() => handleSelectTemplate(previewProduct)}
                className="flex-1 py-3 bg-[#00529b] text-white rounded-lg font-bold hover:bg-blue-800 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Use This Template
              </button>
            </div>
          </div>
        )}

        {/* --- SEARCH BAR AREA --- */}
        {!isTemplateMode && !previewProduct && (
          <div className="p-4 bg-gray-50 border-b relative z-50">
            <div className="flex gap-2">
              {/* 1. INPUT FIELD */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={
                    isLocked
                      ? (selectedItemType ? `Search in ${selectedItemType}...` : `Search in ${selectedSubCategory}...`)
                      : "Search entire catalog..."
                  }
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00529b] outline-none shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <span className="absolute right-3 top-3 text-xs text-gray-400">Searching...</span>}
              </div>

              {/* 2. VIEW ALL / TOGGLE BUTTON (Only if Locked) */}
              {isLocked && (
                <button
                  onClick={handleViewAll}
                  title={searchResults.length > 0 ? "Close List" : "View All"}
                  className={`px-4 py-2 border rounded-lg transition-all shadow-sm flex items-center gap-2 ${searchResults.length > 0
                      ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    }`}
                >
                  {/* DYNAMIC ICON */}
                  {searchResults.length > 0 ? <X size={20} /> : <List size={20} />}

                  {/* DYNAMIC TEXT */}
                  <span className="hidden sm:inline font-medium text-sm">
                    {searchResults.length > 0 ? "Close" : "View All"}
                  </span>
                </button>
              )}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-xl border border-t-0 max-h-60 overflow-y-auto mx-4 rounded-b-lg">
                {searchResults.map(item => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-blue-50 border-b flex items-center gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleSelectTemplate(item)}>
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#00529b]">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.subCategory} • {item.subSubCategory}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewProduct(item); }}
                        className="p-2 text-gray-400 hover:text-[#00529b] hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleSelectTemplate(item)}
                        className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE MODE BANNER */}
        {isTemplateMode && (
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center z-40">
            <div>
              <p className="text-sm text-blue-800 font-bold flex items-center gap-2">
                <Pencil size={14} />
                Template Loaded
              </p>
              <p className="text-xs text-blue-600">Details pre-filled. You can edit them below.</p>
            </div>
            <button onClick={resetForm} className="text-xs text-red-500 hover:text-red-700 underline">
              Clear Template
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          <form ref={formRef} action={handleSubmit} className="flex flex-col gap-5">
            {/* LOCKED INFO */}
            {(isLocked || isTemplateMode) && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Category Path</p>
                <div className="flex flex-wrap items-center gap-2 text-gray-700 font-medium text-sm">
                  <span>{selectedCategory}</span>
                  <span>/</span>
                  <span className="font-medium">{selectedSubCategory}</span>
                  {(selectedItemType) && (
                    <>
                      <span>/</span>
                      <span className="text-[#00529b] font-bold">{selectedItemType}</span>
                    </>
                  )}
                </div>
                <input type="hidden" name="category" value={selectedCategory} />
                <input type="hidden" name="subCategory" value={selectedSubCategory} />
              </div>
            )}

            {!isLocked && !isTemplateMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select name="category" required onChange={(e) => setSelectedCategory(e.target.value)} className="border p-3 rounded-lg bg-white">
                    <option value="">Select</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Construction">Construction</option>
                    <option value="Safety">Safety</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">Sub Category</label>
                  <input name="subCategory" required onChange={(e) => setSelectedSubCategory(e.target.value)} className="border p-3 rounded-lg" />
                </div>
              </div>
            )}

            {/* Product Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Product Name</label>
              <input
                name="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none"
              />
            </div>

            {/* Item Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Item Type (Group Name)</label>
              <input
                name="subSubCategory"
                value={selectedItemType}
                onChange={(e) => setSelectedItemType(e.target.value)}
                readOnly={isTemplateMode || (isLocked && !!preSelectedItemType)}
                list="subSubOptions"
                className={`border border-gray-300 rounded-lg p-3 outline-none ${isTemplateMode ? 'bg-gray-100 text-gray-500' : ''}`}
              />
              {!isTemplateMode && (
                <datalist id="subSubOptions">
                  {subSubOptions.map((opt, i) => <option key={i} value={opt} />)}
                </datalist>
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Display Title</label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Product Description</label>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-[#00529b] outline-none"
              />
            </div>

            {/* Price/Unit/Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Price (₹)</label>
                <input name="price" type="number" step="0.01" required placeholder="0.00" className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Unit</label>
                <select
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                >
                  <option value="Piece">Piece (pc)</option>
                  <option value="Box">Box</option>
                  <option value="Kg">Kg</option>
                  <option value="Litre">Litre</option>
                  <option value="Meter">Meter</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Stock</label>
                <input name="quantity" type="number" required placeholder="10" className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#00529b] outline-none" />
              </div>
            </div>

            {/* Images */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-gray-700">Product Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={handleImageChange}
                />
                <UploadCloud className="text-gray-400 mb-2 group-hover:text-[#00529b] transition-colors" size={32} />
                <span className="text-gray-500 font-medium group-hover:text-[#00529b]">Click to Upload New Images</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {existingImages.map((src, index) => (
                  <div key={`exist-${index}`} className="relative aspect-square border border-blue-200 bg-blue-50 rounded-lg overflow-hidden group">
                    <img src={src} alt="existing" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1 rounded">Template</div>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {previews.map((src, index) => (
                  <div key={`new-${index}`} className="relative aspect-square border border-green-200 bg-green-50 rounded-lg overflow-hidden group">
                    <img src={src} alt="new" className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-green-600 text-white text-[9px] px-1 rounded">New</div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-lg border border-gray-300 font-bold text-gray-700">Cancel</button>
              <button type="submit" disabled={isLoading} className="flex-1 py-3 px-4 rounded-lg bg-[#00529b] text-white font-bold hover:bg-blue-800 shadow-lg">
                {isLoading ? "Processing..." : (isTemplateMode ? "Publish Offer" : "Post Item Now")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
