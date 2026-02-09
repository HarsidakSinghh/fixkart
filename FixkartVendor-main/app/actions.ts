"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

// --- UPDATED: SEARCH WITH SUB-CATEGORY AND SUB-SUB-CATEGORY CONTEXT ---
export async function searchGlobalProducts(
  query: string,
  subCategoryContext?: string,
  subSubCategoryContext?: string
) {
  // 1. VALIDATION: Allow if there is a query OR a context
  const hasQuery = query && query.trim().length > 0;
  const hasContext = !!subCategoryContext || !!subSubCategoryContext;

  if (!hasQuery && !hasContext) return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        status: "APPROVED",

        // 2. SEARCH TEXT FILTER (Only applies if query exists)
        ...(hasQuery ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } }
          ]
        } : {}),

        // 3. CONTEXT FILTERS
        ...(subCategoryContext ? {
          subCategory: { equals: subCategoryContext, mode: "insensitive" }
        } : {}),

        ...(subSubCategoryContext ? {
          subSubCategory: { equals: subSubCategoryContext, mode: "insensitive" }
        } : {})
      },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        category: true,
        subCategory: true,
        subSubCategory: true,
        image: true,
        gallery: true,
        specs: true,
        price: true
      },
      take: 20 // Increased limit for "View All"
    });
    return products;
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
}

// --- ADD PRODUCT ACTION (UPDATED) ---
export async function addProduct(formData: FormData) {
  try {
    // 1. SECURITY CHECK
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized: You must login to post." };
    }

    // 2. GET & LOG DATA
    const name = formData.get("name") as string;
    const priceRaw = formData.get("price") as string;
    const category = formData.get("category") as string;
    const subCategory = formData.get("subCategory") as string;
    const quantityRaw = formData.get("quantity") as string;

    // 3. VALIDATION
    const price = parseFloat(priceRaw);
    const quantity = parseInt(quantityRaw) || 10;

    if (!name) return { success: false, error: "Missing Product Name" };
    if (!category) return { success: false, error: "Category is missing" };
    if (!subCategory) return { success: false, error: "Sub-Category is missing" };
    if (isNaN(price) || price <= 0) return { success: false, error: "Price must be a valid number greater than 0" };

    // 4. OPTIONAL FIELDS
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const subSubCategory = formData.get("subSubCategory") as string;
    const unit = formData.get("unit") as string;

    // SKU Logic
    const rawSku = formData.get("sku") as string;
    const finalSku = rawSku && rawSku.trim() !== ""
      ? rawSku
      : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5. IMAGE LOGIC (COMBINE NEW UPLOADS + EXISTING TEMPLATE URLS)

    let gallery: string[] = [];

    // A. Handle "Existing" Images (from the template/clone)
    // We retrieve all "existingImages" entries from the FormData
    const existingImages = formData.getAll("existingImages") as string[];
    if (existingImages.length > 0) {
      gallery = [...existingImages];
    }

    // B. Handle "New" Uploads
    const imageFiles = formData.getAll("images") as File[];
    const manualUrl = formData.get("imageUrl") as string;

    if (imageFiles && imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          if (file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await uploadToCloudinary(buffer);
            gallery.push(result.secure_url);
          }
        }
      } catch (uploadError) {
        console.error("Image Upload Failed:", uploadError);
        return { success: false, error: "Image upload failed" };
      }
    }

    if (manualUrl && manualUrl.trim() !== "") {
      gallery.push(manualUrl);
    }

    // C. Determine Main Image
    const mainImage = gallery.length > 0 ? gallery[0] : "";

    // 6. GENERATE SLUG
    const uniqueSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    // 7. SAVE TO DATABASE
    await prisma.product.create({
      data: {
        vendorId: userId,
        name,
        title: title || name,
        description: description || "",
        slug: uniqueSlug,
        category,
        subCategory,
        subSubCategory: subSubCategory || "",
        image: mainImage,
        imagePath: mainImage,
        gallery: gallery,
        price,
        quantity,
        sku: finalSku,
        brand: "Generic",
        specs: {
          unit: unit || "Piece"
        },
        status: "PENDING"
      },
    });

    revalidatePath("/");
    return { success: true };

  } catch (error) {
    console.error("Add Product Fatal Error:", error);
    return { success: false, error: `Server Error: ${(error as Error).message}` };
  }
}

// --- DELETE PRODUCT ACTION ---
export async function deleteProduct(productId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.vendorId !== userId) {
      return { success: false, error: "Forbidden: You do not own this product" };
    }

    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

// --- GET SUB-SUB CATEGORIES HELPER ---
export async function getExistingSubSubCategories(subCategory: string) {
  if (!subCategory) return [];
  try {
    const results = await prisma.product.findMany({
      where: { subCategory: subCategory, subSubCategory: { not: "" } },
      select: { subSubCategory: true },
      distinct: ["subSubCategory"],
    });
    return results.map((r) => r.subSubCategory).filter((val): val is string => !!val);
  } catch (error) {
    return [];
  }
}

// --- ADMIN ACTIONS (For your Admin Panel) ---

export async function approveProduct(productId: string) {
  // Ideally, check if userId is ADMIN_ID here for extra security
  await prisma.product.update({
    where: { id: productId },
    data: {
      isPublished: true,
      status: "APPROVED"
    },
  });
  revalidatePath("/");
  return { success: true };
}

export async function rejectProduct(productId: string) {
  // Ideally, check if userId is ADMIN_ID here for extra security
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/");
  return { success: true };
}