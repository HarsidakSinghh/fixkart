import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import EditProductForm from "./EditProductForm"; 

export default async function EditProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  // Fetch product by ID
  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  // Verify ownership
  if (!product || product.vendorId !== userId) {
    return notFound();
  }

  // Render Client Form
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <EditProductForm product={product} />
    </div>
  );
}