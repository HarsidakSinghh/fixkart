"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { sendNotification } from "@/lib/notifications"; 

// --- 1. CONFIG CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- 2. HELPER: UPLOAD IMAGE ---
async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "fixkart-products" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Error:", error);
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );
    uploadStream.end(buffer);
  });
}

// --- 3. GET VENDOR STATUS ---
export async function getVendorStatus() {
  const { userId } = await auth();
  if (!userId) return null;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { status: true } 
  });

  return vendor?.status || null; 
}

// --- 4. REGISTER VENDOR ---
export async function registerVendor(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Local helper for this function to handle optional files
  const uploadFile = async (key: string) => {
    const file = formData.get(key) as File;
    if (file && file.size > 0 && file.name !== "undefined") {
      return await uploadToCloudinary(file);
    }
    return "";
  };

  try {
    // 1. Upload all documents
    const gstCertUrl = await uploadFile("gstCertificate");
    const msmeCertUrl = await uploadFile("msmeCertificate");
    const panCardUrl = await uploadFile("panCard");
    const aadharCardUrl = await uploadFile("aadharCard");
    const ownerPhotoUrl = await uploadFile("ownerPhoto");
    const cancelledChequeUrl = await uploadFile("cancelledCheque");
    const locationPhotoUrl = await uploadFile("locationImage");
    
    // Backup Contact IDs
    const backup1IdUrl = await uploadFile("backup1IdProof");
    const backup2IdUrl = await uploadFile("backup2IdProof");

    const fullName = formData.get("fullName") as string;
    const companyName = formData.get("companyName") as string;

    // 2. Save to Database
    await prisma.vendorProfile.create({
      data: {
        userId,
        status: "PENDING",

        // --- Basic Info ---
        fullName: fullName,
        companyName: companyName,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        postalCode: formData.get("postalCode") as string,

        // --- Business Details ---
        category: (formData.get("businessType") as string) || "Retailer", 
        businessType: "Proprietorship", 

        yearsInBusiness: formData.get("yearsInBusiness") as string,
        gstNumber: formData.get("gstNumber") as string,
        tradeLicense: formData.get("tradeLicense") as string,

        // --- Document URLs ---
        gstCertificateUrl: gstCertUrl,
        msmeCertificateUrl: msmeCertUrl,
        panCardUrl: panCardUrl,
        aadharCardUrl: aadharCardUrl,
        ownerPhotoUrl: ownerPhotoUrl,

        // --- Banking ---
        bankName: formData.get("bankName") as string,
        accountHolder: formData.get("accountHolder") as string,
        accountNumber: formData.get("accountNumber") as string,
        ifscCode: formData.get("ifscCode") as string,
        cancelledChequeUrl: cancelledChequeUrl,

        // --- Backup Contacts ---
        backup1Name: formData.get("backup1Name") as string,
        backup1Phone: formData.get("backup1Phone") as string,
        backup1IdUrl: backup1IdUrl,

        backup2Name: formData.get("backup2Name") as string,
        backup2Phone: formData.get("backup2Phone") as string,
        backup2IdUrl: backup2IdUrl,

        // --- Location ---
        contactPerson: formData.get("contactPerson") as string,
        gpsLat: parseFloat(formData.get("gpsLat") as string) || 0,
        gpsLng: parseFloat(formData.get("gpsLng") as string) || 0,
        locationPhotoUrl: locationPhotoUrl,

        // --- Legacy/Required Schema Fields ---
        idProofType: "AADHAR_PAN_UPLOADED", 
        idProofNumber: "SEE_FILES", 
        idProofUrl: aadharCardUrl || panCardUrl, 
      }
    });

    // --- 3. NOTIFY ADMIN ---
    await sendNotification("VENDOR_REGISTERED", {
        name: `${companyName} (${fullName})`,
        toEmail: null, 
        orderId: ""    
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Vendor Registration Error:", error);
    return { success: false, error: "Failed to register" };
  }
}

// --- 5. UPDATE PRODUCT (WITH IMAGE LOGIC) ---
export async function updateProduct(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const quantity = parseInt(formData.get("quantity") as string);

  if (!id || !name || !price) {
    return { error: "Missing required fields" };
  }

  try {
    // 1. Verify Ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || existingProduct.vendorId !== userId) {
      return { error: "Product not found or unauthorized" };
    }

    // 2. HANDLE IMAGES
    // A. Get the list of OLD images the user explicitly kept in the UI
    const keptImages = formData.getAll("keptImages") as string[];

    // B. Get the list of NEW files to UPLOAD
    const newFiles = formData.getAll("newImages") as File[];
    
    // C. Upload new files to Cloudinary
    const newUploadedUrls: string[] = [];
    for (const file of newFiles) {
      if (file.size > 0 && file.name !== "undefined") {
        const url = await uploadToCloudinary(file);
        newUploadedUrls.push(url);
      }
    }

    // D. Combine: Kept Images + New Images
    // This effectively "Deletes" any old image not in 'keptImages'
    const finalGallery = [...keptImages, ...newUploadedUrls];
    
    // Ensure there is at least one main image
    const mainImage = finalGallery.length > 0 ? finalGallery[0] : "";

    // 3. Update Database
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        title: name, 
        description,
        price,
        quantity,
        image: mainImage,       // First image is main
        gallery: finalGallery,  // This overwrites the old list
        updatedAt: new Date(),
      },
    });

    // 4. Refresh Cache
    revalidatePath("/vendor/inventory");
    revalidatePath(`/vendor/products/${updatedProduct.slug}`);
    revalidatePath(`/product/${updatedProduct.slug}`);

    return { success: true, slug: updatedProduct.slug };

  } catch (error) {
    console.error("Update Error:", error);
    return { error: "Failed to update product." };
  }
}

// --- 6. DELETE PRODUCT ---
export async function deleteProduct(formData: FormData) {
   // Add delete logic here if needed
   return { success: true }; 
}