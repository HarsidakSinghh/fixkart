"use client";

import { deleteProduct } from "@/app/actions";

export default function DeleteButton({ productId, productName }: { productId: string, productName: string }) {
  const handleDelete = async () => {
    if (confirm(`Delete "${productName}"?`)) {
      await deleteProduct(productId);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      className="absolute top-2 right-2 z-10 bg-white text-red-500 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
      title="Delete"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    </button>
  );
}